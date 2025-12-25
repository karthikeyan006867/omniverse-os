'use client';

import React, { useState } from 'react';
import { Delete } from 'lucide-react';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(current);
    } else if (operation) {
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      case '%': return a % b;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const buttons = [
    ['C', '←', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['±', '0', '.', '='],
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 p-4">
      {/* Display */}
      <div className="bg-gray-800 p-6 rounded-lg mb-4">
        <div className="text-right text-4xl font-bold text-white break-all">
          {display}
        </div>
        {operation && (
          <div className="text-right text-sm text-gray-400 mt-2">
            {previousValue} {operation}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="grid gap-2 flex-1">
        {buttons.map((row, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            {row.map((btn) => {
              const isOperation = ['÷', '×', '-', '+', '%'].includes(btn);
              const isEquals = btn === '=';
              const isClear = btn === 'C';
              const isBackspace = btn === '←';
              
              return (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') handleClear();
                    else if (btn === '=') handleEquals();
                    else if (btn === '.') handleDecimal();
                    else if (btn === '±') setDisplay(String(-parseFloat(display)));
                    else if (btn === '←') handleBackspace();
                    else if (isOperation) handleOperation(btn);
                    else handleNumber(btn);
                  }}
                  className={`
                    py-4 rounded-lg font-semibold text-xl transition-colors
                    ${isOperation || isEquals
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                      : isClear
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : isBackspace
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }
                  `}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
