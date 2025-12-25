/**
 * APP MANAGER
 * Handles app installation, launching, and lifecycle
 */

import { v4 as uuidv4 } from 'uuid';
import { storage } from '@kernel/storage';
import { processManager } from '@kernel/process';
import type { App, AppWindow, WindowConfig } from '@kernel/types';

export class AppManager {
  private static instance: AppManager;
  private windows: Map<string, AppWindow> = new Map();
  private nextZIndex: number = 100;

  private constructor() {}

  static getInstance(): AppManager {
    if (!AppManager.instance) {
      AppManager.instance = new AppManager();
    }
    return AppManager.instance;
  }

  async initialize(): Promise<void> {
    // Install built-in apps
    await this.installBuiltInApps();
    console.log('📱 App Manager initialized');
  }

  // ============================================================================
  // APP INSTALLATION
  // ============================================================================

  async installApp(app: Omit<App, 'id' | 'installedAt' | 'isRunning'>): Promise<App> {
    const newApp: App = {
      ...app,
      id: uuidv4(),
      installedAt: new Date(),
      isRunning: false,
    };

    await storage.set('apps', newApp);
    console.log(`📦 Installed app: ${newApp.name}`);

    return newApp;
  }

  async uninstallApp(appId: string): Promise<void> {
    const app = await storage.get('apps', appId);
    
    if (!app) {
      throw new Error(`App not found: ${appId}`);
    }

    if (app.isBuiltIn) {
      throw new Error('Cannot uninstall built-in apps');
    }

    // Close app if running
    if (app.isRunning) {
      await this.closeApp(appId);
    }

    await storage.delete('apps', appId);
    console.log(`🗑️ Uninstalled app: ${app.name}`);
  }

  async getApp(appId: string): Promise<App | undefined> {
    return await storage.get('apps', appId);
  }

  async getAllApps(): Promise<App[]> {
    return await storage.getAll('apps');
  }

  async getAppsByCategory(category: string): Promise<App[]> {
    return await storage.getAppsByCategory(category);
  }

  // ============================================================================
  // APP LAUNCHING
  // ============================================================================

  async launchApp(appId: string, initialState?: any): Promise<string> {
    const app = await storage.get('apps', appId);
    
    if (!app) {
      throw new Error(`App not found: ${appId}`);
    }

    // Check if app is already running and doesn't support multiple instances
    const existingProcess = processManager.getProcessByAppId(appId);
    if (existingProcess) {
      // Focus existing window
      const existingWindow = Array.from(this.windows.values()).find(
        w => w.appId === appId
      );
      if (existingWindow) {
        this.focusWindow(existingWindow.id);
        return existingWindow.id;
      }
    }

    // Spawn process
    const process = await processManager.spawn(app.name, 'app', {
      appId: app.id,
      permissions: app.permissions,
      environment: { initialState },
    });

    // Create window
    const window = this.createWindow(app, process.pid, initialState);
    this.windows.set(window.id, window);

    // Mark app as running
    app.isRunning = true;
    await storage.set('apps', app);

    console.log(`🚀 Launched app: ${app.name} (window: ${window.id})`);

    return window.id;
  }

  async closeApp(appId: string): Promise<void> {
    const app = await storage.get('apps', appId);
    
    if (!app) {
      throw new Error(`App not found: ${appId}`);
    }

    // Find and close all windows for this app
    const appWindows = Array.from(this.windows.values()).filter(
      w => w.appId === appId
    );

    for (const window of appWindows) {
      await this.closeWindow(window.id);
    }

    // Kill process
    const process = processManager.getProcessByAppId(appId);
    if (process) {
      await processManager.kill(process.pid);
    }

    // Mark app as not running
    app.isRunning = false;
    await storage.set('apps', app);

    console.log(`⛔ Closed app: ${app.name}`);
  }

  // ============================================================================
  // WINDOW MANAGEMENT
  // ============================================================================

  private createWindow(app: App, pid: string, initialState?: any): AppWindow {
    const config = app.windowConfig || this.getDefaultWindowConfig();

    const window: AppWindow = {
      id: uuidv4(),
      appId: app.id,
      title: app.name,
      x: Math.random() * 200 + 100,
      y: Math.random() * 100 + 50,
      width: config.defaultWidth,
      height: config.defaultHeight,
      zIndex: this.nextZIndex++,
      isMaximized: false,
      isMinimized: false,
      isFocused: true,
      state: initialState || {},
    };

    // Unfocus other windows
    this.windows.forEach(w => {
      w.isFocused = false;
    });

    return window;
  }

  async closeWindow(windowId: string): Promise<void> {
    const window = this.windows.get(windowId);
    
    if (!window) {
      throw new Error(`Window not found: ${windowId}`);
    }

    this.windows.delete(windowId);

    // If no more windows for this app, close the app
    const remainingWindows = Array.from(this.windows.values()).filter(
      w => w.appId === window.appId
    );

    if (remainingWindows.length === 0) {
      const app = await storage.get('apps', window.appId);
      if (app) {
        app.isRunning = false;
        await storage.set('apps', app);
      }
    }
  }

  focusWindow(windowId: string): void {
    const window = this.windows.get(windowId);
    
    if (!window) {
      throw new Error(`Window not found: ${windowId}`);
    }

    // Unfocus all windows
    this.windows.forEach(w => {
      w.isFocused = false;
    });

    // Focus target window
    window.isFocused = true;
    window.zIndex = this.nextZIndex++;
    window.isMinimized = false;
  }

  minimizeWindow(windowId: string): void {
    const window = this.windows.get(windowId);
    
    if (!window) {
      throw new Error(`Window not found: ${windowId}`);
    }

    window.isMinimized = true;
    window.isFocused = false;
  }

  maximizeWindow(windowId: string): void {
    const window = this.windows.get(windowId);
    
    if (!window) {
      throw new Error(`Window not found: ${windowId}`);
    }

    window.isMaximized = !window.isMaximized;
    window.isMinimized = false;
  }

  moveWindow(windowId: string, x: number, y: number): void {
    const window = this.windows.get(windowId);
    
    if (!window) {
      throw new Error(`Window not found: ${windowId}`);
    }

    window.x = x;
    window.y = y;
  }

  resizeWindow(windowId: string, width: number, height: number): void {
    const window = this.windows.get(windowId);
    
    if (!window) {
      throw new Error(`Window not found: ${windowId}`);
    }

    const app = storage.get('apps', window.appId);
    const config = (app as any)?.windowConfig || this.getDefaultWindowConfig();

    window.width = Math.max(config.minWidth || 200, Math.min(width, config.maxWidth || 2000));
    window.height = Math.max(config.minHeight || 150, Math.min(height, config.maxHeight || 1500));
  }

  getWindow(windowId: string): AppWindow | undefined {
    return this.windows.get(windowId);
  }

  getAllWindows(): AppWindow[] {
    return Array.from(this.windows.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  updateWindowState(windowId: string, state: any): void {
    const window = this.windows.get(windowId);
    
    if (!window) {
      throw new Error(`Window not found: ${windowId}`);
    }

    window.state = { ...window.state, ...state };
  }

  // ============================================================================
  // BUILT-IN APPS
  // ============================================================================

  private async installBuiltInApps(): Promise<void> {
    const builtInApps: Omit<App, 'id' | 'installedAt' | 'isRunning'>[] = [
      {
        name: 'File Explorer',
        version: '1.0.0',
        description: 'Browse and manage files',
        icon: '📁',
        author: 'system',
        category: 'system',
        permissions: ['filesystem.read', 'filesystem.write'],
        entryPoint: '/apps/FileExplorer',
        installSize: 102400,
        isBuiltIn: true,
        windowConfig: {
          defaultWidth: 800,
          defaultHeight: 600,
          minWidth: 600,
          minHeight: 400,
          resizable: true,
          draggable: true,
          closable: true,
          minimizable: true,
          maximizable: true,
        },
        metadata: {},
      },
      {
        name: 'Terminal',
        version: '1.0.0',
        description: 'Command-line interface',
        icon: '⌨️',
        author: 'system',
        category: 'development',
        permissions: ['filesystem.read', 'filesystem.write', 'system.admin'],
        entryPoint: '/apps/Terminal',
        installSize: 51200,
        isBuiltIn: true,
        windowConfig: {
          defaultWidth: 700,
          defaultHeight: 400,
          minWidth: 400,
          minHeight: 300,
          resizable: true,
          draggable: true,
          closable: true,
          minimizable: true,
          maximizable: true,
        },
        metadata: {},
      },
      {
        name: 'Text Editor',
        version: '1.0.0',
        description: 'Create and edit text files',
        icon: '📝',
        author: 'system',
        category: 'productivity',
        permissions: ['filesystem.read', 'filesystem.write'],
        entryPoint: '/apps/TextEditor',
        installSize: 76800,
        isBuiltIn: true,
        windowConfig: {
          defaultWidth: 600,
          defaultHeight: 500,
          minWidth: 400,
          minHeight: 300,
          resizable: true,
          draggable: true,
          closable: true,
          minimizable: true,
          maximizable: true,
        },
        metadata: {},
      },
      {
        name: 'Wallet',
        version: '1.0.0',
        description: 'Manage your currency and transactions',
        icon: '💰',
        author: 'system',
        category: 'finance',
        permissions: ['economy.transact'],
        entryPoint: '/apps/Wallet',
        installSize: 81920,
        isBuiltIn: true,
        windowConfig: {
          defaultWidth: 500,
          defaultHeight: 600,
          minWidth: 400,
          minHeight: 500,
          resizable: true,
          draggable: true,
          closable: true,
          minimizable: true,
          maximizable: true,
        },
        metadata: {},
      },
      {
        name: 'AI Assistant',
        version: '1.0.0',
        description: 'Your personal AI helper',
        icon: '🤖',
        author: 'system',
        category: 'ai',
        permissions: ['ai.execute', 'filesystem.read', 'network.access'],
        entryPoint: '/apps/AIAssistant',
        installSize: 153600,
        isBuiltIn: true,
        windowConfig: {
          defaultWidth: 450,
          defaultHeight: 650,
          minWidth: 350,
          minHeight: 500,
          resizable: true,
          draggable: true,
          closable: true,
          minimizable: true,
          maximizable: true,
        },
        metadata: {},
      },
      {
        name: 'Settings',
        version: '1.0.0',
        description: 'System preferences and configuration',
        icon: '⚙️',
        author: 'system',
        category: 'system',
        permissions: ['system.admin'],
        entryPoint: '/apps/Settings',
        installSize: 61440,
        isBuiltIn: true,
        windowConfig: {
          defaultWidth: 700,
          defaultHeight: 550,
          minWidth: 600,
          minHeight: 450,
          resizable: true,
          draggable: true,
          closable: true,
          minimizable: true,
          maximizable: true,
        },
        metadata: {},
      },
    ];

    for (const appData of builtInApps) {
      const existing = await storage.getAll('apps');
      const found = existing.find(a => a.name === appData.name && a.isBuiltIn);

      if (!found) {
        await this.installApp(appData);
      }
    }
  }

  private getDefaultWindowConfig(): WindowConfig {
    return {
      defaultWidth: 600,
      defaultHeight: 500,
      minWidth: 300,
      minHeight: 200,
      resizable: true,
      draggable: true,
      closable: true,
      minimizable: true,
      maximizable: true,
    };
  }
}

export const appManager = AppManager.getInstance();
