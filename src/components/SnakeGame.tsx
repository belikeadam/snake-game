import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowKeys from './ArrowKeys';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Coordinate = { x: number; y: number };
type PowerUpType = 'SPEED' | 'MULTIPLIER' | 'SHIELD';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type Theme = 'CLASSIC' | 'NEON' | 'RETRO';
type GridPattern = 'NONE' | 'DOTS' | 'LINES';
type FoodEmoji = '🍕' | '🍔' | '🍎' | '🍗' | '🍪' | '🍉';

interface PowerUp extends Coordinate {
  type: PowerUpType;
}

interface ThemeColors {
  background: string;
  snake: string;
  food: string;
  grid: string;
}

const MIN_CELL_SIZE = 15; // Minimum cell size for smaller screens
const MAX_CELL_SIZE = 25; // Maximum cell size for larger screens

const INITIAL_GRID_SIZE = 20;
const INITIAL_CELL_SIZE = 25;
const INITIAL_GAME_SPEED = 150;
const MAX_SPEED = 40;
const SPEED_INCREMENT_INTERVAL = 3;

const DIFFICULTY_SETTINGS = {
  EASY: { speed: 200, multiplier: 1 },
  MEDIUM: { speed: 150, multiplier: 1.5 },
  HARD: { speed: 100, multiplier: 2 }
};

const THEME_COLORS: Record<Theme, ThemeColors> = {
  CLASSIC: {
    background: 'from-gray-900 to-gray-800',
    snake: 'rgb(34, 197, 94)',
    food: 'rgb(239, 68, 68)',
    grid: 'rgb(75, 85, 99)'
  },
  NEON: {
    background: 'from-purple-900 to-black',
    snake: 'rgb(167, 139, 250)',
    food: 'rgb(251, 146, 60)',
    grid: 'rgb(139, 92, 246)'
  },
  RETRO: {
    background: 'from-green-900 to-green-800',
    snake: 'rgb(34, 197, 94)',
    food: 'rgb(252, 211, 77)',
    grid: 'rgb(6, 95, 70)'
  }
};

const FOOD_EMOJIS: FoodEmoji[] = ['🍕', '🍔', '🍎', '🍗', '🍪', '🍉'];

const calculateGameDimensions = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 640; // SM breakpoint in Tailwind

  // Calculate cell size based on viewport and leave space for controls
  let dynamicCellSize = Math.floor(Math.min(
    viewportWidth / (INITIAL_GRID_SIZE + 4),
    (viewportHeight * (isMobile ? 0.45 : 0.6)) / INITIAL_GRID_SIZE // Use less height on mobile
  ));

  // Constrain cell size
  dynamicCellSize = Math.min(Math.max(dynamicCellSize, MIN_CELL_SIZE), MAX_CELL_SIZE);

  return {
    cellSize: dynamicCellSize,
    gridSize: INITIAL_GRID_SIZE
  };
};

const SnakeGame: React.FC = () => {
  const [{ cellSize, gridSize }, setGameDimensions] = useState(calculateGameDimensions());

  const [snake, setSnake] = useState<Coordinate[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Coordinate>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(INITIAL_GAME_SPEED);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [particles, setParticles] = useState<Coordinate[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('CLASSIC');
  const [gridPattern, setGridPattern] = useState<GridPattern>('NONE');
  const [showTrail, setShowTrail] = useState(true);
  const [currentFood, setCurrentFood] = useState<FoodEmoji>('🍎');

  const themeColors = THEME_COLORS[currentTheme];

  const lastMoveTime = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const [movementQueue, setMovementQueue] = useState<Direction[]>([]);

  
  const handleDirectionChange = useCallback((newDirection: string) => {
    const isValidMove = (current: Direction, next: Direction): boolean => {
      const opposites = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT'
      };
      return opposites[current] !== next;
    };
  
    const nextDir = newDirection.replace('Arrow', '').toUpperCase() as Direction;
    if (isValidMove(direction, nextDir)) {
      setMovementQueue(prev => [nextDir]); // Only keep latest input
      setNextDirection(nextDir); // Set next direction immediately
    }
  }, [direction]);


useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      handleDirectionChange(e.key);
    }
    if (e.key === ' ' || e.key === 'Escape') {
      setIsPaused(prev => !prev);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [handleDirectionChange]);
  const generateFood = useCallback(() => {
    const occupiedCells = new Set(snake.map(segment => `${segment.x},${segment.y}`));
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * (gridSize - 2)) + 1,
        y: Math.floor(Math.random() * (gridSize - 2)) + 1
      };
    } while (occupiedCells.has(`${newFood.x},${newFood.y}`));

    // Set random food emoji
    setCurrentFood(FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)]);
    return newFood;
  }, [snake, gridSize]);

  const generatePowerUp = useCallback(() => {
    if (Math.random() > 0.8) { // 20% chance to spawn power-up
      const types: PowerUpType[] = ['SPEED', 'MULTIPLIER', 'SHIELD'];
      const type = types[Math.floor(Math.random() * types.length)];
      const position = {
        x: Math.floor(Math.random() * (gridSize - 2)) + 1,
        y: Math.floor(Math.random() * (gridSize - 2)) + 1
      };
      setPowerUp({ ...position, type });
    }
  }, [gridSize]);

  const createParticles = (position: Coordinate) => {
    const newParticles = Array.from({ length: 8 }, () => ({
      x: position.x + (Math.random() - 0.5) * 2,
      y: position.y + (Math.random() - 0.5) * 2
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 500);
  };

  const adjustGameDifficulty = useCallback(() => {
    if (score > 0 && score % SPEED_INCREMENT_INTERVAL === 0) {
      setGameSpeed(prev => Math.max(prev - 20, MAX_SPEED));
      if (score % 6 === 0) {
        setGameDimensions(prev => ({ ...prev, gridSize: Math.min(prev.gridSize + 2, 30) }));
        setGameDimensions(calculateGameDimensions());
      }
    }
  }, [score]);

  const moveSnake = useCallback((timestamp: number) => {
    if (gameOver || isPaused) return;
    
    const elapsed = timestamp - lastMoveTime.current;
    if (elapsed < gameSpeed * 0.6) { // Reduced threshold for faster response
      animationFrameRef.current = requestAnimationFrame(moveSnake);
      return;
    }
  
    lastMoveTime.current = timestamp;
    
    const newSnake = [...snake];
    const head = { ...newSnake[0] };
    
    // Process movement queue immediately
    let currentDirection = nextDirection;
    if (movementQueue.length > 0) {
      currentDirection = movementQueue[0];
      setMovementQueue(prev => prev.slice(1));
      setDirection(currentDirection);
    }
  
    // Update head position immediately
    switch (currentDirection) {
      case 'UP':
        head.y = (head.y - 1 + gridSize) % gridSize;
        break;
      case 'DOWN':
        head.y = (head.y + 1) % gridSize;
        break;
      case 'LEFT':
        head.x = (head.x - 1 + gridSize) % gridSize;
        break;
      case 'RIGHT':
        head.x = (head.x + 1) % gridSize;
        break;
    }
  
    const selfCollision = newSnake.some(segment => segment.x === head.x && segment.y === head.y);
    if (selfCollision) {
      setGameOver(true);
      setHighScore(prev => Math.max(prev, score));
      return;
    }

    newSnake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      const baseScore = 1;
      const difficultyMultiplier = DIFFICULTY_SETTINGS[difficulty].multiplier;
      const newScore = score + (baseScore * scoreMultiplier * difficultyMultiplier);
      setScore(Math.floor(newScore));
      setFood(generateFood());
      generatePowerUp();
      adjustGameDifficulty();
      createParticles(food);
    } else {
      newSnake.pop();
    }

    if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
      switch (powerUp.type) {
        case 'SPEED':
          setGameSpeed(prev => Math.max(prev - 30, MAX_SPEED));
          break;
        case 'MULTIPLIER':
          setScoreMultiplier(prev => prev * 2);
          setTimeout(() => setScoreMultiplier(1), 5000); // Reset after 5s
          break;
        case 'SHIELD':
          // Implement shield logic here
          break;
      }
      createParticles(powerUp);
      setPowerUp(null);
    }

    setSnake(newSnake);
    animationFrameRef.current = requestAnimationFrame(moveSnake);
  }, [snake, nextDirection, movementQueue, food, score, gameOver, generateFood, gridSize, gameSpeed, adjustGameDifficulty, difficulty, powerUp, scoreMultiplier, isPaused]);
  const renderSnakeSegment = (segment: Coordinate, index: number) => {
    return (
      <motion.div
        key={`${segment.x}-${segment.y}-${index}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="absolute rounded-sm"
        style={{
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          left: `${segment.x * cellSize}px`,
          top: `${segment.y * cellSize}px`,
          backgroundColor: themeColors.snake,
          opacity: showTrail ? 1 - (index * 0.05) : 1
        }}
      />
    );
  };

  const renderFood = () => {
    return (
      <motion.div
        key={`food-${food.x}-${food.y}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute flex items-center justify-center"
        style={{
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          left: `${food.x * cellSize}px`,
          top: `${food.y * cellSize}px`,
          fontSize: `${cellSize * 0.8}px`
        }}
      >
        {currentFood}
      </motion.div>
    );
  };

  const renderPauseOverlay = () => {
    if (!isPaused) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-white text-2xl font-bold"
        >
          PAUSED
        </motion.p>
      </motion.div>
    );
  };
  const renderGameOverOverlay = () => {
    if (!gameOver) return null;
  
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-gray-800 p-6 rounded-lg border-2 border-red-500 text-center"
        >
          <h2 className="text-red-500 text-3xl font-bold mb-4">Game Over!</h2>
          <div className="text-white space-y-2 mb-6">
            <p className="text-xl">Final Score: {score}</p>
            <p className="text-lg">High Score: {highScore}</p>
          </div>
          <button
            onClick={restartGame}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold 
                     transform transition-transform duration-200 hover:scale-105"
          >
            Play Again
          </button>
        </motion.div>
      </motion.div>
    );
  };
  
  const restartGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setGameSpeed(INITIAL_GAME_SPEED);
    setPowerUp(null);
    setScoreMultiplier(1);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setGameDimensions(calculateGameDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const pressedKeys = new Set<string>();
  
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        pressedKeys.add(e.key);
        handleDirectionChange(e.key);
      }
      if (e.key === ' ' || e.key === 'Escape') {
        setIsPaused(prev => !prev);
      }
    };
  
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        pressedKeys.delete(e.key);
        // Handle the last pressed key that's still down
        const lastKey = Array.from(pressedKeys).pop();
        if (lastKey) {
          handleDirectionChange(lastKey);
        }
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.body.style.overflow = 'hidden';
    animationFrameRef.current = requestAnimationFrame(moveSnake);
  
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.body.style.overflow = 'auto';
    };
  }, [direction, moveSnake]);
  return (
<div className={`flex flex-col items-center justify-start min-h-screen bg-gradient-to-br ${themeColors.background} p-2 sm:p-4 overflow-hidden`}>
  {/* Reduce top margin on mobile */}
  <div className="text-center mb-2 sm:mb-4">
    <motion.h1
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xl sm:text-3xl font-bold text-green-400 mb-1 sm:mb-2"
    >
      Snake Game
      </motion.h1>
    <div className="flex justify-center space-x-2 sm:space-x-4 text-white text-xs sm:text-base">
      <p>Score: {score}</p>
      <p>High Score: {highScore}</p>
      <p>Speed: {Math.round(INITIAL_GAME_SPEED - gameSpeed)}</p>
    </div>
  </div>

  <div className="mb-2 sm:mb-4 flex space-x-1 sm:space-x-4">
        <button
          onClick={restartGame}
          className="bg-green-600 hover:bg-green-700 text-white p-1 sm:p-2 rounded text-sm sm:text-base"
        >
          Restart Game
        </button>
        <select
          value={currentTheme}
          onChange={(e) => setCurrentTheme(e.target.value as Theme)}
          className="bg-gray-700 text-white p-1 sm:p-2 rounded text-sm sm:text-base"
        >
          <option value="CLASSIC">Classic</option>
          <option value="NEON">Neon</option>
          <option value="RETRO">Retro</option>
        </select>

        <select
          value={gridPattern}
          onChange={(e) => setGridPattern(e.target.value as GridPattern)}
          className="bg-gray-700 text-white p-1 sm:p-2 rounded text-sm sm:text-base"
        >
          <option value="NONE">No Grid</option>
          <option value="DOTS">Dots</option>
          <option value="LINES">Lines</option>
        </select>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative border-4 border-green-600 rounded-lg shadow-2xl overflow-hidden mx-auto"
        style={{
          width: `${gridSize * cellSize}px`,
          height: `${gridSize * cellSize}px`,
          maxWidth: '95vw',
          maxHeight: '50vh'
        }}
      >
        <AnimatePresence>
          {snake.map((segment, index) => renderSnakeSegment(segment, index))}
        </AnimatePresence>
        {renderFood()}
        {powerUp && (
          <motion.div
            key={`powerup-${powerUp.x}-${powerUp.y}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute rounded-full"
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              left: `${powerUp.x * cellSize}px`,
              top: `${powerUp.y * cellSize}px`,
              backgroundColor: powerUp.type === 'SPEED' ? 'yellow' :
                powerUp.type === 'MULTIPLIER' ? 'purple' : 'blue'
            }}
          />
        )}
        {renderPauseOverlay()}
        {renderGameOverOverlay()}  

      </motion.div>

   
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-white text-xs sm:text-sm text-center relative group"
        >
        <div className="cursor-help flex items-center justify-center gap-2">
          <span>Game Controls</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-4 w-72 
                      bg-black bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg text-left border border-gray-600">
          <h3 className="font-bold mb-2 text-green-400">How to Play:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded">←↑↓→</span>
              <span>Use arrow keys to change direction</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded">Space</span>
              <span>Pause/Resume game</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded">ESC</span>
              <span>Pause game</span>
            </li>
            <li className="mt-2">
              <span className="text-yellow-400">🟡</span> Speed boost
              <span className="text-purple-400 ml-4">🟣</span> Score multiplier
              <span className="text-blue-400 ml-4">🔵</span> Shield
            </li>
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 sm:mt-4 text-white text-xs sm:text-sm text-center"
        title="You can also use keyboard arrow keys to control the snake"
      >
        Use Arrow Keys to Control the Snake
      </motion.div>

      <div className="fixed bottom-0 left-0 right-0 w-full">
    <ArrowKeys onDirectionChange={handleDirectionChange} />
  </div>
    </div>
  );
};

export default SnakeGame;