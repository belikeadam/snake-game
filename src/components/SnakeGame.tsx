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
const INITIAL_GAME_SPEED = 200;
const MAX_SPEED = 50;
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

  // Calculate cell size based on viewport
  let dynamicCellSize = Math.floor(Math.min(viewportWidth / (INITIAL_GRID_SIZE + 4),
    viewportHeight / (INITIAL_GRID_SIZE + 10)));

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

  const handleDirectionChange = (newDirection: string) => {
    switch (newDirection) {
      case 'ArrowUp':
        if (direction !== 'DOWN') setNextDirection('UP');
        break;
      case 'ArrowDown':
        if (direction !== 'UP') setNextDirection('DOWN');
        break;
      case 'ArrowLeft':
        if (direction !== 'RIGHT') setNextDirection('LEFT');
        break;
      case 'ArrowRight':
        if (direction !== 'LEFT') setNextDirection('RIGHT');
        break;
    }
  };

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

    if (timestamp - lastMoveTime.current < gameSpeed) {
      animationFrameRef.current = requestAnimationFrame(moveSnake);
      return;
    }
    lastMoveTime.current = timestamp;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };
    const currentDirection = nextDirection;
    setDirection(currentDirection);

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
  }, [snake, nextDirection, food, score, gameOver, generateFood, gridSize, gameSpeed, adjustGameDifficulty, difficulty, powerUp, scoreMultiplier, isPaused]);

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

  useEffect(() => {
    const handleResize = () => {
      setGameDimensions(calculateGameDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setNextDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setNextDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setNextDirection('RIGHT');
          break;
        case ' ':  // Space bar
        case 'Escape':  // ESC key
          setIsPaused(prev => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    animationFrameRef.current = requestAnimationFrame(moveSnake);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.body.style.overflow = 'auto';
    };
  }, [direction, moveSnake]);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br ${themeColors.background} p-2 sm:p-4 overflow-hidden`}>
      <div className="text-center mb-4 sm:mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-green-400 mb-2"
        >
          Snake Game
        </motion.h1>
        <div className="flex justify-center space-x-2 sm:space-x-4 text-white text-sm sm:text-base">
          <p>Score: {score}</p>
          <p>High Score: {highScore}</p>
          <p>Speed: {Math.round(INITIAL_GAME_SPEED - gameSpeed)}</p>
        </div>
      </div>

      <div className="mb-2 sm:mb-4 flex space-x-2 sm:space-x-4">
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
          maxHeight: '60vh'
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 sm:mt-4 text-white text-xs sm:text-sm text-center"
      >
        Use Arrow Keys to Control the Snake
      </motion.div>
      <div className="mt-2 sm:mt-4 w-full max-w-sm">
        <ArrowKeys onDirectionChange={handleDirectionChange} />
      </div>
    </div>
  );
};

export default SnakeGame;