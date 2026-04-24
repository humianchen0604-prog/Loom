import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Using high-quality curated images from Unsplash
const IMAGES = [
  { id: 1, url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600&h=800", height: 400 },
  { id: 2, url: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&q=80&w=600&h=700", height: 350 },
  { id: 3, url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600&h=900", height: 450 },
  { id: 4, url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=600&h=750", height: 375 },
  { id: 5, url: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=600&h=850", height: 425 },
  { id: 6, url: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&q=80&w=600&h=800", height: 400 },
];

const VISIBLE_COUNT = 4;

export function StackedDeck() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Cycle the cards every 1.5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const visibleCards = Array.from({ length: VISIBLE_COUNT }, (_, i) => {
    const index = (currentIndex + i) % IMAGES.length;
    return {
      ...IMAGES[index],
      // Position 0 is the front card, 1 is behind it, etc.
      position: i,
    };
  });

  return (
    <div 
      className="relative w-full h-[600px] flex items-center justify-center pointer-events-none"
      style={{ perspective: 1200 }} // Added perspective to the container for natural 3D depth
    >
      {/* 
        AnimatePresence handles the exit animation of cards leaving the front of the stack.
        Elements that are removed from the visibleCards array will perform an exit animation.
      */}
      <AnimatePresence>
        {visibleCards.map((card) => {
          return (
            <motion.div
              key={card.id}
              className="absolute inset-0 m-auto overflow-hidden bg-white"
              style={{
                width: 320,
                height: card.height,
                borderRadius: 40,
                transformOrigin: "bottom center", // Anchor the perspective at the bottom
              }}
              // This acts as the initial state for the card moving into the stack at the back
              initial={{
                opacity: 0,
                y: 120, // Slide in from slightly below the lowest visible card
                scale: 0.8,
                rotateX: 20,
                boxShadow: "0 0px 0px 0px rgba(0, 0, 0, 0)",
              }}
              // The active layered state. Uses stagger based on its relative position in the stack
              animate={{
                opacity: 1 - card.position * 0.25, // Front to back fade: 1, 0.75, 0.5, 0.25
                // Compresses the gap for cards further back in the stack to match natural 3D perspective
                y: card.position * 28 - (card.position * card.position * 4), 
                scale: 1 - card.position * 0.06, // Gets slightly smaller backwards
                rotateX: card.position * 5, // Subtle 3D tilt back
                boxShadow: `0 ${30 - card.position * 8}px ${60 - card.position * 12}px -${15 - card.position * 3}px rgba(0, 0, 0, ${0.15 - card.position * 0.03}), 0 0 ${20 - card.position * 5}px rgba(0, 0, 0, 0.05)`,
                zIndex: VISIBLE_COUNT - card.position,
              }}
              // When the front card leaves
              exit={{
                y: -220, // Moves upward boldly
                opacity: 0, // Fades out completely
                scale: 0.95, // Shrinks slightly, like it's being tossed
                rotate: -4, // A subtle aesthetic rotation 
                rotateX: -10, // Tilts forward as it leaves
                boxShadow: "0 40px 80px -10px rgba(0, 0, 0, 0.2), 0 0 30px rgba(0, 0, 0, 0.05)",
                zIndex: 50, // Ensures it sits above any new card rotating to the front
              }}
              // Smooth, silky timing
              transition={{
                type: "tween",
                ease: [0.25, 0.1, 0.25, 1], // easeInOut cubic curve
                duration: 0.6,
              }}
            >
              <img
                src={card.url}
                alt="Stacked gallery card"
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
