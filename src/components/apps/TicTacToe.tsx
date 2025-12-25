'use client';

import React, { useState, useEffect } from 'react';

export default function TicTacToe() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      setWinner(result);
      if (result !== 'Draw') {
        setScores(prev => ({ ...prev, [result]: prev[result as 'X' | 'O'] + 1 }));
      } else {
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      }
    }
  }, [board]);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    if (squares.every(square => square !== null)) {
      return 'Draw';
    }

    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  return (
    <div className="h-full bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Tic Tac Toe
      </h1>

      {/* Scoreboard */}
      <div className="flex gap-4 mb-6">
        <div className="bg-blue-600 px-4 py-2 rounded-lg">
          <div className="text-xs opacity-75">Player X</div>
          <div className="text-2xl font-bold">{scores.X}</div>
        </div>
        <div className="bg-gray-700 px-4 py-2 rounded-lg">
          <div className="text-xs opacity-75">Draws</div>
          <div className="text-2xl font-bold">{scores.draws}</div>
        </div>
        <div className="bg-purple-600 px-4 py-2 rounded-lg">
          <div className="text-xs opacity-75">Player O</div>
          <div className="text-2xl font-bold">{scores.O}</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`w-20 h-20 bg-gray-800 rounded-lg text-4xl font-bold transition-all hover:bg-gray-700 ${
              cell === 'X' ? 'text-blue-400' : 'text-purple-400'
            }`}
            disabled={!!winner}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="text-xl mb-4">
        {winner ? (
          <span className="text-green-400 font-bold">
            {winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}!`}
          </span>
        ) : (
          <span>
            Next player: <span className={isXNext ? 'text-blue-400' : 'text-purple-400'}>
              {isXNext ? 'X' : 'O'}
            </span>
          </span>
        )}
      </div>

      {/* Reset button */}
      <button
        onClick={resetGame}
        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors"
      >
        New Game
      </button>
    </div>
  );
}
