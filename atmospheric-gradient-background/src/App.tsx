/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import React from 'react';

export default function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50">
      {/* 
        Background gradient blobs 
        Using pure color divs heavily blurred to create a seamless, texture-less gradient map 
      */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Purple Blob 1 */}
        <motion.div
          className="absolute -left-[10%] -top-[10%] w-[60vw] h-[65vw] max-w-[800px] max-h-[850px] rounded-[40%_60%_70%_30%] bg-[#C7A2FF] blur-[120px] opacity-50"
          animate={{
            x: ['0vw', '25vw', '-10vw', '0vw'],
            y: ['0vh', '20vh', '30vh', '0vh'],
            scale: [1, 1.4, 0.9, 1],
            rotate: [0, 120, 240, 360],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Green Blob 1 */}
        <motion.div
          className="absolute -right-[10%] -top-[5%] w-[55vw] h-[50vw] max-w-[750px] max-h-[700px] rounded-[60%_40%_30%_70%] bg-[#D5FF3C] blur-[120px] opacity-40"
          animate={{
            x: ['0vw', '-30vw', '15vw', '0vw'],
            y: ['0vh', '25vh', '-10vh', '0vh'],
            scale: [0.9, 1.3, 1.1, 0.9],
            rotate: [360, 240, 120, 0],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Purple Blob 2 */}
        <motion.div
          className="absolute -right-[20%] -bottom-[20%] w-[70vw] h-[75vw] max-w-[900px] max-h-[950px] rounded-[50%_50%_40%_60%] bg-[#C7A2FF] blur-[140px] opacity-50"
          animate={{
            x: ['0vw', '-25vw', '20vw', '0vw'],
            y: ['0vh', '-20vh', '-30vh', '0vh'],
            scale: [1, 0.8, 1.2, 1],
            rotate: [0, -120, -240, -360],
          }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Green Blob 2 */}
        <motion.div
          className="absolute -left-[15%] -bottom-[15%] w-[60vw] h-[55vw] max-w-[850px] max-h-[800px] rounded-[30%_70%_60%_40%] bg-[#D5FF3C] blur-[130px] opacity-40"
          animate={{
            x: ['0vw', '20vw', '-25vw', '0vw'],
            y: ['0vh', '-25vh', '20vh', '0vh'],
            scale: [1.1, 0.9, 1.2, 1.1],
            rotate: [0, 180, 270, 360],
          }}
          transition={{
            duration: 38,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Central Neutralizing/Blending Blob */}
        <motion.div
          className="absolute left-[20%] top-[20%] w-[45vw] h-[45vw] max-w-[650px] max-h-[650px] rounded-[45%_55%_45%_55%] bg-[#C7A2FF] blur-[120px] opacity-30"
          animate={{
            x: ['0vw', '20vw', '-15vw', '0vw'],
            y: ['0vh', '-15vh', '25vh', '0vh'],
            scale: [0.8, 1.4, 0.9, 0.8],
            rotate: [0, 90, 180, 360],
          }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}
