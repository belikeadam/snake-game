import React from 'react';
import { motion } from 'framer-motion';

export type PowerUpType = 'SPEED' | 'MULTIPLIER' | 'SHIELD';

export interface PowerUpState {
  x: number;
  y: number;
  type: PowerUpType;
  active: boolean;
  duration: number;  
}

interface PowerUpProps {
  type: PowerUpType;
  x: number;
  y: number;
  cellSize: number;
}

const POWER_UP_COLORS = {
  SPEED: 'rgb(234, 179, 8)',    // yellow
  MULTIPLIER: 'rgb(168, 85, 247)', // purple
  SHIELD: 'rgb(59, 130, 246)'      // blue
};

const PowerUp: React.FC<PowerUpProps> = ({ type, x, y, cellSize }) => {
  return (
    <motion.div
      key={`powerup-${x}-${y}-${type}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className="absolute rounded-full flex items-center justify-center"
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        left: `${x * cellSize}px`,
        top: `${y * cellSize}px`,
        backgroundColor: POWER_UP_COLORS[type],
        boxShadow: `0 0 10px ${POWER_UP_COLORS[type]}`
      }}
    >
      {type === 'SPEED' && '⚡'}
      {type === 'MULTIPLIER' && '×2'}
      {type === 'SHIELD' && '🛡️'}
    </motion.div>
  );
};

export default PowerUp;