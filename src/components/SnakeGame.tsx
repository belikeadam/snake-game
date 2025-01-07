import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowKeys from './ArrowKeys';  

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Coordinate = { x: number; y: number };

const INITIAL_GRID_SIZE = 20;
const INITIAL_CELL_SIZE = 25;
const INITIAL_GAME_SPEED = 200;
const MAX_SPEED = 50;
const SPEED_INCREMENT_INTERVAL = 3;

export default function SnakeGame() {
    const [snake, setSnake] = useState<Coordinate[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Coordinate>({ x: 15, y: 15 });
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameSpeed, setGameSpeed] = useState(INITIAL_GAME_SPEED);
    const [gridSize, setGridSize] = useState(INITIAL_GRID_SIZE);
    const [cellSize, setCellSize] = useState(INITIAL_CELL_SIZE);

    const lastMoveTime = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    const generateFood = useCallback(() => {
        const occupiedCells = new Set(snake.map(segment => `${segment.x},${segment.y}`));
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * (gridSize - 2)) + 1,
                y: Math.floor(Math.random() * (gridSize - 2)) + 1
            };
        } while (occupiedCells.has(`${newFood.x},${newFood.y}`));
        return newFood;
    }, [snake, gridSize]);

    const adjustGameDifficulty = useCallback(() => {
        if (score > 0 && score % SPEED_INCREMENT_INTERVAL === 0) {
            setGameSpeed(prev => Math.max(prev - 20, MAX_SPEED));
            if (score % 6 === 0) {
                setGridSize(prev => Math.min(prev + 2, 30));
                setCellSize(prev => Math.max(prev - 2, 20));
            }
        }
    }, [score]);

    const moveSnake = useCallback((timestamp: number) => {
        if (gameOver) return;

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
            const newScore = score + 1;
            setScore(newScore);
            setFood(generateFood());
            adjustGameDifficulty();
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
        animationFrameRef.current = requestAnimationFrame(moveSnake);
    }, [snake, nextDirection, food, score, gameOver, generateFood, gridSize, gameSpeed, adjustGameDifficulty]);

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
            }
        };

        animationFrameRef.current = requestAnimationFrame(moveSnake);
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [moveSnake, direction]);

    const restartGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood(generateFood());
        setDirection('RIGHT');
        setNextDirection('RIGHT');
        setGameOver(false);
        setScore(0);
        setGameSpeed(INITIAL_GAME_SPEED);
        setGridSize(INITIAL_GRID_SIZE);
        setCellSize(INITIAL_CELL_SIZE);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 touch-none select-none">
            <div className="text-center mb-6">
                <motion.h1 initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-green-400 mb-2">Snake Game</motion.h1>
                <div className="flex justify-center space-x-4 text-white">
                    <p>Score: {score}</p>
                    <p>High Score: {highScore}</p>
                    <p>Speed: {Math.round(INITIAL_GAME_SPEED - gameSpeed)}</p>
                </div>
            </div>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="relative border-4 border-green-600 rounded-lg shadow-2xl overflow-hidden" style={{ width: `${gridSize * cellSize}px`, height: `${gridSize * cellSize}px` }}>
                <AnimatePresence>
                    {snake.map((segment, index) => (
                        <motion.div key={`${segment.x}-${segment.y}`} initial={{ scale: 0.6, opacity: 0.7 }} animate={{ scale: 1, opacity: 1, backgroundColor: index === 0 ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)' }} exit={{ scale: 0, opacity: 0 }} className="absolute rounded-md" style={{ width: `${cellSize}px`, height: `${cellSize}px`, left: `${segment.x * cellSize}px`, top: `${segment.y * cellSize}px` }} />
                    ))}
                </AnimatePresence>
                <motion.div key={`${food.x}-${food.y}`} animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} className="absolute bg-red-500 rounded-full" style={{ width: `${cellSize}px`, height: `${cellSize}px`, left: `${food.x * cellSize}px`, top: `${food.y * cellSize}px` }} />
                <AnimatePresence>
                    {gameOver && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                            <motion.h2 initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-4xl text-red-500 mb-6 font-bold">Game Over!</motion.h2>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={restartGame} className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition transform">Restart Game</motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-white text-sm text-center">Use Arrow Keys to Control the Snake</motion.div>
            <ArrowKeys />  
        </div>
    );
}