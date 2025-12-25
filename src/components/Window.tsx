'use client';

import { useRef, useEffect, useState } from 'react';
import type { AppWindow } from '@kernel/types';
import { Minus, Square, X } from 'lucide-react';

interface WindowProps {
  window: AppWindow;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

export default function Window({
  window,
  onClose,
  onFocus,
  onMinimize,
  onMaximize,
}: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        if (windowRef.current) {
          windowRef.current.style.left = `${e.clientX - dragOffset.x}px`;
          windowRef.current.style.top = `${e.clientY - dragOffset.y}px`;
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      onFocus();
    }
  };

  if (window.isMinimized) {
    return null;
  }

  const style: React.CSSProperties = window.isMaximized
    ? {
        left: 0,
        top: 0,
        width: '100%',
        height: 'calc(100% - 56px)',
      }
    : {
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      };

  return (
    <div
      ref={windowRef}
      className={`window ${window.isFocused ? 'focused' : ''}`}
      style={style}
      onClick={onFocus}
    >
      {/* Titlebar */}
      <div
        className="window-titlebar"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{window.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <Square size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-red-500 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="window-content">
        <WindowContent window={window} />
      </div>
    </div>
  );
}

function WindowContent({ window }: { window: AppWindow }) {
  // Placeholder content based on app
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      <div className="text-center">
        <p className="text-4xl mb-4">🚧</p>
        <p className="text-lg mb-2">{window.title}</p>
        <p className="text-sm">App interface coming soon...</p>
        <p className="text-xs mt-4 text-gray-600">Window ID: {window.id}</p>
      </div>
    </div>
  );
}
