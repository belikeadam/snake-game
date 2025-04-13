import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSettings, GameMode, Difficulty, Theme, GridPattern, SnakeStyle, ControlType } from '../types';

interface MainMenuProps {
  onStartGame: (settings: GameSettings) => void;
  onShowAchievements: () => void;
  onShowTutorial: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onShowAchievements, onShowTutorial }) => {
  const [settings, setSettings] = useState<GameSettings>({
    gameMode: 'CLASSIC',
    difficulty: 'MEDIUM',
    theme: 'DARK',
    gridPattern: 'DOTS',
    snakeStyle: 'SMOOTH',
    controlType: 'ARROWS',
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
  });

  const [activeTab, setActiveTab] = useState<'game' | 'visual' | 'controls' | 'audio'>('game');
  const [showPreview, setShowPreview] = useState(false);
  const [previewSnake, setPreviewSnake] = useState<{ x: number; y: number }[]>([
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ]);
  const [previewFood, setPreviewFood] = useState<{ x: number; y: number }>({ x: 8, y: 5 });
  const [previewPowerUp, setPreviewPowerUp] = useState<{ x: number; y: number; type: string } | null>({ x: 10, y: 5, type: 'SPEED' });

  // Animate preview snake
  useEffect(() => {
    if (!showPreview) return;
    
    const interval = setInterval(() => {
      setPreviewSnake(prev => {
        const newSnake = [...prev];
        const head = { ...newSnake[0] };
        
        // Move head
        if (head.x < 10) {
          head.x += 1;
        } else {
          // Reset position
          return [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 },
          ];
        }
        
        newSnake.unshift(head);
        newSnake.pop();
        return newSnake;
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, [showPreview]);

  const handleSettingsChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleStartGame = () => {
    onStartGame(settings);
  };

  const renderGameModeSelector = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-white">Game Mode</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'CLASSIC', name: 'Classic', icon: '🐍' },
          { id: 'TIME_ATTACK', name: 'Time Attack', icon: '⏱️' },
          { id: 'CHALLENGE', name: 'Challenge', icon: '🏆' },
          { id: 'SURVIVAL', name: 'Survival', icon: '💀' }
        ].map((mode) => (
          <button
            key={mode.id}
            className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              settings.gameMode === mode.id
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleSettingsChange('gameMode', mode.id)}
          >
            <span>{mode.icon}</span>
            <span>{mode.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDifficultySelector = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-white">Difficulty</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'EASY', name: 'Easy', color: 'bg-green-500' },
          { id: 'MEDIUM', name: 'Medium', color: 'bg-yellow-500' },
          { id: 'HARD', name: 'Hard', color: 'bg-orange-500' },
          { id: 'EXPERT', name: 'Expert', color: 'bg-red-500' }
        ].map((difficulty) => (
          <button
            key={difficulty.id}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              settings.difficulty === difficulty.id
                ? `${difficulty.color} text-white shadow-lg shadow-${difficulty.color.split('-')[1]}-900/50`
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleSettingsChange('difficulty', difficulty.id)}
          >
            {difficulty.name}
          </button>
        ))}
      </div>
    </div>
  );

  const renderThemeSelector = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-white">Theme</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'DARK', name: 'Dark', color: 'bg-gray-900' },
          { id: 'LIGHT', name: 'Light', color: 'bg-gray-100' },
          { id: 'NEON', name: 'Neon', color: 'bg-purple-900' },
          { id: 'RETRO', name: 'Retro', color: 'bg-green-900' },
          { id: 'CYBER', name: 'Cyber', color: 'bg-blue-900' },
          { id: 'NATURE', name: 'Nature', color: 'bg-green-800' }
        ].map((theme) => (
          <button
            key={theme.id}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              settings.theme === theme.id
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleSettingsChange('theme', theme.id)}
          >
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSnakeStyleSelector = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-white">Snake Style</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'CLASSIC', name: 'Classic', icon: '⬜' },
          { id: 'SMOOTH', name: 'Smooth', icon: '⭕' },
          { id: 'GRADIENT', name: 'Gradient', icon: '🌈' },
          { id: 'NEON', name: 'Neon', icon: '✨' },
          { id: 'PIXEL', name: 'Pixel', icon: '🟦' }
        ].map((style) => (
          <button
            key={style.id}
            className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              settings.snakeStyle === style.id
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleSettingsChange('snakeStyle', style.id)}
          >
            <span>{style.icon}</span>
            <span>{style.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderControlTypeSelector = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-white">Controls</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'ARROWS', name: 'Arrow Keys', icon: '⬆️' },
          { id: 'WASD', name: 'WASD', icon: '⌨️' },
          { id: 'TOUCH', name: 'Touch', icon: '👆' },
          { id: 'JOYSTICK', name: 'Joystick', icon: '🎮' }
        ].map((control) => (
          <button
            key={control.id}
            className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              settings.controlType === control.id
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleSettingsChange('controlType', control.id)}
          >
            <span>{control.icon}</span>
            <span>{control.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSoundSettings = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-white">Sound & Vibration</h3>
      <div className="space-y-3 bg-gray-800 p-4 rounded-lg">
        <label className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            <span>🔊</span>
            <span>Sound Effects</span>
          </span>
          <div className="relative inline-block w-12 h-6 rounded-full bg-gray-600">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => handleSettingsChange('soundEnabled', e.target.checked)}
              className="sr-only"
            />
            <div 
              className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-all ${
                settings.soundEnabled ? 'bg-green-500 translate-x-6' : 'bg-gray-400'
              }`}
            />
          </div>
        </label>
        <label className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            <span>🎵</span>
            <span>Music</span>
          </span>
          <div className="relative inline-block w-12 h-6 rounded-full bg-gray-600">
            <input
              type="checkbox"
              checked={settings.musicEnabled}
              onChange={(e) => handleSettingsChange('musicEnabled', e.target.checked)}
              className="sr-only"
            />
            <div 
              className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-all ${
                settings.musicEnabled ? 'bg-green-500 translate-x-6' : 'bg-gray-400'
              }`}
            />
          </div>
        </label>
        <label className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            <span>📳</span>
            <span>Vibration</span>
          </span>
          <div className="relative inline-block w-12 h-6 rounded-full bg-gray-600">
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => handleSettingsChange('vibrationEnabled', e.target.checked)}
              className="sr-only"
            />
            <div 
              className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-all ${
                settings.vibrationEnabled ? 'bg-green-500 translate-x-6' : 'bg-gray-400'
              }`}
            />
          </div>
        </label>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-white">Preview</h3>
      <div 
        className="relative w-full h-32 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {/* Grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6">
          {Array.from({ length: 72 }).map((_, i) => (
            <div key={i} className="border border-gray-700 opacity-20"></div>
          ))}
        </div>
        
        {/* Snake */}
        {previewSnake.map((segment, index) => (
          <div
            key={index}
            className="absolute w-4 h-4 rounded-sm"
            style={{
              left: `${segment.x * 8}%`,
              top: `${segment.y * 16}%`,
              backgroundColor: index === 0 ? '#22c55e' : '#16a34a',
              boxShadow: index === 0 ? '0 0 5px #22c55e' : 'none',
              zIndex: 10,
            }}
          />
        ))}
        
        {/* Food */}
        <div
          className="absolute w-4 h-4 rounded-full flex items-center justify-center text-xs"
          style={{
            left: `${previewFood.x * 8}%`,
            top: `${previewFood.y * 16}%`,
            backgroundColor: '#ef4444',
            boxShadow: '0 0 5px #ef4444',
            zIndex: 10,
          }}
        >
          🍎
        </div>
        
        {/* Power-up */}
        {previewPowerUp && (
          <div
            className="absolute w-4 h-4 rounded-full flex items-center justify-center text-xs"
            style={{
              left: `${previewPowerUp.x * 8}%`,
              top: `${previewPowerUp.y * 16}%`,
              backgroundColor: previewPowerUp.type === 'SPEED' ? '#fbbf24' : '#8b5cf6',
              boxShadow: `0 0 5px ${previewPowerUp.type === 'SPEED' ? '#fbbf24' : '#8b5cf6'}`,
              zIndex: 10,
            }}
          >
            {previewPowerUp.type === 'SPEED' ? '⚡' : '×2'}
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'game':
        return (
          <>
            {renderGameModeSelector()}
            {renderDifficultySelector()}
          </>
        );
      case 'visual':
        return (
          <>
            {renderThemeSelector()}
            {renderSnakeStyleSelector()}
            {renderPreview()}
          </>
        );
      case 'controls':
        return renderControlTypeSelector();
      case 'audio':
        return renderSoundSettings();
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2"
          >
            SNAKE GAME
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400"
          >
            Classic snake game with modern twists
          </motion.p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            {[
              { id: 'game', name: 'Game', icon: '🎮' },
              { id: 'visual', name: 'Visual', icon: '🎨' },
              { id: 'controls', name: 'Controls', icon: '⌨️' },
              { id: 'audio', name: 'Audio', icon: '🔊' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-8"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-green-900/50"
          >
            Start Game
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShowTutorial}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-blue-900/50"
          >
            Tutorial
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShowAchievements}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-purple-900/50"
          >
            Achievements
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MainMenu; 