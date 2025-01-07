import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ArrowKeys = () => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setPressedKey(e.key);
      }
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const arrowButton = (direction: string, rotation: number) => (
    <motion.button
      className={`w-12 h-12 rounded-lg border-2 ${
        pressedKey === direction ? 'bg-green-500 border-green-600' : 'bg-gray-700 border-gray-600'
      } flex items-center justify-center transform`}
      animate={{
        scale: pressedKey === direction ? 0.9 : 1,
        backgroundColor: pressedKey === direction ? '#22c55e' : '#374151'
      }}
      style={{ rotate: rotation }}
    >
      <svg
        className="w-6 h-6 text-white"
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
      className="grid grid-cols-3 gap-2 mt-8"
    >
      <div></div>
      {arrowButton('ArrowUp', 0)}
      <div></div>
      {arrowButton('ArrowLeft', -90)}
      <div className="w-12 h-12"></div>
      {arrowButton('ArrowRight', 90)}
      <div></div>
      {arrowButton('ArrowDown', 180)}
      <div></div>
    </motion.div>
  );
};

export default ArrowKeys;