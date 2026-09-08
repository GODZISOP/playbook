import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';

/**
 * Custom hook to manage memory and progressively load a sequence of frames.
 * @param {string[]} frames Array of image URLs
 * @param {number} priorityLoadCount Number of images to load before hiding the loader
 * @returns {object} { images (array of Image objects), loadedCount, totalFrames, isReady }
 */
function useFrameLoader(frames, priorityLoadCount) {
  const [loadedCount, setLoadedCount] = useState(0);
  const imagesRef = useRef([]);

  useEffect(() => {
    let active = true;
    const total = frames.length;
    // Pre-allocate the array
    imagesRef.current = new Array(total).fill(null);
    setLoadedCount(0);

    const loadImages = async () => {
      if (total === 0) return;
      
      // 1. Load priority frames concurrently
      const priorityCount = Math.min(priorityLoadCount, total);
      const priorityFrames = frames.slice(0, priorityCount);
      const priorityPromises = priorityFrames.map((src, index) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (active) {
              imagesRef.current[index] = img;
              setLoadedCount(prev => prev + 1);
              resolve();
            }
          };
          img.onerror = resolve; // Continue even on error to not block
          img.src = src;
        });
      });

      await Promise.all(priorityPromises);

      // 2. Load the rest sequentially in the background to avoid freezing the main thread
      if (active) {
        for (let i = priorityCount; i < total; i++) {
          if (!active) break;
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              if (active) {
                imagesRef.current[i] = img;
                setLoadedCount(prev => prev + 1);
                resolve();
              }
            };
            img.onerror = resolve;
            img.src = frames[i];
          });
        }
      }
    };

    loadImages();

    return () => {
      active = false; // Cleanup if unmounted
    };
  }, [frames, priorityLoadCount]);

  return {
    images: imagesRef.current,
    loadedCount,
    totalFrames: frames.length,
    isReady: loadedCount >= Math.min(priorityLoadCount, frames.length)
  };
}

/**
 * Ultra-premium, cinematic scroll-driven frame animation component.
 */
export default function ScrollFrameAnimation({
  frames = [],
  title = "ZAIN SHABBIR",
  subtitle = "Creative Developer",
  fit = "cover",
  scrollDistance = "500vh",
  priorityLoadCount = 15,
  overlayOpacity = 0.4
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // 1. Progressive Image Loader
  const { images, loadedCount, totalFrames, isReady } = useFrameLoader(frames, priorityLoadCount);

  // 2. Scroll Physics (Lerping)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Apply a spring for high-end linear interpolation (lerp) deceleration.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70, // Controls how quickly it tries to reach the target
    damping: 25,   // Controls the friction/overshoot
    restDelta: 0.001
  });

  // Typography Parallax Effects - keep visible longer
  const textScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.9, 0.85]);
  const textOpacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const textY = useTransform(smoothProgress, [0, 1], ["0%", "-50%"]);

  // 3. Canvas Rendering Logic (Using Native CSS object-fit)
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize performance by disabling alpha
    let img = images[frameIndex];
    let actualFrameIndex = frameIndex;

    if (!img || !img.complete) {
      // Find the most recent frame before this one that is complete
      let found = false;
      for (let i = frameIndex - 1; i >= 0; i--) {
        if (images[i] && images[i].complete) {
          img = images[i];
          actualFrameIndex = i;
          found = true;
          break;
        }
      }
      if (!found) return; // If no previous frame is loaded, do nothing
    }

    // Use the exact native resolution of the frames (1280x720)
    // CSS object-fit will seamlessly handle High-DPI and aspect ratio cropping
    const nativeWidth = img.width || 1280;
    const nativeHeight = img.height || 720;

    if (canvas.width !== nativeWidth || canvas.height !== nativeHeight) {
      canvas.width = nativeWidth;
      canvas.height = nativeHeight;
    }

    // High-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the image exactly as it is into the buffer
    ctx.drawImage(img, 0, 0, nativeWidth, nativeHeight);
    
    // --- Cinematic Dip-to-Black Transition ---
    // The cut happens at frame 168. We'll fade to black 15 frames before, and fade in 15 frames after.
    let dynamicOverlay = overlayOpacity;
    const cutFrame = 168;
    const transitionLength = 15;
    
    if (actualFrameIndex >= cutFrame - transitionLength && actualFrameIndex <= cutFrame + transitionLength) {
      const distance = Math.abs(actualFrameIndex - cutFrame);
      const dipOpacity = 1 - (distance / transitionLength);
      // Ease in-out the opacity curve for a buttery smooth fade
      const easedOpacity = dipOpacity * dipOpacity * (3 - 2 * dipOpacity);
      dynamicOverlay = Math.max(dynamicOverlay, easedOpacity);
    }

    // Draw cinematic overlay
    if (dynamicOverlay > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${dynamicOverlay})`;
      ctx.fillRect(0, 0, nativeWidth, nativeHeight);
    }

  }, [images, overlayOpacity]);

  // 4. Render Loop mapped to Scroll Progress
  const rAFRef = useRef(null);
  const lastRenderedFrameIndex = useRef(-1);

  useMotionValueEvent(smoothProgress, "change", (latestProgress) => {
    // Only attempt to render if the priority images are ready
    if (!isReady || totalFrames === 0) return;

    // Calculate exact frame based on lerped progress (0 to totalFrames - 1)
    const targetFrame = Math.floor(latestProgress * (totalFrames - 1));
    const safeFrame = Math.max(0, Math.min(totalFrames - 1, targetFrame));

    // Only queue a redraw if the frame actually changed
    if (safeFrame !== lastRenderedFrameIndex.current) {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      
      rAFRef.current = requestAnimationFrame(() => {
        drawFrame(safeFrame);
        lastRenderedFrameIndex.current = safeFrame;
      });
    }
  });

  // Handle Initial Draw & Window Resizes
  useEffect(() => {
    if (isReady && totalFrames > 0) {
      // Force initial render at frame 0
      drawFrame(lastRenderedFrameIndex.current === -1 ? 0 : lastRenderedFrameIndex.current);
      
      const handleResize = () => {
        // Invalidate last frame so it recalculates scale
        drawFrame(lastRenderedFrameIndex.current === -1 ? 0 : lastRenderedFrameIndex.current);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isReady, drawFrame, totalFrames]);

  // Loader UI calculations
  const loadPercentage = totalFrames > 0 ? Math.floor((loadedCount / totalFrames) * 100) : 0;

  return (
    // Overscroll-behavior-y none prevents mobile pull-to-refresh
    <div ref={containerRef} style={{ height: scrollDistance }} className="relative w-full bg-black overscroll-y-none">
      
      <div className="sticky top-0 w-full h-[100dvh] overflow-hidden flex items-center justify-center">
        
        {/* The WebGL/Canvas Surface */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{ 
            opacity: isReady ? 1 : 0, 
            transition: "opacity 1s ease-in-out",
            objectFit: fit // 'cover' or 'contain'
          }}
        />

        {/* Premium Cinematic Typography Layer */}
        {isReady && (
          <motion.div 
            style={{ scale: textScale, opacity: textOpacity, y: textY }}
            className="relative z-10 text-center pointer-events-none mix-blend-difference px-4"
          >
            <h1 className="text-6xl md:text-[8rem] font-bold tracking-tighter text-white leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl md:text-3xl tracking-[0.2em] font-light text-white/80 mt-4 uppercase">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Premium Minimalist Preloader */}
        {!isReady && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]"
          >
            <div className="text-white text-center">
              <div className="text-6xl font-light tracking-tighter tabular-nums mb-4">
                {String(loadPercentage).padStart(2, '0')}%
              </div>
              <div className="w-48 h-[1px] bg-white/20 mx-auto overflow-hidden relative">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadPercentage}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
