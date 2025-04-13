import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowKeys from './ArrowKeys';
import GameGrid from './GameGrid';
import GameSettings from './GameSettings';
import VirtualJoystick from './VirtualJoystick';
import Achievements from './Achievements';

// Define types directly to avoid import issues
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Coordinate = { 
  x: number; 
  y: number; 
  style?: React.CSSProperties;
};
type PowerUpType = 'SPEED' | 'MULTIPLIER' | 'SHIELD' | 'GHOST' | 'MAGNET' | 'SHRINK';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
type Theme = 'CLASSIC' | 'NEON' | 'RETRO' | 'NOKIA' | 'DARK' | 'LIGHT' | 'CYBER' | 'NATURE';
type GridPattern = 'NONE' | 'DOTS' | 'LINES' | 'GRID';
type FoodEmoji = '🍕' | '🍔' | '🍎' | '🍗' | '🍪' | '🍉';
type GameMode = 'CLASSIC' | 'TIME_ATTACK' | 'CHALLENGE' | 'SURVIVAL';
type ControlType = 'ARROWS' | 'WASD' | 'TOUCH' | 'JOYSTICK';

interface PowerUp extends Coordinate {
  type: PowerUpType;
  duration?: number; // Duration in milliseconds
}

interface ThemeColors {
  background: string;
  snake: string;
  food: string;
  grid: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface GameSettingsType {
  difficulty: Difficulty;
  theme: Theme;
  gridPattern: GridPattern;
  snakeStyle: 'CLASSIC' | 'ROUNDED' | 'GRADIENT' | 'NEON';
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  controlType: ControlType;
  gameMode: GameMode;
}

interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  level: number;
  timeRemaining?: number;
  lives?: number;
  activePowerUps: {
    [key in PowerUpType]?: {
      active: boolean;
      endTime: number;
    };
  };
}

interface Obstacle extends Coordinate {
  type: 'WALL' | 'SPIKE';
}

const MIN_CELL_SIZE = 15; // Minimum cell size for smaller screens
const MAX_CELL_SIZE = 25; // Maximum cell size for larger screens

const INITIAL_GRID_SIZE = 20;
const INITIAL_CELL_SIZE = 25;
const INITIAL_GAME_SPEED = 200;
const MAX_SPEED = 80;
const SPEED_INCREMENT_INTERVAL = 5;
const FRAME_CHECK_MULTIPLIER = 0.4;  
const MOVEMENT_BUFFER_SIZE = 3; // Allow more queued movements
const MIN_MOVE_INTERVAL = 50; // Minimum time between moves in ms


const DIFFICULTY_SETTINGS = {
  EASY: { speed: 250, multiplier: 1 },
  MEDIUM: { speed: 200, multiplier: 1.5 },
  HARD: { speed: 150, multiplier: 2 },
  EXPERT: { speed: 100, multiplier: 3 }
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
  },
  NOKIA: {
    background: 'from-gray-800 to-gray-900',
    snake: 'rgb(34, 197, 94)',
    food: 'rgb(239, 68, 68)',
    grid: 'rgb(55, 65, 81)'
  },
  DARK: {
    background: 'from-gray-950 to-black',
    snake: 'rgb(59, 130, 246)',
    food: 'rgb(239, 68, 68)',
    grid: 'rgb(31, 41, 55)'
  },
  LIGHT: {
    background: 'from-blue-100 to-white',
    snake: 'rgb(34, 197, 94)',
    food: 'rgb(239, 68, 68)',
    grid: 'rgb(209, 213, 219)'
  },
  CYBER: {
    background: 'from-blue-900 to-indigo-900',
    snake: 'rgb(0, 255, 255)',
    food: 'rgb(255, 0, 255)',
    grid: 'rgb(30, 58, 138)'
  },
  NATURE: {
    background: 'from-green-800 to-green-600',
    snake: 'rgb(34, 197, 94)',
    food: 'rgb(234, 179, 8)',
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
  const [currentTheme, setCurrentTheme] = useState<Theme>('NOKIA');
  const [gridPattern, setGridPattern] = useState<GridPattern>('DOTS');
  const [showTrail, setShowTrail] = useState(true);
  const [currentFood, setCurrentFood] = useState<FoodEmoji>('🍎');
  const [showMobileControls, setShowMobileControls] = useState(true);
  const [controlLayout, setControlLayout] = useState<'COMPACT' | 'SPREAD'>('COMPACT');
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [snakeStyle, setSnakeStyle] = useState<'CLASSIC' | 'ROUNDED' | 'GRADIENT' | 'NEON'>('CLASSIC');
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [settings, setSettings] = useState<GameSettingsType>({
    difficulty: 'MEDIUM',
    theme: 'NOKIA',
    gridPattern: 'DOTS',
    snakeStyle: 'CLASSIC',
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    controlType: 'ARROWS',
    gameMode: 'CLASSIC'
  });
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first_food', title: 'First Bite', description: 'Eat your first food', icon: '🍎', unlocked: false, progress: 0, maxProgress: 1 },
    { id: 'score_10', title: 'Growing Up', description: 'Reach a score of 10', icon: '🌱', unlocked: false, progress: 0, maxProgress: 10 },
    { id: 'score_50', title: 'Snake Master', description: 'Reach a score of 50', icon: '👑', unlocked: false, progress: 0, maxProgress: 50 },
    { id: 'powerup_collector', title: 'Power-Up Collector', description: 'Collect 5 power-ups', icon: '⚡', unlocked: false, progress: 0, maxProgress: 5 },
  ]);
  const [isShielded, setIsShielded] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const [isMagnet, setIsMagnet] = useState(false);
  const [activePowerUps, setActivePowerUps] = useState<{[key in PowerUpType]?: {active: boolean, endTime: number}}>({});
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [movingObstacles, setMovingObstacles] = useState<Obstacle[]>([]);
  const [portals, setPortals] = useState<{in: Coordinate, out: Coordinate}[]>([]);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);

  const themeColors = THEME_COLORS[currentTheme];

  const lastMoveTime = useRef(0);

  const [movementQueue, setMovementQueue] = useState<Direction[]>([]);

  const gameLoopRef = useRef<number | null>(null);
  const lastRenderTime = useRef<number>(0);
  const TARGET_FPS = 60;
  const FRAME_TIME = 1000 / TARGET_FPS;

  // Optimize snake rendering with useMemo
  const snakeSegments = useMemo(() => 
    snake.map((segment, index) => {
      // Determine if this is the head
      const isHead = index === 0;
      
      // Create different styles based on snake style
      let segmentStyle: React.CSSProperties = {
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        left: `${segment.x * cellSize}px`,
        top: `${segment.y * cellSize}px`,
        position: 'absolute',
        transition: 'all 0.1s ease-out',
      };
      
      // Apply different styles based on the selected snake style
      switch (settings.snakeStyle) {
        case 'CLASSIC':
          segmentStyle = {
            ...segmentStyle,
            backgroundColor: themeColors.snake,
            borderRadius: '0',
            boxShadow: isHead ? `0 0 8px ${themeColors.snake}` : 'none',
          };
          break;
        case 'ROUNDED':
          segmentStyle = {
            ...segmentStyle,
            backgroundColor: themeColors.snake,
            borderRadius: '8px',
            boxShadow: isHead ? `0 0 8px ${themeColors.snake}` : 'none',
          };
          break;
        case 'GRADIENT':
          segmentStyle = {
            ...segmentStyle,
            background: `linear-gradient(135deg, ${themeColors.snake}, ${adjustColor(themeColors.snake, -30)})`,
            borderRadius: '8px',
            boxShadow: isHead ? `0 0 10px ${themeColors.snake}` : 'none',
          };
          break;
        case 'NEON':
          segmentStyle = {
            ...segmentStyle,
            backgroundColor: themeColors.snake,
            borderRadius: '4px',
            boxShadow: isHead 
              ? `0 0 15px ${themeColors.snake}, 0 0 30px ${themeColors.snake}` 
              : `0 0 5px ${themeColors.snake}`,
            opacity: showTrail ? 1 - (index * 0.05) : 1,
          };
          break;
      }
      
      // Add trail effect if enabled
      if (showTrail && !isHead) {
        segmentStyle.opacity = 1 - (index * 0.05);
      }
      
      return {
        ...segment,
        key: `${segment.x}-${segment.y}-${index}`,
        style: segmentStyle,
        isHead
      };
    }), [snake, cellSize, themeColors.snake, showTrail, settings.snakeStyle]);

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number): string => {
    // Convert hex to RGB
    let r = 0, g = 0, b = 0;
    if (color.startsWith('rgb')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
      }
    } else {
      // Assume it's a hex color
      const hex = color.replace('#', '');
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const handleDirectionChange = useCallback((newDirection: string) => {
    const nextDir = newDirection.replace('Arrow', '').toUpperCase() as Direction;
    const isValidMove = (current: Direction, next: Direction): boolean => {
      return {UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'}[current] !== next;
    };
  
    if (isValidMove(direction, nextDir)) {
      setNextDirection(nextDir);
      setMovementQueue(prev => {
        // Only add if not already the last direction in queue
        if (prev.length === 0 || prev[prev.length - 1] !== nextDir) {
          return prev.length < MOVEMENT_BUFFER_SIZE ? [...prev, nextDir] : prev;
        }
        return prev;
      });
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
  document.body.style.overflow = 'hidden';
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'auto';
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
      const types: PowerUpType[] = ['SPEED', 'MULTIPLIER', 'SHIELD', 'GHOST', 'MAGNET', 'SHRINK'];
      const type = types[Math.floor(Math.random() * types.length)];
      const position = {
        x: Math.floor(Math.random() * (gridSize - 2)) + 1,
        y: Math.floor(Math.random() * (gridSize - 2)) + 1
      };
      
      // Set duration based on power-up type
      let duration = 5000; // Default 5 seconds
      if (type === 'SHIELD') duration = 8000; // Shield lasts longer
      if (type === 'GHOST') duration = 4000; // Ghost lasts shorter
      
      setPowerUp({ ...position, type, duration });
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
      setGameSpeed(prev => Math.max(prev - 10, MAX_SPEED)); // Smaller speed decrease (was -20)
 
    }
  }, [score]);

  const moveSnake = useCallback((timestamp: number) => {
    if (gameOver || isPaused) return;

    // Frame rate limiting
    if (timestamp - lastRenderTime.current < FRAME_TIME) {
      gameLoopRef.current = requestAnimationFrame(moveSnake);
      return;
    }
    lastRenderTime.current = timestamp;
    
    const elapsed = timestamp - lastMoveTime.current;
    if (elapsed < Math.max(gameSpeed * FRAME_CHECK_MULTIPLIER, MIN_MOVE_INTERVAL)) {
      gameLoopRef.current = requestAnimationFrame(moveSnake);
      return;
    }
  
    lastMoveTime.current = timestamp;
    
    const newSnake = [...snake];
    const head = { ...newSnake[0] };
    
    // Process movement queue with improved timing
    const currentDirection = movementQueue.length > 0 ? movementQueue[0] : nextDirection;
    if (movementQueue.length > 0) {
      setMovementQueue(prev => prev.slice(1));
      setDirection(currentDirection);
    }
  
    // Update head position
    switch (currentDirection) {
      case 'UP':
        head.y = head.y - 1;
        break;
      case 'DOWN':
        head.y = head.y + 1;
        break;
      case 'LEFT':
        head.x = head.x - 1;
        break;
      case 'RIGHT':
        head.x = head.x + 1;
        break;
    }
  
    // Check for collisions
    if (checkCollision(head, newSnake)) {
      setGameOver(true);
      setHighScore(prev => Math.max(prev, score));
      return;
    }

    newSnake.unshift(head);

    // Check for food collision
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

    // Check for power-up collision
    if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
      // Update active power-ups
      setActivePowerUps(prev => ({
        ...prev,
        [powerUp.type]: {
          active: true,
          endTime: Date.now() + (powerUp.duration || 5000)
        }
      }));
      
      switch (powerUp.type) {
        case 'SPEED':
          setGameSpeed(prev => Math.max(prev - 30, MAX_SPEED));
          break;
        case 'MULTIPLIER':
          setScoreMultiplier(prev => prev * 2);
          break;
        case 'SHIELD':
          setIsShielded(true);
          break;
        case 'GHOST':
          setIsGhost(true);
          break;
        case 'MAGNET':
          setIsMagnet(true);
          break;
        case 'SHRINK':
          // Shrink the snake by removing the last segment
          if (newSnake.length > 1) {
            newSnake.pop();
            newSnake.pop(); // Remove two segments for more noticeable effect
          }
          break;
      }
      
      createParticles(powerUp);
      setPowerUp(null);
    }

    // Magnet effect - attract food when close
    if (isMagnet && food) {
      const dx = head.x - food.x;
      const dy = head.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 5) { // If food is within 5 cells
        // Move food closer to snake
        const newFood = { ...food };
        if (dx > 0) newFood.x += 1;
        if (dx < 0) newFood.x -= 1;
        if (dy > 0) newFood.y += 1;
        if (dy < 0) newFood.y -= 1;
        
        setFood(newFood);
      }
    }

    setSnake(newSnake);
    gameLoopRef.current = requestAnimationFrame(moveSnake);
  }, [snake, nextDirection, movementQueue, food, score, gameOver, generateFood, gridSize, gameSpeed, adjustGameDifficulty, difficulty, powerUp, scoreMultiplier, isPaused, isGhost, isShielded, isMagnet]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(moveSnake);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [moveSnake]);

  // Check for expired power-ups
  useEffect(() => {
    if (Object.keys(activePowerUps).length === 0) return;
    
    const checkPowerUps = () => {
      const now = Date.now();
      let updated = false;
      
      const newActivePowerUps = { ...activePowerUps };
      
      Object.entries(activePowerUps).forEach(([type, data]) => {
        if (data.active && now > data.endTime) {
          // Power-up expired
          newActivePowerUps[type as PowerUpType] = { active: false, endTime: 0 };
          updated = true;
          
          // Reset effects
          switch (type) {
            case 'SPEED':
              setGameSpeed(INITIAL_GAME_SPEED);
              break;
            case 'MULTIPLIER':
              setScoreMultiplier(1);
              break;
            case 'SHIELD':
              setIsShielded(false);
              break;
            case 'GHOST':
              setIsGhost(false);
              break;
            case 'MAGNET':
              setIsMagnet(false);
              break;
          }
        }
      });
      
      if (updated) {
        setActivePowerUps(newActivePowerUps);
      }
    };
    
    const interval = setInterval(checkPowerUps, 100);
    return () => clearInterval(interval);
  }, [activePowerUps]);

  // Optimize food rendering
  const foodStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      left: `${food.x * cellSize}px`,
      top: `${food.y * cellSize}px`,
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${cellSize * 0.8}px`,
      zIndex: 10,
    };
    
    // Add glow effect to food
    return {
      ...baseStyle,
      filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.7))',
      animation: 'pulse 1.5s infinite alternate',
    };
  }, [food, cellSize]);

  // Add CSS for food animation
  useEffect(() => {
    // Add keyframes for food animation
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(0.9); }
        100% { transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Render food with animation
  const renderFood = () => {
    return (
      <motion.div
        key={`food-${food.x}-${food.y}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute flex items-center justify-center"
        style={foodStyle}
      >
        {currentFood}
      </motion.div>
    );
  };

  // Render power-up with animation
  const renderPowerUp = () => {
    if (!powerUp) return null;
    
    const powerUpStyle: React.CSSProperties = {
          width: `${cellSize}px`,
          height: `${cellSize}px`,
      left: `${powerUp.x * cellSize}px`,
      top: `${powerUp.y * cellSize}px`,
      position: 'absolute',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${cellSize * 0.6}px`,
      zIndex: 10,
    };
    
    // Different styles based on power-up type
    let bgColor = '';
    let icon = '';
    
    switch (powerUp.type) {
      case 'SPEED':
        bgColor = 'yellow';
        icon = '⚡';
        break;
      case 'MULTIPLIER':
        bgColor = 'purple';
        icon = '×2';
        break;
      case 'SHIELD':
        bgColor = 'blue';
        icon = '🛡️';
        break;
      case 'GHOST':
        bgColor = 'gray';
        icon = '👻';
        break;
      case 'MAGNET':
        bgColor = 'red';
        icon = '🧲';
        break;
      case 'SHRINK':
        bgColor = 'green';
        icon = '📏';
        break;
    }
    
    return (
      <motion.div
        key={`powerup-${powerUp.x}-${powerUp.y}`}
        initial={{ scale: 0 }}
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute rounded-full flex items-center justify-center"
        style={{
          ...powerUpStyle,
          backgroundColor: bgColor,
          boxShadow: `0 0 15px ${bgColor}`,
        }}
      >
        {icon}
      </motion.div>
    );
  };

  // Render active power-up indicators
  const renderActivePowerUps = () => {
    if (Object.keys(activePowerUps).length === 0) return null;
    
    return (
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
        {Object.entries(activePowerUps).map(([type, data]) => {
          if (!data.active) return null;
          
          const timeLeft = Math.max(0, Math.ceil((data.endTime - Date.now()) / 1000));
          const progress = Math.min(100, (timeLeft / 5) * 100); // Assuming 5s is max duration
          
          let icon = '';
          let color = '';
          
          switch (type) {
            case 'SPEED':
              icon = '⚡';
              color = 'yellow';
              break;
            case 'MULTIPLIER':
              icon = '×2';
              color = 'purple';
              break;
            case 'SHIELD':
              icon = '🛡️';
              color = 'blue';
              break;
            case 'GHOST':
              icon = '👻';
              color = 'gray';
              break;
            case 'MAGNET':
              icon = '🧲';
              color = 'red';
              break;
            case 'SHRINK':
              icon = '📏';
              color = 'green';
              break;
          }
          
          return (
            <div key={type} className="flex items-center gap-1 bg-black bg-opacity-50 p-1 rounded">
              <span>{icon}</span>
              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${progress}%`, 
                    backgroundColor: color 
                  }}
                />
              </div>
              <span className="text-xs text-white">{timeLeft}s</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render snake segments with animations
  const renderSnakeSegments = () => {
    return snakeSegments.map((segment, index) => {
      // Add special effects for the head
      const headProps = segment.isHead ? {
        animate: { 
          scale: [1, 1.05, 1],
        },
        transition: { 
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : {};
      
      // Add shield effect if active
      const shieldStyle = isShielded ? {
        boxShadow: `0 0 10px 2px rgba(0, 0, 255, 0.7)`,
        border: '2px solid blue',
      } : {};
      
      // Add ghost effect if active
      const ghostStyle = isGhost ? {
        opacity: 0.7,
        filter: 'blur(1px)',
      } : {};
      
    return (
      <motion.div
          key={segment.key}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          {...headProps}
          className="absolute"
        style={{
            ...segment.style,
            ...shieldStyle,
            ...ghostStyle,
          }}
        >
          {segment.isHead && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1/3 h-1/3 rounded-full bg-white opacity-70"></div>
            </div>
          )}
      </motion.div>
    );
    });
  };

  const renderPauseOverlay = () => {
    if (!isPaused) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-gray-800 p-6 rounded-lg border-2 border-green-500 text-center"
        >
          <h2 className="text-green-500 text-2xl font-bold mb-4">PAUSED</h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsPaused(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-base font-semibold"
            >
              Resume
            </button>
            <button
              onClick={restartGame}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-base font-semibold"
            >
              Restart
            </button>
          </div>
        </motion.div>
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
          className="bg-gray-800 p-6 rounded-lg border-2 border-red-500 text-center max-w-md w-full"
        >
          <h2 className="text-red-500 text-3xl font-bold mb-4">Game Over!</h2>
          <div className="text-white space-y-2 mb-6">
            <p className="text-xl">Final Score: {score}</p>
            <p className="text-lg">High Score: {highScore}</p>
            <p className="text-lg">Level Reached: {level}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={restartGame}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold 
                     transform transition-transform duration-200 hover:scale-105"
          >
            Play Again
          </button>
            <button
              onClick={() => {
                setGameOver(false);
                setIsPaused(true);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg text-lg font-semibold 
                       transform transition-transform duration-200 hover:scale-105"
            >
              Main Menu
            </button>
          </div>
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
    setLevel(1);
    setLives(3);
    setObstacles([]);
    setMovingObstacles([]);
    setPortals([]);
  };

  useEffect(() => {
    const handleResize = () => {
      setGameDimensions(calculateGameDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add a function to toggle mobile controls visibility
  const toggleMobileControls = () => {
    setShowMobileControls(prev => !prev);
  };

  // Add a function to toggle control layout
  const toggleControlLayout = () => {
    setControlLayout(prev => prev === 'COMPACT' ? 'SPREAD' : 'COMPACT');
  };

  // Add a function to handle the main menu
  const showMainMenu = () => {
    setGameOver(false);
    setIsPaused(true);
  };

  // Add a function to start the game
  const startGame = () => {
    setShowStartScreen(false);
    setIsPaused(false);
    restartGame();
  };

  // Update achievements
  useEffect(() => {
    if (score > 0) {
      setAchievements(prev => prev.map(achievement => {
        if (achievement.id === 'first_food' && !achievement.unlocked) {
          return { ...achievement, unlocked: true, progress: 1 };
        }
        if (achievement.id === 'score_10' && score >= 10 && !achievement.unlocked) {
          return { ...achievement, unlocked: true, progress: 10 };
        }
        if (achievement.id === 'score_50' && score >= 50 && !achievement.unlocked) {
          return { ...achievement, unlocked: true, progress: 50 };
        }
        return achievement;
      }));
    }
  }, [score]);

  // Render the start screen
  const renderStartScreen = () => {
    if (!showStartScreen) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 p-8 rounded-2xl border-2 border-green-500 text-center max-w-md w-full shadow-2xl"
        >
          <h1 className="text-green-400 text-4xl font-bold mb-6">SNAKE GAME</h1>
          
          <div className="mb-8 flex justify-center">
            <div className="relative w-32 h-32">
              {/* Simple snake animation */}
              <motion.div
                animate={{ 
                  x: [0, 10, 0],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="absolute top-0 left-0 w-8 h-8 bg-green-500 rounded-lg"
              />
              <motion.div
                animate={{ 
                  x: [0, 10, 0],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut",
                  delay: 0.2
                }}
                className="absolute top-0 left-8 w-8 h-8 bg-green-500 rounded-lg"
              />
              <motion.div
                animate={{ 
                  x: [0, 10, 0],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut",
                  delay: 0.4
                }}
                className="absolute top-0 left-16 w-8 h-8 bg-green-500 rounded-lg"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-white text-left mb-2">Snake Style:</label>
            <select
              value={snakeStyle}
              onChange={(e) => setSnakeStyle(e.target.value as 'CLASSIC' | 'ROUNDED' | 'GRADIENT' | 'NEON')}
              className="w-full bg-gray-700 text-white p-2 rounded-lg text-base"
            >
              <option value="CLASSIC">Classic (Square)</option>
              <option value="ROUNDED">Rounded</option>
              <option value="GRADIENT">Gradient</option>
              <option value="NEON">Neon</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-white text-left mb-2">Theme:</label>
            <select
              value={currentTheme}
              onChange={(e) => setCurrentTheme(e.target.value as Theme)}
              className="w-full bg-gray-700 text-white p-2 rounded-lg text-base"
            >
              <option value="NOKIA">Nokia Classic</option>
              <option value="CLASSIC">Classic</option>
              <option value="NEON">Neon</option>
              <option value="RETRO">Retro</option>
              <option value="DARK">Dark</option>
              <option value="LIGHT">Light</option>
              <option value="CYBER">Cyber</option>
              <option value="NATURE">Nature</option>
            </select>
          </div>
          
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-xl font-bold w-full
                     transform transition-transform duration-200 hover:scale-105 shadow-lg"
          >
            START GAME
          </button>
        </motion.div>
      </motion.div>
    );
  };

  // Update settings when they change
  const handleSettingsChange = (newSettings: Partial<GameSettingsType>) => {
    setSettings((prev: GameSettingsType) => ({ ...prev, ...newSettings }));
    
    // Apply settings changes
    if (newSettings.theme) setCurrentTheme(newSettings.theme);
    if (newSettings.gridPattern) setGridPattern(newSettings.gridPattern);
    if (newSettings.snakeStyle) setSnakeStyle(newSettings.snakeStyle);
    if (newSettings.controlType) {
      // Handle control type change
      if (newSettings.controlType === 'JOYSTICK') {
        setControlLayout('SPREAD');
      } else {
        setControlLayout('COMPACT');
      }
    }
  };

  // Generate obstacles based on level
  const generateObstacles = useCallback(() => {
    const newObstacles: Obstacle[] = [];
    const newMovingObstacles: Obstacle[] = [];
    const newPortals: {in: Coordinate, out: Coordinate}[] = [];
    
    // Number of obstacles increases with level
    const numObstacles = Math.min(level * 2, 10);
    const numMovingObstacles = Math.min(Math.floor(level / 2), 3);
    const numPortals = Math.min(Math.floor(level / 3), 2);
    
    // Generate static obstacles
    for (let i = 0; i < numObstacles; i++) {
      let position: Coordinate = { x: 0, y: 0 };
      let validPosition = false;
      
      while (!validPosition) {
        position = {
          x: Math.floor(Math.random() * (gridSize - 2)) + 1,
          y: Math.floor(Math.random() * (gridSize - 2)) + 1
        };
        
        // Check if position overlaps with snake, food, or other obstacles
        const isOverlapping = 
          snake.some(segment => segment.x === position.x && segment.y === position.y) ||
          (food.x === position.x && food.y === position.y) ||
          newObstacles.some(obs => obs.x === position.x && obs.y === position.y);
        
        if (!isOverlapping) {
          validPosition = true;
        }
      }
      
      newObstacles.push({
        ...position,
        type: 'WALL'
      });
    }
    
    // Generate moving obstacles
    for (let i = 0; i < numMovingObstacles; i++) {
      let position: Coordinate = { x: 0, y: 0 };
      let validPosition = false;
      
      while (!validPosition) {
        position = {
          x: Math.floor(Math.random() * (gridSize - 2)) + 1,
          y: Math.floor(Math.random() * (gridSize - 2)) + 1
        };
        
        // Check if position overlaps with snake, food, or other obstacles
        const isOverlapping = 
          snake.some(segment => segment.x === position.x && segment.y === position.y) ||
          (food.x === position.x && food.y === position.y) ||
          newObstacles.some(obs => obs.x === position.x && obs.y === position.y) ||
          newMovingObstacles.some(obs => obs.x === position.x && obs.y === position.y);
        
        if (!isOverlapping) {
          validPosition = true;
        }
      }
      
      newMovingObstacles.push({
        ...position,
        type: 'SPIKE'
      });
    }
    
    // Generate portals
    for (let i = 0; i < numPortals; i++) {
      let inPortal: Coordinate = { x: 0, y: 0 };
      let outPortal: Coordinate = { x: 0, y: 0 };
      let validPosition = false;
      
      while (!validPosition) {
        inPortal = {
          x: Math.floor(Math.random() * (gridSize - 2)) + 1,
          y: Math.floor(Math.random() * (gridSize - 2)) + 1
        };
        
        outPortal = {
          x: Math.floor(Math.random() * (gridSize - 2)) + 1,
          y: Math.floor(Math.random() * (gridSize - 2)) + 1
        };
        
        // Check if positions overlap with snake, food, or other obstacles
        const isOverlapping = 
          snake.some(segment => 
            (segment.x === inPortal.x && segment.y === inPortal.y) ||
            (segment.x === outPortal.x && segment.y === outPortal.y)
          ) ||
          (food.x === inPortal.x && food.y === inPortal.y) ||
          (food.x === outPortal.x && food.y === outPortal.y) ||
          newObstacles.some(obs => 
            (obs.x === inPortal.x && obs.y === inPortal.y) ||
            (obs.x === outPortal.x && obs.y === outPortal.y)
          ) ||
          newMovingObstacles.some(obs => 
            (obs.x === inPortal.x && obs.y === inPortal.y) ||
            (obs.x === outPortal.x && obs.y === outPortal.y)
          );
        
        if (!isOverlapping) {
          validPosition = true;
        }
      }
      
      newPortals.push({ in: inPortal, out: outPortal });
    }
    
    setObstacles(newObstacles);
    setMovingObstacles(newMovingObstacles);
    setPortals(newPortals);
  }, [snake, food, gridSize, level]);

  // Move obstacles
  const moveObstacles = useCallback(() => {
    if (movingObstacles.length === 0) return;
    
    setMovingObstacles(prev => {
      return prev.map(obstacle => {
        // Random movement pattern
        const direction = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left
        const newObstacle = { ...obstacle };
        
        switch (direction) {
          case 0: // up
            newObstacle.y = Math.max(1, obstacle.y - 1);
            break;
          case 1: // right
            newObstacle.x = Math.min(gridSize - 2, obstacle.x + 1);
            break;
          case 2: // down
            newObstacle.y = Math.min(gridSize - 2, obstacle.y + 1);
            break;
          case 3: // left
            newObstacle.x = Math.max(1, obstacle.x - 1);
            break;
        }
        
        return newObstacle;
      });
    });
  }, [gridSize]);

  // Check for level up
  useEffect(() => {
    if (score > 0 && score % 10 === 0) {
      setLevel(prev => prev + 1);
      generateObstacles();
    }
  }, [score, generateObstacles]);

  // Initialize obstacles on game start
  useEffect(() => {
    if (!showStartScreen && !gameOver) {
      generateObstacles();
    }
  }, [showStartScreen, gameOver, generateObstacles]);

  // Move obstacles periodically
  useEffect(() => {
    if (gameOver || isPaused || movingObstacles.length === 0) return;
    
    const interval = setInterval(() => {
      moveObstacles();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameOver, isPaused, moveObstacles, movingObstacles.length]);

  // Modify the collision check to account for obstacles
  const checkCollision = (head: Coordinate, newSnake: Coordinate[]) => {
    // Ghost mode allows passing through walls
    if (isGhost) {
      // Wrap around the screen
      if (head.x < 0) head.x = gridSize - 1;
      if (head.x >= gridSize) head.x = 0;
      if (head.y < 0) head.y = gridSize - 1;
      if (head.y >= gridSize) head.y = 0;
      return false;
    }
    
    // Check wall collision
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
      return !isShielded; // Shield protects from wall collision
    }
    
    // Check self collision
    const selfCollision = newSnake.some(segment => segment.x === head.x && segment.y === head.y);
    if (selfCollision && !isShielded) return true; // Shield protects from self collision
    
    // Check obstacle collision
    const obstacleCollision = obstacles.some(obs => obs.x === head.x && obs.y === head.y);
    if (obstacleCollision && !isShielded) return true; // Shield protects from obstacle collision
    
    // Check moving obstacle collision
    const movingObstacleCollision = movingObstacles.some(obs => obs.x === head.x && obs.y === head.y);
    if (movingObstacleCollision && !isShielded) return true; // Shield protects from moving obstacle collision
    
    return false;
  };

  // Render obstacles
  const renderObstacles = () => {
    return (
      <>
        {/* Static obstacles */}
        {obstacles.map((obstacle, index) => (
          <motion.div
            key={`obstacle-${index}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute"
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              left: `${obstacle.x * cellSize}px`,
              top: `${obstacle.y * cellSize}px`,
              backgroundColor: '#4B5563',
              borderRadius: '4px',
              boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.5)',
              zIndex: 5,
            }}
          />
        ))}
        
        {/* Moving obstacles */}
        {movingObstacles.map((obstacle, index) => (
          <motion.div
            key={`moving-obstacle-${index}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute"
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              left: `${obstacle.x * cellSize}px`,
              top: `${obstacle.y * cellSize}px`,
              backgroundColor: '#DC2626',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(220, 38, 38, 0.7)',
              zIndex: 5,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
              ⚠️
            </div>
          </motion.div>
        ))}
        
        {/* Portals */}
        {portals.map((portal, index) => (
          <React.Fragment key={`portal-${index}`}>
            {/* In portal */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute"
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                left: `${portal.in.x * cellSize}px`,
                top: `${portal.in.y * cellSize}px`,
                background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                borderRadius: '50%',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.7)',
                zIndex: 5,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                ⭐
              </div>
            </motion.div>
            
            {/* Out portal */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -180, -360]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute"
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                left: `${portal.out.x * cellSize}px`,
                top: `${portal.out.y * cellSize}px`,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                borderRadius: '50%',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.7)',
                zIndex: 5,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                ⭐
              </div>
            </motion.div>
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
<div className={`flex flex-col items-center justify-start min-h-screen bg-gradient-to-br ${themeColors.background} p-2 sm:p-4 overflow-hidden`}>
      {renderStartScreen()}
      
      {/* Game Header */}
      <div className="w-full max-w-2xl bg-gray-800 bg-opacity-80 rounded-2xl p-4 mb-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center">
    <motion.h1
            initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-bold text-green-400 mb-2 sm:mb-0"
    >
      Snake Game
      </motion.h1>
          
          <div className="flex space-x-4 text-white text-sm sm:text-base">
            <div className="bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-gray-300 mr-1">Score:</span>
              <span className="font-bold">{score}</span>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-gray-300 mr-1">High:</span>
              <span className="font-bold">{highScore}</span>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-gray-300 mr-1">Speed:</span>
              <span className="font-bold">{Math.round(INITIAL_GAME_SPEED - gameSpeed)}</span>
            </div>
          </div>
    </div>
  </div>

      {/* Game Controls */}
      <div className="w-full max-w-2xl flex flex-wrap justify-center gap-2 mb-4">
        <button
          onClick={restartGame}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors"
        >
          Restart
        </button>
        
        <button
          onClick={() => setShowSettings(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors"
        >
          Settings
        </button>
        
        <button
          onClick={() => setShowAchievements(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors"
        >
          Achievements
        </button>
        
        <button
          onClick={toggleMobileControls}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors"
        >
          {showMobileControls ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>

      {/* Game Board */}
      <motion.div
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative border-4 border-green-600 rounded-2xl shadow-2xl overflow-hidden mx-auto mb-4"
  style={{
    width: `${gridSize * cellSize}px`,
    height: `${gridSize * cellSize}px`,
    maxWidth: '95vw',
          maxHeight: '50vh',
          background: `linear-gradient(to bottom right, ${themeColors.snake}, ${adjustColor(themeColors.snake, -30)})`,
  }}
>
  <GameGrid
    pattern={gridPattern}
    gridSize={gridSize}
    cellSize={cellSize}
    color={themeColors.grid}
  />
        {renderObstacles()}
  <AnimatePresence>
          {renderSnakeSegments()}
  </AnimatePresence>
        {renderFood()}
        {renderPowerUp()}
        {renderActivePowerUps()}
        {renderPauseOverlay()}
        {renderGameOverOverlay()}  
      </motion.div>

      {/* Game Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-gray-800 bg-opacity-80 rounded-2xl p-4 mb-4 shadow-lg backdrop-blur-sm"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <span className="text-white">Level:</span>
            <span className="text-green-400 font-bold">{level}</span>
            <span className="text-white ml-4">Lives:</span>
            <div className="flex gap-1">
              {Array.from({ length: lives }).map((_, i) => (
                <span key={i} className="text-red-500">❤️</span>
              ))}
        </div>
          </div>
          <div className="flex space-x-4 text-white text-sm sm:text-base">
            <div className="bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-gray-300 mr-1">Score:</span>
              <span className="font-bold">{score}</span>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-gray-300 mr-1">High:</span>
              <span className="font-bold">{highScore}</span>
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-gray-300 mr-1">Speed:</span>
              <span className="font-bold">{Math.round(INITIAL_GAME_SPEED - gameSpeed)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Controls */}
      {showMobileControls && (
      <div className="fixed bottom-0 left-0 right-0 w-full">
          {settings.controlType === 'JOYSTICK' ? (
            <div className="flex justify-center mb-4">
              <VirtualJoystick onDirectionChange={handleDirectionChange} />
  </div>
          ) : (
            <ArrowKeys 
              onDirectionChange={handleDirectionChange} 
              layout={controlLayout}
            />
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <GameSettings
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <Achievements
          achievements={achievements}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </div>
  );
};

export default SnakeGame;