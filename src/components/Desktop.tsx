'use client';

import { useState, useEffect } from 'react';
import { appManager } from '@/apps/appManager';
import { kernel } from '@kernel/index';
import type { App, AppWindow, SystemStats } from '@kernel/types';
import Window from './Window';
import Taskbar from './Taskbar';

export default function Desktop() {
  const [apps, setApps] = useState<App[]>([]);
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [showAppMenu, setShowAppMenu] = useState(false);

  useEffect(() => {
    loadApps();
    updateSystemStats();

    // Update stats every 5 seconds
    const interval = setInterval(updateSystemStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadApps = async () => {
    const allApps = await appManager.getAllApps();
    setApps(allApps);
  };

  const updateSystemStats = async () => {
    const stats = await kernel.getSystemStats();
    setSystemStats(stats);
  };

  const launchApp = async (appId: string) => {
    try {
      await appManager.launchApp(appId);
      updateWindows();
      setShowAppMenu(false);
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  };

  const updateWindows = () => {
    const allWindows = appManager.getAllWindows();
    setWindows([...allWindows]);
  };

  const handleWindowClose = async (windowId: string) => {
    await appManager.closeWindow(windowId);
    updateWindows();
  };

  const handleWindowFocus = (windowId: string) => {
    appManager.focusWindow(windowId);
    updateWindows();
  };

  const handleWindowMinimize = (windowId: string) => {
    appManager.minimizeWindow(windowId);
    updateWindows();
  };

  const handleWindowMaximize = (windowId: string) => {
    appManager.maximizeWindow(windowId);
    updateWindows();
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-omni-dark via-purple-900/10 to-omni-dark overflow-hidden">
      {/* Desktop Area */}
      <div className="flex-1 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(45, 212, 191, 0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Desktop Widgets */}
        <div className="absolute top-4 right-4 space-y-4">
          {/* System Stats Card */}
          {systemStats && (
            <div className="card w-64 text-sm">
              <h3 className="font-semibold text-omni-blue mb-3">System Status</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex justify-between">
                  <span>Processes:</span>
                  <span className="text-omni-blue">{systemStats.totalProcesses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Apps:</span>
                  <span className="text-omni-purple">{systemStats.activeApps}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="text-omni-pink">
                    {Math.round(systemStats.storageUsed / 1024 / 1024)}MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="text-gray-300">
                    {Math.floor(systemStats.uptime / 1000 / 60)}m
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Windows */}
        {windows.map(window => (
          <Window
            key={window.id}
            window={window}
            onClose={() => handleWindowClose(window.id)}
            onFocus={() => handleWindowFocus(window.id)}
            onMinimize={() => handleWindowMinimize(window.id)}
            onMaximize={() => handleWindowMaximize(window.id)}
          />
        ))}

        {/* App Menu */}
        {showAppMenu && (
          <div className="absolute bottom-20 left-4 w-96 max-h-96 overflow-y-auto card">
            <h3 className="text-lg font-semibold text-omni-blue mb-4">Applications</h3>
            <div className="grid grid-cols-3 gap-3">
              {apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => launchApp(app.id)}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-omni-blue/10 transition-colors"
                >
                  <span className="text-4xl mb-2">{app.icon}</span>
                  <span className="text-xs text-center text-gray-300">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        onAppMenuToggle={() => setShowAppMenu(!showAppMenu)}
        onWindowClick={(windowId) => {
          const window = windows.find(w => w.id === windowId);
          if (window?.isMinimized) {
            handleWindowFocus(windowId);
          } else {
            handleWindowMinimize(windowId);
          }
        }}
        systemStats={systemStats}
      />
    </div>
  );
}
