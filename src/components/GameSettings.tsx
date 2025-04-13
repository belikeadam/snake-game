import React from 'react';
import { motion } from 'framer-motion';

// Define types directly to avoid import issues
type Theme = 'CLASSIC' | 'NEON' | 'RETRO' | 'NOKIA' | 'DARK' | 'LIGHT' | 'CYBER' | 'NATURE';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
type GridPattern = 'NONE' | 'DOTS' | 'LINES' | 'GRID';
type GameMode = 'CLASSIC' | 'TIME_ATTACK' | 'CHALLENGE' | 'SURVIVAL';
type ControlType = 'ARROWS' | 'WASD' | 'TOUCH' | 'JOYSTICK';

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

interface GameSettingsProps {
  settings: GameSettingsType;
  onSettingsChange: (settings: Partial<GameSettingsType>) => void;
  onClose: () => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({ settings, onSettingsChange, onClose }) => {
  const handleChange = (key: keyof GameSettingsType, value: any) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-gray-800 rounded-lg border-2 border-green-500 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-green-400">Game Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Game Mode */}
          <div>
            <label className="block text-white text-sm font-medium mb-1">Game Mode</label>
            <select
              value={settings.gameMode}
              onChange={(e) => handleChange('gameMode', e.target.value as GameMode)}
              className="w-full bg-gray-700 text-white p-2 rounded text-base"
            >
              <option value="CLASSIC">Classic Mode</option>
              <option value="TIME_ATTACK">Time Attack</option>
              <option value="CHALLENGE">Challenge Mode</option>
              <option value="SURVIVAL">Survival Mode</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-white text-sm font-medium mb-1">Difficulty</label>
            <select
              value={settings.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value as Difficulty)}
              className="w-full bg-gray-700 text-white p-2 rounded text-base"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-white text-sm font-medium mb-1">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value as Theme)}
              className="w-full bg-gray-700 text-white p-2 rounded text-base"
            >
              <option value="CLASSIC">Classic</option>
              <option value="NEON">Neon</option>
              <option value="RETRO">Retro</option>
              <option value="NOKIA">Nokia</option>
              <option value="DARK">Dark</option>
              <option value="LIGHT">Light</option>
              <option value="CYBER">Cyber</option>
              <option value="NATURE">Nature</option>
            </select>
          </div>

          {/* Grid Pattern */}
          <div>
            <label className="block text-white text-sm font-medium mb-1">Grid Pattern</label>
            <select
              value={settings.gridPattern}
              onChange={(e) => handleChange('gridPattern', e.target.value as GridPattern)}
              className="w-full bg-gray-700 text-white p-2 rounded text-base"
            >
              <option value="NONE">None</option>
              <option value="DOTS">Dots</option>
              <option value="LINES">Lines</option>
              <option value="GRID">Grid</option>
            </select>
          </div>

          {/* Snake Style */}
          <div>
            <label className="block text-white text-sm font-medium mb-1">Snake Style</label>
            <select
              value={settings.snakeStyle}
              onChange={(e) => handleChange('snakeStyle', e.target.value as 'CLASSIC' | 'ROUNDED' | 'GRADIENT' | 'NEON')}
              className="w-full bg-gray-700 text-white p-2 rounded text-base"
            >
              <option value="CLASSIC">Classic</option>
              <option value="ROUNDED">Rounded</option>
              <option value="GRADIENT">Gradient</option>
              <option value="NEON">Neon</option>
            </select>
          </div>

          {/* Control Type */}
          <div>
            <label className="block text-white text-sm font-medium mb-1">Control Type</label>
            <select
              value={settings.controlType}
              onChange={(e) => handleChange('controlType', e.target.value as ControlType)}
              className="w-full bg-gray-700 text-white p-2 rounded text-base"
            >
              <option value="ARROWS">Arrow Keys</option>
              <option value="WASD">WASD</option>
              <option value="TOUCH">Touch Controls</option>
              <option value="JOYSTICK">Virtual Joystick</option>
            </select>
          </div>

          {/* Sound Settings */}
          <div className="pt-2 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-2">Sound Settings</h3>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-white">Sound Effects</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white">Background Music</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.musicEnabled}
                  onChange={(e) => handleChange('musicEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between">
            <span className="text-white">Vibration (Mobile)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => handleChange('vibrationEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameSettings; 