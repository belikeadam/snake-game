import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PowerUpState, PowerUpType } from './PowerUpState'; 

interface Coordinate {
    x: number;
    y: number;
  }
  

interface PowerUpManagerProps {
    powerUp: PowerUpState | null;
    cellSize: number;
    isShieldActive: boolean;
  }
  
  const POWER_UP_COLORS: Record<PowerUpType, string> = {
    SPEED: 'rgb(234, 179, 8)',
    MULTIPLIER: 'rgb(168, 85, 247)',
    SHIELD: 'rgb(59, 130, 246)'
  };

const PowerUpManager: React.FC<PowerUpManagerProps> = ({
  powerUp,
  cellSize,
  isShieldActive
}) => {
  return (
    <>
      <AnimatePresence>
        {powerUp && (
          <motion.div
            key={`powerup-${powerUp.x}-${powerUp.y}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute rounded-full flex items-center justify-center"
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              left: `${powerUp.x * cellSize}px`,
              top: `${powerUp.y * cellSize}px`,
              backgroundColor: POWER_UP_COLORS[powerUp.type],
              boxShadow: `0 0 10px ${POWER_UP_COLORS[powerUp.type]}`
            }}
          >
            {powerUp.type === 'SPEED' && '⚡'}
            {powerUp.type === 'MULTIPLIER' && '×2'}
            {powerUp.type === 'SHIELD' && '🛡️'}
          </motion.div>
        )}
        {isShieldActive && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            style={{
              backgroundColor: POWER_UP_COLORS['SHIELD'],
              border: `2px solid ${POWER_UP_COLORS['SHIELD']}`,
              pointerEvents: 'none'
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PowerUpManager;