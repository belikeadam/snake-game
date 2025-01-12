import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ArrowKeysProps {
  onDirectionChange: (direction: string) => void;
}

const ArrowKeys = ({ onDirectionChange }: ArrowKeysProps) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [lastTouchTime, setLastTouchTime] = useState(0);

  const handleArrowClick = useCallback((direction: string) => {
    const now = Date.now();
    if (now - lastTouchTime < 100) return; // Prevent double touches
    
    setPressedKey(direction);
    onDirectionChange(direction);
    setLastTouchTime(now);

    // Haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setTimeout(() => setPressedKey(null), 100); // Faster reset for better responsiveness
  }, [lastTouchTime, onDirectionChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleArrowClick(e.key);
      }
    };

    const handleTouchEnd = () => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleArrowClick]);

  const arrowButton = (direction: string, rotation: number) => (
    <motion.button
      className={`w-12 h-12 rounded-lg border-2 ${
        pressedKey === direction ? 'bg-green-500 border-green-600' : 'bg-gray-700 border-gray-600'
      } flex items-center justify-center transform active:scale-95 transition-transform duration-50`}
      animate={{
        scale: pressedKey === direction ? 0.9 : 1,
        backgroundColor: pressedKey === direction ? '#22c55e' : '#374151'
      }}
      style={{ rotate: rotation }}
      onClick={() => handleArrowClick(direction)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleArrowClick(direction);
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
    >
      <svg
        className="w-6 h-6 text-white transform transition-transform duration-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    </motion.button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-between w-full max-w-[600px] px-8 mt-8 select-none touch-none"
    >
      {/* Left Controls */}
      <div className="flex flex-col items-center space-y-4">
        {arrowButton('ArrowUp', 0)}
        {arrowButton('ArrowLeft', -90)}
      </div>

      {/* Right Controls */}
      <div className="flex flex-col items-center space-y-4">
        {arrowButton('ArrowRight', 90)}
        {arrowButton('ArrowDown', 180)}
      </div>
    </motion.div>
  );
};

export default ArrowKeys;