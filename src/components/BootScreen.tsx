'use client';

interface BootScreenProps {
  progress: number;
  message: string;
}

export default function BootScreen({ progress, message }: BootScreenProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-omni-dark via-purple-900/20 to-omni-dark">
      <div className="text-center space-y-8 max-w-2xl px-8">
        {/* Logo */}
        <div className="animate-pulse-slow">
          <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-omni-blue via-omni-purple to-omni-pink bg-clip-text text-transparent">
            OMNIVERSE
          </h1>
          <p className="text-2xl text-gray-400">Operating System</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-omni-blue to-omni-purple transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status message */}
        <div className="space-y-2">
          <p className="text-lg text-gray-300 animate-fade-in">{message}</p>
          <p className="text-sm text-gray-500">{progress}%</p>
        </div>

        {/* Loading spinner */}
        <div className="flex justify-center">
          <div className="loading w-12 h-12 border-4" />
        </div>

        {/* Version info */}
        <div className="text-xs text-gray-600 mt-8">
          <p>Version 0.1.0 - Foundation Release</p>
          <p className="mt-2">Initializing subsystems...</p>
        </div>
      </div>
    </div>
  );
}
