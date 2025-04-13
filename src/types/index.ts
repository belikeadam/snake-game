import React from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Coordinate = { 
  x: number; 
  y: number; 
  style?: React.CSSProperties;
};
export type PowerUpType = 'SPEED' | 'MULTIPLIER' | 'SHIELD' | 'GHOST' | 'MAGNET';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type Theme = 'CLASSIC' | 'NEON' | 'RETRO' | 'NOKIA' | 'DARK' | 'LIGHT' | 'CYBER' | 'NATURE' | 'RAINBOW' | 'MINIMAL';
export type GridPattern = 'NONE' | 'DOTS' | 'LINES' | 'GRID';
export type FoodEmoji = '🍕' | '🍔' | '🍎' | '🍗' | '🍪' | '🍉' | '🍇' | '🍓' | '🥑' | '🥕';
export type GameMode = 'CLASSIC' | 'TIME_ATTACK' | 'CHALLENGE' | 'SURVIVAL';
export type ControlType = 'ARROWS' | 'WASD' | 'TOUCH' | 'JOYSTICK';
export type SnakeStyle = 'CLASSIC' | 'ROUNDED' | 'GRADIENT' | 'NEON' | 'PIXEL' | 'SMOOTH';

export interface PowerUp extends Coordinate {
  type: PowerUpType;
  duration?: number;
  value?: number;
}

export interface Obstacle extends Coordinate {
  type: 'WALL' | 'SPIKE' | 'PORTAL';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface GameSettings {
  difficulty: Difficulty;
  theme: Theme;
  gridPattern: GridPattern;
  snakeStyle: SnakeStyle;
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  controlType: ControlType;
  gameMode: GameMode;
}

export interface GameStats {
  highScore: number;
  totalGames: number;
  totalPlayTime: number;
  foodEaten: number;
  powerUpsCollected: number;
  achievements: Achievement[];
}

export interface ThemeColors {
  background: string;
  snake: string;
  food: string;
  grid: string;
  powerUp: Record<PowerUpType, string>;
  text: string;
  border: string;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  level: number;
  timeRemaining?: number;
  lives?: number;
}