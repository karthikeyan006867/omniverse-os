'use client';

import React, { useState, useEffect, useCallback } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const gridSize = 20;

  const generateFood = useCallback((): Position => {
    return {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };

        switch (direction) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setFood(generateFood());
          setScore(prev => prev + 10);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [direction, food, gameOver, isPaused, score, highScore, generateFood]);

  return (
    <div className="h-full bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-600 bg-clip-text text-transparent">
        Snake Game
      </h1>

      <div className="flex gap-6 mb-4">
        <div className="bg-green-600 px-4 py-2 rounded-lg">
          <div className="text-xs opacity-75">Score</div>
          <div className="text-2xl font-bold">{score}</div>
        </div>
        <div className="bg-blue-600 px-4 py-2 rounded-lg">
          <div className="text-xs opacity-75">High Score</div>
          <div className="text-2xl font-bold">{highScore}</div>
        </div>
      </div>

      {/* Game Board */}
      <div 
        className="bg-gray-800 rounded-lg p-2 mb-4"
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 20px)`,
          gap: '1px'
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = index % gridSize;
          const y = Math.floor(index / gridSize);
          const isSnake = snake.some(segment => segment.x === x && segment.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={index}
              className={`w-5 h-5 rounded-sm ${
                isHead ? 'bg-green-400' :
                isSnake ? 'bg-green-600' :
                isFood ? 'bg-red-500' :
                'bg-gray-700'
              }`}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="text-center mb-4">
        {gameOver && (
          <div className="text-red-400 text-xl font-bold mb-2">Game Over!</div>
        )}
        {isPaused && !gameOver && (
          <div className="text-yellow-400 text-xl font-bold mb-2">Paused</div>
        )}
        <div className="text-sm text-gray-400">Use arrow keys to move • Space to pause</div>
      </div>

      <button
        onClick={resetGame}
        className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg hover:from-green-500 hover:to-blue-500 transition-colors"
      >
        {gameOver ? 'Play Again' : 'Restart'}
      </button>
    </div>
  );
}
