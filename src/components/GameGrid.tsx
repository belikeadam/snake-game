import React from 'react';

interface GameGridProps {
  pattern: 'NONE' | 'DOTS' | 'LINES' | 'GRID';
  gridSize: number;
  cellSize: number;
  color: string;
}

const GameGrid: React.FC<GameGridProps> = ({ pattern, gridSize, cellSize, color }) => {
  if (pattern === 'NONE') return null;

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        dots.push(
          <div
            key={`dot-${i}-${j}`}
            className="absolute rounded-full"
            style={{
              width: '2px',
              height: '2px',
              backgroundColor: color,
              opacity: 0.5,
              left: `${i * cellSize + cellSize / 2}px`,
              top: `${j * cellSize + cellSize / 2}px`,
            }}
          />
        );
      }
    }
    return dots;
  };

  const renderLines = () => {
    const lines = [];
    
    // Vertical lines
    for (let i = 0; i <= gridSize; i++) {
      lines.push(
        <div
          key={`v-line-${i}`}
          className="absolute"
          style={{
            width: '1px',
            height: `${gridSize * cellSize}px`,
            backgroundColor: color,
            opacity: 0.3,
            left: `${i * cellSize}px`,
            top: '0',
          }}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i <= gridSize; i++) {
      lines.push(
        <div
          key={`h-line-${i}`}
          className="absolute"
          style={{
            width: `${gridSize * cellSize}px`,
            height: '1px',
            backgroundColor: color,
            opacity: 0.3,
            left: '0',
            top: `${i * cellSize}px`,
          }}
        />
      );
    }
    
    return lines;
  };

  const renderGrid = () => {
    const grid = [];
    
    // Vertical lines
    for (let i = 0; i <= gridSize; i++) {
      grid.push(
        <div
          key={`v-grid-${i}`}
          className="absolute"
          style={{
            width: '1px',
            height: `${gridSize * cellSize}px`,
            backgroundColor: color,
            opacity: 0.5,
            left: `${i * cellSize}px`,
            top: '0',
          }}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i <= gridSize; i++) {
      grid.push(
        <div
          key={`h-grid-${i}`}
          className="absolute"
          style={{
            width: `${gridSize * cellSize}px`,
            height: '1px',
            backgroundColor: color,
            opacity: 0.5,
            left: '0',
            top: `${i * cellSize}px`,
          }}
        />
      );
    }
    
    return grid;
  };

  return (
    <div className="absolute inset-0">
      {pattern === 'DOTS' && renderDots()}
      {pattern === 'LINES' && renderLines()}
      {pattern === 'GRID' && renderGrid()}
    </div>
  );
};

export default GameGrid;