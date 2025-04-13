import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Coordinate, PowerUp, Obstacle, Theme, SnakeStyle, GridPattern } from '../types';

interface GameBoardProps {
  width: number;
  height: number;
  cellSize: number;
  snake: Coordinate[];
  food: Coordinate;
  powerUps: PowerUp[];
  obstacles: Obstacle[];
  theme: Theme;
  snakeStyle: SnakeStyle;
  gridPattern: GridPattern;
}

const GameBoard: React.FC<GameBoardProps> = ({
  width,
  height,
  cellSize,
  snake,
  food,
  powerUps,
  obstacles,
  theme,
  snakeStyle,
  gridPattern,
}) => {
  // Clean, modern board style with subtle border
  const boardStyle = useMemo(() => ({
    width: `${width * cellSize}px`,
    height: `${height * cellSize}px`,
    position: 'relative' as const,
    backgroundColor: '#121212', // Dark background for better contrast
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  }), [width, height, cellSize]);

  // Get snake segment style based on position and style
  const getSnakeSegmentStyle = (index: number, total: number) => {
    const isHead = index === 0;
    const isTail = index === total - 1;
    
    // Calculate opacity for trail effect - more subtle fade
    const opacity = isHead ? 1 : Math.max(0.5, 1 - (index * 0.5 / total));
    
    // Base style for all segments
    const baseStyle = {
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      position: 'absolute' as const,
      transition: 'all 0.1s ease-in-out',
      opacity: opacity,
    };

    // Different styles based on snake style
    switch (snakeStyle) {
      case 'GRADIENT':
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, #4CAF50, #2E7D32)`,
          borderRadius: '4px',
          boxShadow: isHead ? '0 0 8px rgba(76, 175, 80, 0.3)' : 'none',
        };
      case 'NEON':
        return {
          ...baseStyle,
          backgroundColor: '#00E676',
          borderRadius: '4px',
          boxShadow: isHead 
            ? '0 0 10px rgba(0, 230, 118, 0.5)' 
            : `0 0 ${Math.max(2, 5 - index)}px rgba(0, 230, 118, 0.3)`,
        };
      case 'PIXEL':
        return {
          ...baseStyle,
          backgroundColor: '#4CAF50',
          imageRendering: 'pixelated' as const,
          borderRadius: '0',
        };
      case 'SMOOTH':
        return {
          ...baseStyle,
          backgroundColor: '#4CAF50',
          borderRadius: '8px',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#4CAF50',
          borderRadius: '4px',
        };
    }
  };

  // Render grid with subtle pattern
  const renderGrid = () => {
    if (gridPattern === 'NONE') return null;

    const gridStyle = {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      opacity: 0.05,
    };

    switch (gridPattern) {
      case 'DOTS':
        return (
          <div style={gridStyle}>
            {Array.from({ length: width * height }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '2px',
                  height: '2px',
                  backgroundColor: '#ffffff',
                  left: `${(i % width) * cellSize + cellSize / 2}px`,
                  top: `${Math.floor(i / width) * cellSize + cellSize / 2}px`,
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>
        );
      case 'LINES':
        return (
          <div style={gridStyle}>
            {Array.from({ length: width + 1 }).map((_, i) => (
              <div
                key={`v-${i}`}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '100%',
                  backgroundColor: '#ffffff',
                  left: `${i * cellSize}px`,
                }}
              />
            ))}
            {Array.from({ length: height + 1 }).map((_, i) => (
              <div
                key={`h-${i}`}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#ffffff',
                  top: `${i * cellSize}px`,
                }}
              />
            ))}
          </div>
        );
      case 'GRID':
        return (
          <div style={gridStyle}>
            {Array.from({ length: width + 1 }).map((_, i) => (
              <div
                key={`v-${i}`}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '100%',
                  backgroundColor: '#ffffff',
                  left: `${i * cellSize}px`,
                }}
              />
            ))}
            {Array.from({ length: height + 1 }).map((_, i) => (
              <div
                key={`h-${i}`}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#ffffff',
                  top: `${i * cellSize}px`,
                }}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // Render snake with improved trail effect
  const renderSnake = () => {
    return snake.map((segment, index) => {
      const isHead = index === 0;
      const isTail = index === snake.length - 1;
      
      // Special animation for head
      const headAnimation = isHead ? {
        scale: [1, 1.03, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : {};
      
      return (
        <motion.div
          key={`snake-${index}`}
          style={{
            ...getSnakeSegmentStyle(index, snake.length),
            left: `${segment.x * cellSize}px`,
            top: `${segment.y * cellSize}px`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          {...headAnimation}
        >
          {isHead && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1/3 h-1/3 rounded-full bg-white opacity-50"></div>
            </div>
          )}
        </motion.div>
      );
    });
  };

  return (
    <motion.div
      style={boardStyle}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {renderGrid()}
      
      {/* Snake with improved trail */}
      {renderSnake()}

      {/* Food */}
      <motion.div
        style={{
          position: 'absolute',
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          left: `${food.x * cellSize}px`,
          top: `${food.y * cellSize}px`,
          backgroundColor: '#FF5252',
          borderRadius: '50%',
          boxShadow: '0 0 8px rgba(255, 82, 82, 0.3)',
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Power-ups */}
      {powerUps.map((powerUp, index) => (
        <motion.div
          key={`powerup-${index}`}
          style={{
            position: 'absolute',
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            left: `${powerUp.x * cellSize}px`,
            top: `${powerUp.y * cellSize}px`,
            backgroundColor: powerUp.type === 'SPEED' ? '#FFEB3B' :
                           powerUp.type === 'MULTIPLIER' ? '#FF9800' :
                           powerUp.type === 'SHIELD' ? '#2196F3' :
                           powerUp.type === 'GHOST' ? '#9C27B0' : '#4CAF50',
            borderRadius: '50%',
            boxShadow: `0 0 8px rgba(${
              powerUp.type === 'SPEED' ? '255, 235, 59' :
              powerUp.type === 'MULTIPLIER' ? '255, 152, 0' :
              powerUp.type === 'SHIELD' ? '33, 150, 243' :
              powerUp.type === 'GHOST' ? '156, 39, 176' : '76, 175, 80'
            }, 0.3)`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Obstacles */}
      {obstacles.map((obstacle, index) => (
        <motion.div
          key={`obstacle-${index}`}
          style={{
            position: 'absolute',
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            left: `${obstacle.x * cellSize}px`,
            top: `${obstacle.y * cellSize}px`,
            backgroundColor: obstacle.type === 'WALL' ? '#795548' :
                           obstacle.type === 'SPIKE' ? '#F44336' : '#9C27B0',
            borderRadius: obstacle.type === 'SPIKE' ? '50%' : '4px',
            boxShadow: `0 0 5px rgba(${
              obstacle.type === 'WALL' ? '121, 85, 72' :
              obstacle.type === 'SPIKE' ? '244, 67, 54' : '156, 39, 176'
            }, 0.3)`,
          }}
        />
      ))}
    </motion.div>
  );
};

export default GameBoard; 