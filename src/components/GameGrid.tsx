import React from 'react';

interface GameGridProps {
  pattern: 'NONE' | 'DOTS' | 'LINES';
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
              width: '4px',
              height: '4px',
              backgroundColor: color,
              left: `${i * cellSize + cellSize / 2 - 2}px`,
              top: `${j * cellSize + cellSize / 2 - 2}px`,
              opacity: 0.3
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
    for (let i = 1; i < gridSize; i++) {
      lines.push(
        <div
          key={`vline-${i}`}
          className="absolute"
          style={{
            width: '1px',
            height: '100%',
            backgroundColor: color,
            left: `${i * cellSize}px`,
            opacity: 0.2
          }}
        />
      );
    }
    // Horizontal lines
    for (let i = 1; i < gridSize; i++) {
      lines.push(
        <div
          key={`hline-${i}`}
          className="absolute"
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: color,
            top: `${i * cellSize}px`,
            opacity: 0.2
          }}
        />
      );
    }
    return lines;
  };

  return (
    <div className="absolute inset-0">
      {pattern === 'DOTS' && renderDots()}
      {pattern === 'LINES' && renderLines()}
    </div>
  );
};

export default GameGrid;