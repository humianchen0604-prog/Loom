/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';

export default function App() {
  const cursorX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const cursorY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  // The label spring physics to create a smooth, slight delay
  const springConfig = { damping: 22, stiffness: 150, mass: 0.8 };
  const labelX = useSpring(cursorX, springConfig);
  const labelY = useSpring(cursorY, springConfig);

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Hide default cursor across the entire app
    document.documentElement.style.cursor = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!hasInteracted) setHasInteracted(true);
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!hasInteracted) setHasInteracted(true);
      cursorX.set(e.touches[0].clientX);
      cursorY.set(e.touches[0].clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.documentElement.style.cursor = 'auto'; // Reset on unmount
    };
  }, [cursorX, cursorY, hasInteracted]);


  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F3F3F5] overflow-hidden select-none font-sans relative">
      
      {/* Background Content */}
      <h1 className="text-[#A1A1A5] font-medium text-lg tracking-tight select-none">
        Move your mouse to interact
      </h1>

      {/* Label */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-40"
        style={{
          x: labelX,
          y: labelY,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: hasInteracted ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* We use an arbitrary margin (ml-5 mt-6) to visually attach the label to the bottom right of the cursor */}
        <div 
          className="ml-5 mt-6 px-4 py-2 rounded-full rounded-tl-none text-white font-medium text-[15px] border whitespace-nowrap flex items-center shadow-lg"
          style={{ 
            backgroundColor: '#FF7E00',
            borderColor: '#DA6B00',
            // Soft colored drop shadow matching the orange tone
            boxShadow: '0 8px 30px -6px rgba(255, 126, 0, 0.5), 0 4px 14px -4px rgba(255, 126, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
          }}
        >
          Jin, Product Designer
        </div>
      </motion.div>

      {/* Custom Cursor */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 transform"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: hasInteracted ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="-translate-x-[2px] -translate-y-[2px] drop-shadow-md"
        >
          <path 
            d="M2 2L18 8L10 11L7 19L2 2Z" 
            fill="#080808" 
            stroke="#FFFFFF" 
            strokeWidth="2" 
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
