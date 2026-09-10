import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';

/**
 * Intelligent multi-tier frame loader with scroll-aware priority queue and concurrency pool.
 * Guarantees zero blank frames, rapid bootstrap, and instant responsiveness on Vercel/network latency.
 */
function useSmartFrameLoader(frames, priorityLoadCount = 35, onFrameAvailable) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const totalFrames = frames.length;
  
  const imagesRef = useRef([]);
  // Status: 0 = unrequested, 1 = loading, 2 = loaded, 3 = failed
  const statusRef = useRef(new Uint8Array(totalFrames));
  const targetFrameRef = useRef(0);
  const activeWorkersRef = useRef(0);
  const isReadyRef = useRef(false);

  // Expose function to update target frame for priority queue
  const updateTargetFrame = useCallback((frame) => {
    targetFrameRef.current = Math.max(0, Math.min(totalFrames - 1, frame));
  }, [totalFrames]);

  useEffect(() => {
    if (totalFrames === 0) return;

    let isCancelled = false;
    imagesRef.current = new Array(totalFrames).fill(null);
    statusRef.current = new Uint8Array(totalFrames);
    setLoadedCount(0);
    setIsReady(false);
    isReadyRef.current = false;
    activeWorkersRef.current = 0;

    // CONCURRENCY LIMIT: 6 concurrent HTTP/2 requests (standard browser throughput without queue thrashing)
    const MAX_CONCURRENT = 6;

    // Select bootstrap keyframes across the entire sequence so the whole animation is playable immediately
    const bootstrapSet = new Set();
    // First 12 frames for instant start
    for (let i = 0; i < Math.min(12, totalFrames); i++) {
      bootstrapSet.add(i);
    }
    // Keyframes every 8th frame across the entire timeline (0% to 100%)
    for (let i = 0; i < totalFrames; i += 8) {
      bootstrapSet.add(i);
    }
    // Final frames
    bootstrapSet.add(totalFrames - 1);
    const bootstrapRequired = Math.min(bootstrapSet.size, Math.max(20, priorityLoadCount));

    let bootstrapLoaded = 0;

    // Prioritization function: returns the next best frame index to fetch
    const getNextFrameIndex = () => {
      const currentTarget = targetFrameRef.current;
      const status = statusRef.current;

      // Phase A: During bootstrap, prioritize keyframes first
      if (!isReadyRef.current) {
        for (const idx of bootstrapSet) {
          if (status[idx] === 0) return idx;
        }
      }

      // Phase B: Scroll-aware priority window
      // 1. Immediate view window: [target - 3, target + 18]
      for (let offset = 0; offset <= 18; offset++) {
        const fwd = currentTarget + offset;
        if (fwd < totalFrames && status[fwd] === 0) return fwd;
        const bwd = currentTarget - offset;
        if (bwd >= 0 && status[bwd] === 0) return bwd;
      }

      // 2. Medium view window: [target - 12, target + 40]
      for (let offset = 19; offset <= 40; offset++) {
        const fwd = currentTarget + offset;
        if (fwd < totalFrames && status[fwd] === 0) return fwd;
        const bwd = currentTarget - offset;
        if (bwd >= 0 && status[bwd] === 0) return bwd;
      }

      // 3. Any unloaded keyframes (every 4th frame)
      for (let i = 0; i < totalFrames; i += 4) {
        if (status[i] === 0) return i;
      }

      // 4. Closest unloaded frame to currentTarget
      let closestIdx = -1;
      let minDistance = Infinity;
      for (let i = 0; i < totalFrames; i++) {
        if (status[i] === 0) {
          const dist = Math.abs(i - currentTarget);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = i;
          }
        }
      }

      return closestIdx;
    };

    // Worker pump: pulls work and executes
    const pumpWorkers = () => {
      if (isCancelled) return;

      while (activeWorkersRef.current < MAX_CONCURRENT) {
        const nextIndex = getNextFrameIndex();
        if (nextIndex === -1) break; // All frames are loading or loaded

        statusRef.current[nextIndex] = 1; // Mark as loading
        activeWorkersRef.current++;

        const img = new Image();
        img.decoding = 'async';

        img.onload = () => {
          if (isCancelled) return;
          activeWorkersRef.current--;
          statusRef.current[nextIndex] = 2; // Loaded
          imagesRef.current[nextIndex] = img;

          setLoadedCount(prev => prev + 1);

          // Notify renderer that this frame is ready (for reactive redraw if close to target)
          if (onFrameAvailable) {
            onFrameAvailable(nextIndex);
          }

          // Check bootstrap readiness
          if (!isReadyRef.current) {
            if (bootstrapSet.has(nextIndex)) {
              bootstrapLoaded++;
            }
            if (bootstrapLoaded >= bootstrapRequired) {
              isReadyRef.current = true;
              setIsReady(true);
            }
          }

          // Continue pumping queue
          pumpWorkers();
        };

        img.onerror = () => {
          if (isCancelled) return;
          activeWorkersRef.current--;
          statusRef.current[nextIndex] = 3; // Failed
          // Continue pumping other frames
          pumpWorkers();
        };

        img.src = frames[nextIndex];
      }
    };

    // Start workers
    pumpWorkers();

    return () => {
      isCancelled = true;
    };
  }, [frames, priorityLoadCount, totalFrames, onFrameAvailable]);

  return {
    images: imagesRef.current,
    loadedCount,
    totalFrames,
    isReady,
    updateTargetFrame
  };
}

/**
 * Ultra-premium, cinematic scroll-driven frame animation component.
 * High-performance canvas rendering with reactive repaints and bidirectional fallback.
 */
export default function ScrollFrameAnimation({
  frames = [],
  title = "THE PLAYBOOK",
  subtitle = "Inspiring The Next Generation",
  fit = "cover",
  scrollDistance = "800vh",
  priorityLoadCount = 35,
  overlayOpacity = 0
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rAFRef = useRef(null);
  
  const currentTargetFrameRef = useRef(0);
  const lastRenderedFrameIndex = useRef(-1);

  // 1. Scroll Physics (Framer Motion)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Responsive spring: snappy stiffness with balanced damping for smooth buttery momentum
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 26,
    restDelta: 0.0005
  });

  // Typography Parallax Effects
  const textScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.92, 0.85]);
  const textOpacity = useTransform(smoothProgress, [0, 0.08, 0.92, 1], [0, 1, 1, 0]);
  const textY = useTransform(smoothProgress, [0, 1], ["0%", "-40%"]);

  // 2. High-Performance Canvas Rendering Logic with Bidirectional Closest-Neighbor Search
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const images = frameLoaderRef.current?.images || [];
    const total = frames.length;
    if (total === 0) return;

    let img = images[frameIndex];
    let actualFrameIndex = frameIndex;

    // If target frame is not fully loaded, search outward symmetrically (bidirectional)
    if (!img || !img.complete || img.naturalWidth === 0) {
      let found = false;
      for (let offset = 1; offset < total; offset++) {
        const prev = frameIndex - offset;
        if (prev >= 0 && images[prev]?.complete && images[prev].naturalWidth > 0) {
          img = images[prev];
          actualFrameIndex = prev;
          found = true;
          break;
        }
        const next = frameIndex + offset;
        if (next < total && images[next]?.complete && images[next].naturalWidth > 0) {
          img = images[next];
          actualFrameIndex = next;
          found = true;
          break;
        }
      }
      if (!found) return; // No frames ready yet
    }

    const nativeWidth = img.naturalWidth || img.width || 1280;
    const nativeHeight = img.naturalHeight || img.height || 720;

    if (canvas.width !== nativeWidth || canvas.height !== nativeHeight) {
      canvas.width = nativeWidth;
      canvas.height = nativeHeight;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the image
    ctx.drawImage(img, 0, 0, nativeWidth, nativeHeight);
    lastRenderedFrameIndex.current = actualFrameIndex;

    // Optional subtle overlay if requested (no forced black cut void)
    if (overlayOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
      ctx.fillRect(0, 0, nativeWidth, nativeHeight);
    }
  }, [frames.length, overlayOpacity]);

  // 3. Callback when any image loads: reactively re-render if it improves current frame
  const onFrameAvailable = useCallback((loadedIndex) => {
    const target = currentTargetFrameRef.current;
    const rendered = lastRenderedFrameIndex.current;

    // If what's rendered isn't the target, and this new frame is closer (or IS the target), re-draw immediately!
    const currentDist = rendered === -1 ? Infinity : Math.abs(rendered - target);
    const newDist = Math.abs(loadedIndex - target);

    if (newDist < currentDist || loadedIndex === target) {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      rAFRef.current = requestAnimationFrame(() => {
        drawFrame(target);
      });
    }
  }, [drawFrame]);

  // 4. Smart Frame Loader Hook
  const { images, loadedCount, totalFrames, isReady, updateTargetFrame } = useSmartFrameLoader(
    frames,
    priorityLoadCount,
    onFrameAvailable
  );

  // Store reference to images for fast drawFrame lookup
  const frameLoaderRef = useRef({ images });
  useEffect(() => {
    frameLoaderRef.current = { images };
  }, [images]);

  // 5. Scroll Progress Event Listener: updates target frame and renders
  useMotionValueEvent(smoothProgress, "change", (latestProgress) => {
    if (totalFrames === 0) return;

    const clamped = Math.max(0, Math.min(1, latestProgress));
    const targetFrame = Math.min(totalFrames - 1, Math.floor(clamped * (totalFrames - 1)));

    currentTargetFrameRef.current = targetFrame;
    updateTargetFrame(targetFrame);

    if (targetFrame !== lastRenderedFrameIndex.current) {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      rAFRef.current = requestAnimationFrame(() => {
        drawFrame(targetFrame);
      });
    }
  });

  // Fast scroll sync on raw scrollYProgress to immediately prioritize downloading ahead of spring lag
  useMotionValueEvent(scrollYProgress, "change", (latestRaw) => {
    if (totalFrames === 0) return;
    const clamped = Math.max(0, Math.min(1, latestRaw));
    const rawTarget = Math.min(totalFrames - 1, Math.floor(clamped * (totalFrames - 1)));
    updateTargetFrame(rawTarget);
  });

  // Initial draw & resize handling
  useEffect(() => {
    if (isReady && totalFrames > 0) {
      // Use current spring progress instead of defaulting to 0
      const currentProgress = Math.max(0, Math.min(1, smoothProgress.get() || 0));
      const initFrame = Math.min(totalFrames - 1, Math.floor(currentProgress * (totalFrames - 1)));
      currentTargetFrameRef.current = initFrame;
      drawFrame(initFrame);

      const handleResize = () => {
        drawFrame(currentTargetFrameRef.current);
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      };
    }
  }, [isReady, drawFrame, totalFrames, smoothProgress]);

  // Loader percentage
  const loadPercentage = totalFrames > 0 ? Math.min(100, Math.floor((loadedCount / totalFrames) * 100)) : 0;

  return (
    <div 
      ref={containerRef} 
      style={{ height: scrollDistance }} 
      className="relative w-full bg-black overscroll-y-none"
    >
      <div className="sticky top-0 w-full h-[100dvh] overflow-hidden flex items-center justify-center">
        
        {/* Canvas Surface with CSS object-fit */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{ 
            opacity: isReady ? 1 : 0, 
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            objectFit: fit
          }}
        />

        {/* Cinematic Typography Layer */}
        {isReady && (
          <motion.div 
            style={{ scale: textScale, opacity: textOpacity, y: textY }}
            className="relative z-10 text-center pointer-events-none mix-blend-difference px-4"
          >
            <h1 className="text-5xl sm:text-7xl md:text-[8rem] font-bold tracking-tighter text-white leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg sm:text-2xl md:text-3xl tracking-[0.2em] font-light text-white/80 mt-4 uppercase">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Minimalist Preloader */}
        {!isReady && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]"
          >
            <div className="text-white text-center">
              <div className="text-5xl md:text-6xl font-light tracking-tighter tabular-nums mb-4">
                {String(loadPercentage).padStart(2, '0')}%
              </div>
              <div className="w-48 md:w-56 h-[1px] bg-white/20 mx-auto overflow-hidden relative">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-white"
                  style={{ width: `${Math.max(5, loadPercentage)}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-white/50 mt-3 font-mono">
                Loading Experience
              </p>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
