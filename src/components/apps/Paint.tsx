'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paintbrush, Eraser, Square, Circle, Download, RotateCcw } from 'lucide-react';

export default function Paint() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'rectangle' | 'circle'>('brush');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = tool === 'eraser' ? 'white' : color;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `paint-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-3 bg-white border-b">
        <button
          onClick={() => setTool('brush')}
          className={`p-2 rounded ${tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          <Paintbrush size={20} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          <Eraser size={20} />
        </button>

        <div className="w-px h-8 bg-gray-300" />

        <div className="flex gap-2">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded border-2 ${color === c ? 'border-black' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-8 bg-gray-300" />

        <div className="flex items-center gap-2">
          <label className="text-sm">Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm w-8">{brushSize}</span>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        <button
          onClick={clearCanvas}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
        >
          <RotateCcw size={16} /> Clear
        </button>

        <button
          onClick={downloadImage}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
        >
          <Download size={16} /> Save
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden p-4">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border border-gray-300 bg-white cursor-crosshair"
        />
      </div>
    </div>
  );
}
