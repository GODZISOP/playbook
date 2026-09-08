import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import ScrollFrameAnimation from './components/ScrollFrameAnimation';

const heroFrames = Array.from({ length: 336 }, (_, i) => 
  `/hero-frames/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`
);
export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Global scroll for animations
  const { scrollY } = useScroll();

  // --- Travelling Product Animation ---
  // Start at top right of hero
  // Zig-zag (left-right) as it scrolls down to mimic writing
  const scrollKeyframes = [0, 450, 900, 1350, 1800, 2250, 2700, 3150, 3600];
  const productX = useTransform(scrollY, scrollKeyframes, ["70vw", "30vw", "60vw", "20vw", "50vw", "10vw", "40vw", "20vw", "50vw"]);
  const productY = useTransform(scrollY, scrollKeyframes, ["30vh", "60vh", "90vh", "120vh", "150vh", "180vh", "210vh", "230vh", "240vh"]);
  const productRotate = useTransform(scrollY, scrollKeyframes, [-10, 15, -5, 20, -10, 25, -15, 10, -25]);
  const productScale = useTransform(scrollY, [0, 3600], [1.2, 1.5]); // Increased overall size
  
  // Fade out once it's past the demonstration section
  const productOpacity = useTransform(scrollY, [3800, 4000], [1, 0]);
  
  // To avoid pointer-events when hidden
  const productVisibility = useTransform(scrollY, [3800, 4000], ["visible", "hidden"]);

  // --- Parallax Masonry Animation ---
  const masonryRef = useRef(null);
  const { scrollYProgress: masonryScroll } = useScroll({
    target: masonryRef,
    offset: ["start end", "end start"]
  });
  
  // Parallax transforms for the 3 image columns
  const col1Y = useTransform(masonryScroll, [0, 1], [0, -100]);
  const col2Y = useTransform(masonryScroll, [0, 1], [0, -350]);
  const col3Y = useTransform(masonryScroll, [0, 1], [0, -200]);



  return (
    <div className="min-h-screen relative w-full selection:bg-[var(--brand-dark)] selection:text-white font-sans text-base leading-relaxed">
      
      {/* The Travelling Product */}
      {!prefersReducedMotion && isMounted && (
        <motion.div 
          className="fixed z-20 pointer-events-none"
          style={{
            left: productX,
            top: productY,
            rotate: productRotate,
            scale: productScale,
            opacity: productOpacity,
            visibility: productVisibility,
            x: "-50%",
            y: "-50%"
          }}
        >
          <img 
            src="/pen.png" 
            alt="The Student Playbook" 
            className="w-[340px] h-auto drop-shadow-xl"
          />
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full h-[70px] bg-[var(--bg-cream)]/90 backdrop-blur-md border-b border-[var(--hairline)] z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          {/* High Quality SVG Logo */}
          <svg viewBox="0 0 100 100" className="w-10 h-10 flex-shrink-0">
            <circle cx="50" cy="50" r="50" fill="#93CFFF" />
            <rect x="24" y="27" width="52" height="46" fill="#181818" />
            <text 
              x="50" 
              y="63" 
              fontSize="40" 
              fontWeight="900" 
              fontFamily="Arial Black, Impact, sans-serif" 
              textAnchor="middle" 
              fill="#93CFFF" 
              letterSpacing="-2"
            >
              SP
            </text>
          </svg>
          <span className="text-[12px] uppercase opacity-70 tracking-widest font-bold mt-1 text-[var(--text-dark)]">THE PLAYBOOK</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex gap-6">
            {['Spotlights', 'Playbooks', 'Action'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text-dark)] hover:text-[var(--brand-dark)] transition-colors">
                {link}
              </a>
            ))}
          </div>
          <button className="px-6 py-2 bg-[var(--brand-dark)] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all rounded-sm shadow-sm">
            Join
          </button>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <main className="pt-[70px]">
        
        {/* Section 1: Hero */}
        <section className="relative min-h-[calc(100vh-70px)] flex flex-col bg-[var(--bg-blue)] overflow-hidden">
          <div className="max-w-7xl mx-auto w-full px-8 pt-24 pb-12 flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <div className="flex flex-col text-[var(--text-dark)] z-10 pt-12">
              <h1 className="text-5xl md:text-[5.5rem] font-bold leading-[1.1] mb-8 text-[var(--brand-dark)] uppercase">
                WELCOME TO<br/>THE PLAYBOOK
              </h1>
              
              {/* Inner Card matching carousel style exactly */}
              <div className="bg-[var(--brand-dark)] text-white p-8 md:p-10 rounded-sm shadow-lg max-w-lg">
                <h3 className="text-2xl font-bold mb-4">What is The Student Playbook?</h3>
                <p className="mb-8 text-lg font-medium opacity-90 leading-relaxed">
                  An online platform high lifting student leadership in Columbus so YOU can be inspired to join a network of passionate teens as they make their mark in the community!
                </p>
                <h3 className="text-2xl font-bold mb-4">Why should I be a part of this?</h3>
                <p className="mb-6 text-lg font-medium opacity-90 leading-relaxed">
                  Being a part of this program means supporting your peers who wake up everyday and use what they love to do good in their community.
                </p>
                <p className="text-lg font-medium opacity-90 leading-relaxed">
                  Be a part of the movement to bring awareness to what today's teenagers are doing, and find the support to make change yourself!
                </p>
              </div>
            </div>
            
            <div className="flex justify-center items-center pointer-events-none hidden md:flex">
                <img 
                  src="/aashi_billboard.png" 
                  alt="Meet Aashi Graphic" 
                  className="w-[90%] h-auto object-contain shadow-2xl"
                />
            </div>

          </div>
        </section>

        {/* Section 2: Spotlights (Parallax Masonry) */}
        <section id="spotlights" className="px-8 py-32 bg-[var(--brand-dark)] text-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row gap-12 justify-between mb-24">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-[13px] font-bold tracking-widest uppercase opacity-80 md:w-1/4 pt-2"
              >
                STUDENT SPOTLIGHTS
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="md:w-3/4"
              >
                <h2 className="text-4xl md:text-6xl font-bold leading-[1.1] uppercase">
                  MEET THE PASSIONATE TEENS MAKING THEIR MARK IN COLUMBUS
                </h2>
              </motion.div>
            </div>
            
            {/* Parallax Masonry Grid */}
            <div ref={masonryRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[900px]">
              
              {/* Column 1 (Slow) */}
              <motion.div style={{ y: prefersReducedMotion ? 0 : col1Y }} className="flex flex-col gap-6 pt-12">
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group overflow-hidden rounded-md aspect-[3/4] bg-[var(--bg-blue)] shadow-xl"
                >
                  <img src="/poster_1.png" alt="Student Spotlight" className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                  <div className="absolute inset-0 bg-black/10 transition-colors duration-700 group-hover:bg-black/0"></div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group overflow-hidden rounded-md aspect-square bg-[var(--bg-cream)] shadow-xl"
                >
                  <img src="/gen_1.jpg" alt="Student Leader" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                  <div className="absolute inset-0 bg-black/10 transition-colors duration-700 group-hover:bg-black/0"></div>
                </motion.div>
              </motion.div>

              {/* Column 2 (Fast) */}
              <motion.div style={{ y: prefersReducedMotion ? 0 : col2Y }} className="flex flex-col gap-6 pt-32">
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group overflow-hidden rounded-md aspect-square bg-white shadow-xl"
                >
                  <img src="/gen_2.jpg" alt="Student Collaboration" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                  <div className="absolute inset-0 bg-black/10 transition-colors duration-700 group-hover:bg-black/0"></div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1.2, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group overflow-hidden rounded-md aspect-[3/4] bg-[var(--bg-blue)] shadow-xl flex items-center justify-center"
                >
                  <img src="/poster_2.png" alt="Student Spotlight" className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                  <div className="absolute inset-0 bg-black/30 transition-colors duration-700 group-hover:bg-black/10"></div>
                  {/* Play Button Mock */}
                  <div className="w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center pl-2 shadow-lg cursor-pointer hover:bg-white/80 hover:scale-[1.15] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-10">
                    <svg className="w-8 h-8 text-white hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </motion.div>
              </motion.div>

              {/* Column 3 (Medium) */}
              <motion.div style={{ y: prefersReducedMotion ? 0 : col3Y }} className="flex flex-col gap-6 pt-8">
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group overflow-hidden rounded-md aspect-[3/4] bg-[var(--bg-cream)] shadow-xl"
                >
                  <img src="/poster_3.png" alt="Student Spotlight" className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                  <div className="absolute inset-0 bg-black/10 transition-colors duration-700 group-hover:bg-black/0"></div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group overflow-hidden rounded-md aspect-[4/5] bg-[var(--bg-blue)] shadow-xl"
                >
                  <img src="/gen_3.jpg" alt="Student Speaking" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                  <div className="absolute inset-0 bg-black/10 transition-colors duration-700 group-hover:bg-black/0"></div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 3: The Why */}
        <section className="px-8 py-32 bg-[var(--brand-dark)] text-white overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            {/* Left Side: Staggered Masked Text Reveal */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-100px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: {},
              }}
            >
              {/* Heading Mask */}
              <div className="overflow-hidden mb-8">
                <motion.h2 
                  variants={{
                    hidden: { y: "110%" },
                    visible: { y: "0%", transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="text-5xl md:text-6xl leading-tight font-bold"
                >
                  Why is Student Leader Awareness so Important?
                </motion.h2>
              </div>

              {/* Paragraph Mask */}
              <div className="overflow-hidden mb-8">
                <motion.p 
                  variants={{
                    hidden: { y: "110%" },
                    visible: { y: "0%", transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="text-lg opacity-90 font-medium"
                >
                  Student leaders, now more than ever are making an impact and inspiring people of all ages.
                </motion.p>
              </div>

              {/* Bullets Mask */}
              <ul className="space-y-4 font-semibold text-lg opacity-90">
                {[
                  "Making their own choices",
                  "Making community changes",
                  "Inspiring people of all ages, from children to adults"
                ].map((text, i) => (
                  <div key={i} className="overflow-hidden">
                    <motion.li 
                      variants={{
                        hidden: { y: "110%" },
                        visible: { y: "0%", transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
                      }}
                      className="flex items-center gap-3"
                    >
                      <span className="w-2 h-2 bg-white rounded-full shrink-0"></span>
                      {text}
                    </motion.li>
                  </div>
                ))}
              </ul>
            </motion.div>
            
            {/* Right Side: Clip-path / Block Reveal */}
            <div className="relative">
               <motion.div 
                 initial={{ clipPath: "inset(100% 0 0 0)" }}
                 whileInView={{ clipPath: "inset(0% 0 0 0)" }}
                 viewport={{ once: false, margin: "-100px" }}
                 transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                 className="bg-[var(--bg-blue)] p-12 text-[var(--text-dark)] rounded-sm shadow-2xl text-center border border-white/20 transform hover:scale-[1.02] transition-transform duration-700 ease-out"
               >
                 <div className="overflow-hidden mb-4">
                   <motion.h3 
                     initial={{ y: "110%" }}
                     whileInView={{ y: "0%" }}
                     viewport={{ once: false, margin: "-100px" }}
                     transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                     className="text-2xl font-bold uppercase text-[var(--brand-dark)]"
                   >
                     Be ready for our next set of spotlights!
                   </motion.h3>
                 </div>
                 <motion.div 
                   initial={{ scaleX: 0 }}
                   whileInView={{ scaleX: 1 }}
                   viewport={{ once: false, margin: "-100px" }}
                   transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                   className="w-16 h-1 bg-[var(--brand-dark)] mx-auto mt-6 origin-left"
                 ></motion.div>
               </motion.div>
            </div>
          </div>
        </section>

        {/* Section 4: Cinematic Scroll Frame */}
        <ScrollFrameAnimation 
          frames={heroFrames}
          title="THE PLAYBOOK"
          subtitle="Inspiring The Next Generation"
          fit="cover"
          scrollDistance="800vh"
          priorityLoadCount={15}
          overlayOpacity={0}
        />

        {/* Section 5: Measurements (Action) */}
        <section id="action" className="px-8 py-32 bg-[var(--bg-cream)]">
          <div className="max-w-4xl mx-auto flex flex-col border-t-4 border-[var(--brand-dark)] pt-12 bg-white p-8 md:p-12 rounded-sm shadow-sm border-x border-b border-[var(--hairline)]">
            <h2 className="text-5xl mb-8 text-[var(--brand-dark)]">WHAT'S NEXT??</h2>
            <p className="font-bold text-lg mb-8 opacity-80 text-[var(--text-dark)]">You've read about them... now TAKE ACTION!</p>
            <div className="space-y-6">
              {[
                ['Step 1', 'Starting your project can be the hardest part.'],
                ['Step 2', 'Rely on other leaders who are going on a similar path as you to guide the way.'],
                ['Step 3', 'Determination, passion, and consistency are key components.']
              ].map(([label, desc]) => (
                <div key={label} className="p-6 bg-[var(--bg-blue)] rounded-sm flex flex-col md:flex-row items-baseline gap-4 border border-[var(--brand-dark)]/20">
                  <div className="text-[var(--brand-dark)] font-bold text-xl uppercase whitespace-nowrap">{label}</div>
                  <div className="text-[var(--text-dark)] font-medium text-lg">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Close */}
        <section className="px-8 pt-32 pb-16 bg-[var(--brand-dark)] text-white flex flex-col items-center text-center">
          <h2 className="text-5xl md:text-6xl mb-6">
            Now it's your turn...
          </h2>
          <p className="text-xl mb-12 max-w-2xl font-medium opacity-90">
            What kinds of leaders do you want to see on this page? Send in your answers in the comments below! Be ready for more spotlights!
          </p>
          <div className="flex gap-4 z-10 mb-20">
            <button className="px-8 py-4 bg-[var(--bg-blue)] text-[var(--text-dark)] font-bold tracking-widest uppercase hover:bg-opacity-90 transition-all shadow-lg rounded-sm">
              Instagram
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold tracking-widest uppercase hover:bg-white hover:text-[var(--brand-dark)] transition-all shadow-lg rounded-sm">
              Contact Us
            </button>
          </div>
          
          <div className="w-full border-t border-white/20 pt-8 flex justify-between">
            <div className="text-sm font-bold opacity-70">© 2026 THE STUDENT PLAYBOOK</div>
            <div className="text-sm font-bold flex gap-6 opacity-70">
              <a href="#" className="hover:opacity-100 transition-opacity">INSTAGRAM</a>
              <a href="#" className="hover:opacity-100 transition-opacity">EMAIL</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
