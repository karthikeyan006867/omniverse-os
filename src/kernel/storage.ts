/**
 * STORAGE MANAGER - IndexedDB Wrapper
 * Provides persistent storage for the entire OS
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { FileNode, Process, App, Transaction, User, AIAgent } from './types';

interface OmniverseDB extends DBSchema {
  files: {
    key: string;
    value: FileNode;
    indexes: { 'by-path': string; 'by-parent': string };
  };
  processes: {
    key: string;
    value: Process;
  };
  apps: {
    key: string;
    value: App;
    indexes: { 'by-category': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-wallet': string; 'by-timestamp': Date };
  };
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string };
  };
  agents: {
    key: string;
    value: AIAgent;
    indexes: { 'by-owner': string };
  };
  kvstore: {
    key: string;
    value: any;
  };
}

class StorageManager {
  private db: IDBPDatabase<OmniverseDB> | null = null;
  private readonly DB_NAME = 'omniverse-os';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<OmniverseDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Files store
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('by-path', 'path');
          fileStore.createIndex('by-parent', 'parentId');
        }

        // Processes store
        if (!db.objectStoreNames.contains('processes')) {
          db.createObjectStore('processes', { keyPath: 'pid' });
        }

        // Apps store
        if (!db.objectStoreNames.contains('apps')) {
          const appStore = db.createObjectStore('apps', { keyPath: 'id' });
          appStore.createIndex('by-category', 'category');
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-wallet', 'from');
          txStore.createIndex('by-timestamp', 'timestamp');
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('by-username', 'username');
        }

        // AI Agents store
        if (!db.objectStoreNames.contains('agents')) {
          const agentStore = db.createObjectStore('agents', { keyPath: 'id' });
          agentStore.createIndex('by-owner', 'ownerId');
        }

        // Key-value store for misc data
        if (!db.objectStoreNames.contains('kvstore')) {
          db.createObjectStore('kvstore');
        }
      },
    });

    console.log('✅ Storage Manager initialized');
  }

  // ============================================================================
  // GENERIC CRUD OPERATIONS
  // ============================================================================

  async set<T extends keyof OmniverseDB>(
    store: T,
    value: OmniverseDB[T]['value']
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put(store as any, value);
  }

  async get<T extends keyof OmniverseDB>(
    store: T,
    key: string
  ): Promise<OmniverseDB[T]['value'] | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get(store as any, key);
  }

  async getAll<T extends keyof OmniverseDB>(
    store: T
  ): Promise<OmniverseDB[T]['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll(store as any);
  }

  async delete<T extends keyof OmniverseDB>(
    store: T,
    key: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete(store as any, key);
  }

  async clear<T extends keyof OmniverseDB>(store: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.clear(store);
  }

  // ============================================================================
  // FILE SYSTEM OPERATIONS
  // ============================================================================

  async getFileByPath(path: string): Promise<FileNode | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFromIndex('files', 'by-path', path);
  }

  async getFilesByParent(parentId: string): Promise<FileNode[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex('files', 'by-parent', parentId);
  }

  // ============================================================================
  // APP OPERATIONS
  // ============================================================================

  async getAppsByCategory(category: string): Promise<App[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex('apps', 'by-category', category);
  }

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

  async getTransactionsByWallet(walletId: string): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex('transactions', 'by-wallet', walletId);
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFromIndex('users', 'by-username', username);
  }

  // ============================================================================
  // AI AGENT OPERATIONS
  // ============================================================================

  async getAgentsByOwner(ownerId: string): Promise<AIAgent[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex('agents', 'by-owner', ownerId);
  }

  // ============================================================================
  // KEY-VALUE STORE
  // ============================================================================

  async setKV(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('kvstore', value, key);
  }

  async getKV<T = any>(key: string): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('kvstore', key);
  }

  async deleteKV(key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('kvstore', key);
  }

  // ============================================================================
  // STORAGE STATS
  // ============================================================================

  async getStorageStats(): Promise<{
    used: number;
    available: number;
    quota: number;
  }> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        quota: estimate.quota || 0,
      };
    }

    // Fallback if Storage API not available
    return {
      used: 0,
      available: 1024 * 1024 * 1024, // 1GB fallback
      quota: 1024 * 1024 * 1024,
    };
  }

  // ============================================================================
  // CLEANUP & MAINTENANCE
  // ============================================================================

  async vacuum(): Promise<void> {
    // Remove orphaned processes
    if (!this.db) return;
    
    const processes = await this.getAll('processes');
    const now = Date.now();
    
    for (const proc of processes) {
      // Remove crashed processes older than 1 hour
      if (proc.status === 'crashed') {
        const age = now - proc.startedAt.getTime();
        if (age > 3600000) {
          await this.delete('processes', proc.pid);
        }
      }
    }

    console.log('🧹 Storage vacuum completed');
  }

  async exportData(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return {
      files: await this.getAll('files'),
      apps: await this.getAll('apps'),
      users: await this.getAll('users'),
      agents: await this.getAll('agents'),
      transactions: await this.getAll('transactions'),
    };
  }

  async importData(data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(
      ['files', 'apps', 'users', 'agents', 'transactions'],
      'readwrite'
    );

    if (data.files) {
      for (const file of data.files) {
        await tx.objectStore('files').put(file);
      }
    }

    if (data.apps) {
      for (const app of data.apps) {
        await tx.objectStore('apps').put(app);
      }
    }

    // Similar for other stores...

    await tx.done;
    console.log('📦 Data import completed');
  }
}

// Singleton instance
export const storage = new StorageManager();
