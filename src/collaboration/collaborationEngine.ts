/**
 * COLLABORATION ENGINE
 * Real-time collaboration using WebSocket
 */

import { io, Socket } from 'socket.io-client';
import type { CollabSession, CollabUpdate } from '@kernel/types';

export class CollaborationEngine {
  private static instance: CollaborationEngine;
  private socket: Socket | null = null;
  private sessions: Map<string, CollabSession> = new Map();
  private updateHandlers: Map<string, Set<(update: CollabUpdate) => void>> = new Map();

  private constructor() {}

  static getInstance(): CollaborationEngine {
    if (!CollaborationEngine.instance) {
      CollaborationEngine.instance = new CollaborationEngine();
    }
    return CollaborationEngine.instance;
  }

  async initialize(serverUrl: string = 'http://localhost:3001'): Promise<void> {
    if (this.socket?.connected) {
      console.warn('⚠️ Already connected to collaboration server');
      return;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('🔗 Connected to collaboration server');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from collaboration server');
    });

    this.socket.on('update', (update: CollabUpdate) => {
      this.handleUpdate(update);
    });

    this.socket.on('session-joined', (session: CollabSession) => {
      this.sessions.set(session.id, session);
      console.log(`👥 Joined collaboration session: ${session.id}`);
    });

    this.socket.on('session-left', (sessionId: string) => {
      this.sessions.delete(sessionId);
      console.log(`👋 Left collaboration session: ${sessionId}`);
    });

    this.socket.on('participant-joined', (data: { sessionId: string; userId: string }) => {
      const session = this.sessions.get(data.sessionId);
      if (session && !session.participants.includes(data.userId)) {
        session.participants.push(data.userId);
      }
    });

    this.socket.on('participant-left', (data: { sessionId: string; userId: string }) => {
      const session = this.sessions.get(data.sessionId);
      if (session) {
        session.participants = session.participants.filter(id => id !== data.userId);
      }
    });

    console.log('🤝 Collaboration Engine initialized');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async createSession(resourceId: string, userId: string): Promise<CollabSession> {
    if (!this.socket) {
      throw new Error('Not connected to collaboration server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('create-session', { resourceId, userId }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          const session: CollabSession = response.session;
          this.sessions.set(session.id, session);
          resolve(session);
        }
      });
    });
  }

  async joinSession(sessionId: string, userId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to collaboration server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join-session', { sessionId, userId }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to collaboration server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('leave-session', { sessionId, userId }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          this.sessions.delete(sessionId);
          resolve();
        }
      });
    });
  }

  // ============================================================================
  // UPDATE BROADCASTING
  // ============================================================================

  sendUpdate(update: Omit<CollabUpdate, 'id' | 'timestamp'>): void {
    if (!this.socket) {
      throw new Error('Not connected to collaboration server');
    }

    const fullUpdate: CollabUpdate = {
      ...update,
      id: this.generateUpdateId(),
      timestamp: new Date(),
    };

    this.socket.emit('update', fullUpdate);
  }

  onUpdate(sessionId: string, handler: (update: CollabUpdate) => void): void {
    if (!this.updateHandlers.has(sessionId)) {
      this.updateHandlers.set(sessionId, new Set());
    }
    this.updateHandlers.get(sessionId)!.add(handler);
  }

  offUpdate(sessionId: string, handler: (update: CollabUpdate) => void): void {
    this.updateHandlers.get(sessionId)?.delete(handler);
  }

  private handleUpdate(update: CollabUpdate): void {
    const handlers = this.updateHandlers.get(update.sessionId);
    if (handlers) {
      handlers.forEach(handler => handler(update));
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private generateUpdateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getSession(sessionId: string): CollabSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): CollabSession[] {
    return Array.from(this.sessions.values());
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const collaborationEngine = CollaborationEngine.getInstance();
