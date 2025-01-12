import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ArrowKeysProps {
  onDirectionChange: (direction: string) => void;
}

const ArrowKeys = ({ onDirectionChange }: ArrowKeysProps) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const handleArrowClick = useCallback((direction: string) => {
    setPressedKeys(prev => new Set([...prev, direction]));
    onDirectionChange(direction);
    if (navigator.vibrate) navigator.vibrate(5);
  }, [onDirectionChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        onDirectionChange(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDirectionChange]);

  const arrowButton = (direction: string, rotation: number) => (
    <motion.button
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 ${
        pressedKeys.has(direction) ? 'bg-green-500 border-green-600' : 'bg-gray-700 border-gray-600'
      } flex items-center justify-center transform active:scale-95 transition-all duration-50 
      shadow-lg active:shadow-sm touch-none`}
      animate={{
        scale: pressedKeys.has(direction) ? 0.95 : 1,
        backgroundColor: pressedKeys.has(direction) ? '#22c55e' : '#374151'
      }}
      style={{ rotate: rotation }}
      onClick={() => handleArrowClick(direction)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleArrowClick(direction);
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 700, damping: 15 }} // Faster animation
    >
      <svg
        className="w-6 h-6 sm:w-8 sm:h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 15l7-7 7 7"
        />
      </svg>
    </motion.button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-0 right-0 px-4 sm:px-8 max-w-xl mx-auto select-none touch-none"
    >
      <div className="flex justify-between items-center">
        {/* Left Controls - More Compact */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            {arrowButton('ArrowUp', 0)}
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            {arrowButton('ArrowLeft', -90)}
          </div>
        </div>

        {/* Right Controls - More Compact */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {arrowButton('ArrowRight', 90)}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            {arrowButton('ArrowDown', 180)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArrowKeys;