'use client';

import { useState } from 'react';
import type { AppWindow, SystemStats } from '@kernel/types';
import { Menu, Cpu, HardDrive, Activity } from 'lucide-react';

interface TaskbarProps {
  windows: AppWindow[];
  onAppMenuToggle: () => void;
  onWindowClick: (windowId: string) => void;
  systemStats: SystemStats | null;
}

export default function Taskbar({
  windows,
  onAppMenuToggle,
  onWindowClick,
  systemStats,
}: TaskbarProps) {
  const [showSystemMenu, setShowSystemMenu] = useState(false);

  const getTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="h-14 bg-omni-dark/90 backdrop-blur-xl border-t border-omni-blue/30 flex items-center px-4 gap-2">
      {/* App Menu Button */}
      <button
        onClick={onAppMenuToggle}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-omni-blue/20 transition-colors"
        title="Applications"
      >
        <Menu size={20} className="text-omni-blue" />
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-700" />

      {/* Window Buttons */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto">
        {windows
          .filter(w => !w.isMinimized)
          .map(window => (
            <button
              key={window.id}
              onClick={() => onWindowClick(window.id)}
              className={`px-4 h-10 rounded-lg transition-all ${
                window.isFocused
                  ? 'bg-omni-blue/30 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span className="text-sm truncate max-w-[150px]">
                {window.title}
              </span>
            </button>
          ))}
      </div>

      {/* System Info */}
      <div className="flex items-center gap-4">
        {systemStats && (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Cpu size={14} className="text-omni-blue" />
              <span>{systemStats.totalProcesses}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Activity size={14} className="text-omni-purple" />
              <span>{systemStats.activeApps}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <HardDrive size={14} className="text-omni-pink" />
              <span>{Math.round(systemStats.storageUsed / 1024 / 1024)}MB</span>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="w-px h-8 bg-gray-700" />

        {/* Clock */}
        <div className="text-sm">
          <div className="text-white font-medium">{getTime()}</div>
          <div className="text-xs text-gray-400">{getDate()}</div>
        </div>
      </div>
    </div>
  );
}
