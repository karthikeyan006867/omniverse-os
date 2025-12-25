/**
 * KERNEL - Main Operating System Core
 * Orchestrates all subsystems
 */

import { storage } from './storage';
import { vfs } from './filesystem';
import { processManager } from './process';
import type { SystemStats, User } from './types';

export class Kernel {
  private static instance: Kernel;
  private bootTime: Date | null = null;
  private currentUser: User | null = null;
  private isBooted: boolean = false;

  private constructor() {}

  static getInstance(): Kernel {
    if (!Kernel.instance) {
      Kernel.instance = new Kernel();
    }
    return Kernel.instance;
  }

  // ============================================================================
  // BOOT SEQUENCE
  // ============================================================================

  async boot(userId?: string): Promise<void> {
    if (this.isBooted) {
      console.warn('⚠️ Kernel already booted');
      return;
    }

    console.log('🌌 OMNIVERSE OS - Booting...');
    this.bootTime = new Date();

    try {
      // 1. Initialize storage layer
      console.log('  [1/5] Initializing storage...');
      await storage.initialize();

      // 2. Load or create user
      console.log('  [2/5] Loading user...');
      await this.loadUser(userId || 'demo-user');

      // 3. Initialize file system
      console.log('  [3/5] Mounting file system...');
      await vfs.initialize(this.currentUser!.id);

      // 4. Initialize process manager
      console.log('  [4/5] Starting process manager...');
      await processManager.initialize();

      // 5. Boot system services
      console.log('  [5/5] Starting system services...');
      await this.startSystemServices();

      this.isBooted = true;
      console.log('✅ OMNIVERSE OS Ready!');
      console.log(`👤 Logged in as: ${this.currentUser!.displayName}`);

    } catch (error) {
      console.error('❌ Boot failed:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isBooted) {
      console.warn('⚠️ Kernel not booted');
      return;
    }

    console.log('🌙 OMNIVERSE OS - Shutting down...');

    try {
      // Stop all processes
      await processManager.killAll();

      // Clear VFS cache
      vfs.clearCache();

      // Final storage cleanup
      await storage.vacuum();

      this.isBooted = false;
      this.bootTime = null;

      console.log('✅ Shutdown complete');

    } catch (error) {
      console.error('❌ Shutdown error:', error);
      throw error;
    }
  }

  async reboot(): Promise<void> {
    await this.shutdown();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.boot(this.currentUser?.id);
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  private async loadUser(userId: string): Promise<void> {
    let user = await storage.get('users', userId);

    if (!user) {
      // Create new user
      user = {
        id: userId,
        username: userId,
        displayName: userId.charAt(0).toUpperCase() + userId.slice(1),
        avatar: '👤',
        role: 'user',
        reputation: 0,
        joinedAt: new Date(),
        lastSeenAt: new Date(),
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true,
          privacy: {
            profileVisibility: 'public',
            allowMessages: true,
            showOnlineStatus: true,
          },
        },
        metadata: {},
      };

      await storage.set('users', user);

      // Create user's home directory
      await vfs.createDirectory('/home', userId, {
        owner: userId,
        read: [userId],
        write: [userId],
        execute: [userId],
        public: false,
      });

      console.log(`  ✨ Created new user: ${userId}`);
    }

    this.currentUser = user;
    vfs.setCurrentUser(userId);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async switchUser(userId: string): Promise<void> {
    await this.loadUser(userId);
    console.log(`👤 Switched to user: ${userId}`);
  }

  // ============================================================================
  // SYSTEM SERVICES
  // ============================================================================

  private async startSystemServices(): Promise<void> {
    // Start background services as processes
    
    // 1. Storage monitor
    await processManager.spawn('storage-monitor', 'service', {
      permissions: ['system.admin'],
      environment: { interval: 60000 },
    });

    // 2. Process supervisor
    await processManager.spawn('process-supervisor', 'service', {
      permissions: ['system.admin'],
      environment: { cleanupInterval: 300000 },
    });

    console.log('  ✅ System services started');
  }

  // ============================================================================
  // SYSTEM STATS
  // ============================================================================

  async getSystemStats(): Promise<SystemStats> {
    const storageStats = await storage.getStorageStats();
    const vfsStats = await vfs.getStats();
    const procStats = processManager.getSystemStats();
    const allUsers = await storage.getAll('users');
    const allApps = await storage.getAll('apps');

    return {
      totalProcesses: procStats.total,
      activeApps: allApps.filter(app => app.isRunning).length,
      activeAgents: procStats.running,
      storageUsed: storageStats.used,
      storageAvailable: storageStats.available,
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => {
        const lastSeen = new Date(u.lastSeenAt).getTime();
        const now = Date.now();
        return (now - lastSeen) < 300000; // Active in last 5 min
      }).length,
      uptime: this.bootTime ? Date.now() - this.bootTime.getTime() : 0,
      lastBootAt: this.bootTime || new Date(),
    };
  }

  getUptime(): number {
    return this.bootTime ? Date.now() - this.bootTime.getTime() : 0;
  }

  isReady(): boolean {
    return this.isBooted;
  }

  // ============================================================================
  // EMERGENCY FUNCTIONS
  // ============================================================================

  async emergencyCleanup(): Promise<void> {
    console.warn('🚨 Emergency cleanup initiated');

    // Clean up crashed processes
    await processManager.cleanupCrashedProcesses();

    // Vacuum storage
    await storage.vacuum();

    console.log('✅ Emergency cleanup complete');
  }

  async resetSystem(): Promise<void> {
    if (!confirm('⚠️ This will DELETE ALL DATA. Are you sure?')) {
      return;
    }

    console.warn('🔥 Resetting system...');

    // Clear all stores
    await storage.clear('files');
    await storage.clear('processes');
    await storage.clear('apps');
    await storage.clear('transactions');
    await storage.clear('agents');

    // Reboot
    await this.reboot();

    console.log('✅ System reset complete');
  }

  // ============================================================================
  // DIAGNOSTICS
  // ============================================================================

  async runDiagnostics(): Promise<{
    storage: any;
    filesystem: any;
    processes: any;
    overall: 'healthy' | 'warning' | 'critical';
  }> {
    const storageStats = await storage.getStorageStats();
    const vfsStats = await vfs.getStats();
    const procStats = processManager.getSystemStats();

    const storageHealth = storageStats.used / storageStats.quota;
    const processHealth = procStats.crashed / Math.max(procStats.total, 1);

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (storageHealth > 0.9 || processHealth > 0.3) {
      overall = 'critical';
    } else if (storageHealth > 0.7 || processHealth > 0.1) {
      overall = 'warning';
    }

    return {
      storage: {
        used: storageStats.used,
        available: storageStats.available,
        quota: storageStats.quota,
        usagePercent: storageHealth * 100,
      },
      filesystem: {
        totalFiles: vfsStats.totalFiles,
        totalDirectories: vfsStats.totalDirectories,
        totalSize: vfsStats.totalSize,
      },
      processes: {
        total: procStats.total,
        running: procStats.running,
        crashed: procStats.crashed,
        cpuUsage: procStats.totalCpu,
        memoryUsage: procStats.totalMemory,
      },
      overall,
    };
  }
}

// Export singleton instance
export const kernel = Kernel.getInstance();

// Export subsystems for direct access
export { storage, vfs, processManager };
export * from './types';
