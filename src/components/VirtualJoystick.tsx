import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VirtualJoystickProps {
  onDirectionChange: (direction: string) => void;
  size?: number;
  color?: string;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onDirectionChange,
  size = 120,
  color = '#22c55e'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastDirectionRef = useRef<string | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef<number>(0);
  const DEBOUNCE_TIME = 100; // Minimum time between direction changes in ms

  const maxDistance = size / 2 - 20; // Maximum distance the joystick can move
  const threshold = maxDistance * 0.3; // Threshold for direction change

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !joystickRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate position relative to center
    let x = touch.clientX - centerX;
    let y = touch.clientY - centerY;

    // Limit to max distance
    const distance = Math.sqrt(x * x + y * y);
    if (distance > maxDistance) {
      x = (x / distance) * maxDistance;
      y = (y / distance) * maxDistance;
    }

    setPosition({ x, y });

    // Determine direction based on position
    const now = Date.now();
    if (now - lastUpdateTime.current > DEBOUNCE_TIME) {
      let direction: string | null = null;

      if (Math.abs(x) > threshold || Math.abs(y) > threshold) {
        if (Math.abs(x) > Math.abs(y)) {
          direction = x > 0 ? 'ArrowRight' : 'ArrowLeft';
        } else {
          direction = y > 0 ? 'ArrowDown' : 'ArrowUp';
        }

        if (direction !== lastDirectionRef.current) {
          lastDirectionRef.current = direction;
          lastUpdateTime.current = now;
          onDirectionChange(direction);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    lastDirectionRef.current = null;
  };

  // Add mouse support for testing on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !joystickRef.current) return;
    e.preventDefault();

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let x = e.clientX - centerX;
    let y = e.clientY - centerY;

    const distance = Math.sqrt(x * x + y * y);
    if (distance > maxDistance) {
      x = (x / distance) * maxDistance;
      y = (y / distance) * maxDistance;
    }

    setPosition({ x, y });

    const now = Date.now();
    if (now - lastUpdateTime.current > DEBOUNCE_TIME) {
      let direction: string | null = null;

      if (Math.abs(x) > threshold || Math.abs(y) > threshold) {
        if (Math.abs(x) > Math.abs(y)) {
          direction = x > 0 ? 'ArrowRight' : 'ArrowLeft';
        } else {
          direction = y > 0 ? 'ArrowDown' : 'ArrowUp';
        }

        if (direction !== lastDirectionRef.current) {
          lastDirectionRef.current = direction;
          lastUpdateTime.current = now;
          onDirectionChange(direction);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    lastDirectionRef.current = null;
  };

  // Add event listeners for mouse events
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setPosition({ x: 0, y: 0 });
        lastDirectionRef.current = null;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <motion.div
      ref={joystickRef}
      className="relative touch-none select-none"
      style={{ width: size, height: size }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Joystick base */}
      <div
        className="absolute rounded-full border-2 border-gray-600 bg-gray-800 bg-opacity-80"
        style={{
          width: size,
          height: size,
          left: 0,
          top: 0,
        }}
      />

      {/* Joystick stick */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size / 3,
          height: size / 3,
          left: size / 2 - size / 6 + position.x,
          top: size / 2 - size / 6 + position.y,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
        }}
        animate={{
          scale: isDragging ? 0.9 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      />
    </motion.div>
  );
};

export default VirtualJoystick; 