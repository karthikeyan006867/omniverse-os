/**
 * OMNIVERSE OS KERNEL - CORE TYPES
 * Central type definitions for the entire operating system
 */

// ============================================================================
// FILE SYSTEM TYPES
// ============================================================================

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  parentId: string | null;
  content?: string | ArrayBuffer; // File content
  size: number; // Bytes
  mimeType?: string;
  createdAt: Date;
  modifiedAt: Date;
  permissions: FilePermissions;
  metadata: Record<string, any>;
}

export interface FilePermissions {
  owner: string; // User ID
  read: string[]; // User IDs with read access
  write: string[]; // User IDs with write access
  execute: string[]; // User IDs with execute access
  public: boolean;
}

export interface DirectoryNode extends Omit<FileNode, 'content' | 'mimeType'> {
  type: 'directory';
  children: string[]; // Child file/directory IDs
}

// ============================================================================
// PROCESS TYPES
// ============================================================================

export interface Process {
  pid: string; // Process ID
  name: string;
  type: 'app' | 'service' | 'agent';
  status: 'running' | 'paused' | 'stopped' | 'crashed';
  priority: number; // 0-10, higher = more priority
  parentPid: string | null;
  startedAt: Date;
  cpuUsage: number; // Simulated percentage
  memoryUsage: number; // Simulated MB
  metadata: ProcessMetadata;
}

export interface ProcessMetadata {
  appId?: string;
  windowId?: string;
  permissions: string[];
  environment: Record<string, any>;
  [key: string]: any;
}

// ============================================================================
// APP TYPES
// ============================================================================

export interface App {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  author: string;
  category: AppCategory;
  permissions: AppPermission[];
  entryPoint: string; // Component path or URL
  installSize: number; // Bytes
  installedAt?: Date;
  isBuiltIn: boolean;
  isRunning: boolean;
  windowConfig?: WindowConfig;
  metadata: Record<string, any>;
}

export type AppCategory = 
  | 'productivity'
  | 'communication'
  | 'development'
  | 'entertainment'
  | 'finance'
  | 'ai'
  | 'system'
  | 'custom';

export type AppPermission = 
  | 'filesystem.read'
  | 'filesystem.write'
  | 'network.access'
  | 'ai.execute'
  | 'economy.transact'
  | 'system.admin'
  | 'collaboration.sync'
  | 'camera.access'
  | 'microphone.access'
  | 'storage.manage';

export interface WindowConfig {
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable: boolean;
  draggable: boolean;
  closable: boolean;
  minimizable: boolean;
  maximizable: boolean;
}

export interface AppWindow {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  state: Record<string, any>;
}

// ============================================================================
// AI TYPES
// ============================================================================

export interface AIAgent {
  id: string;
  name: string;
  type: 'assistant' | 'worker' | 'moderator' | 'trader' | 'custom';
  ownerId: string; // User who created this agent
  personality: AIPersonality;
  memory: AIMemory[];
  goals: AIGoal[];
  skills: string[];
  status: 'idle' | 'thinking' | 'acting' | 'learning';
  createdAt: Date;
  lastActiveAt: Date;
  metadata: Record<string, any>;
}

export interface AIPersonality {
  creativity: number; // 0-1
  formality: number; // 0-1
  helpfulness: number; // 0-1
  assertiveness: number; // 0-1
  traits: string[];
}

export interface AIMemory {
  id: string;
  type: 'conversation' | 'fact' | 'task' | 'emotion';
  content: string;
  importance: number; // 0-1
  timestamp: Date;
  relatedTo: string[]; // IDs of related memories
}

export interface AIGoal {
  id: string;
  description: string;
  priority: number;
  status: 'active' | 'completed' | 'abandoned';
  progress: number; // 0-1
  deadline?: Date;
}

// ============================================================================
// ECONOMY TYPES
// ============================================================================

export interface Wallet {
  id: string;
  ownerId: string;
  balances: Map<string, number>; // currencyId -> amount
  transactions: string[]; // Transaction IDs
  createdAt: Date;
}

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  issuer: string; // User or system ID
  totalSupply: number;
  circulatingSupply: number;
  decimals: number;
  isSystemCurrency: boolean;
  exchangeRates: Map<string, number>; // Other currency ID -> rate
  metadata: Record<string, any>;
}

export interface Transaction {
  id: string;
  from: string; // Wallet ID
  to: string; // Wallet ID
  amount: number;
  currencyId: string;
  type: 'transfer' | 'mint' | 'burn' | 'reward' | 'tax';
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  metadata: Record<string, any>;
}

// ============================================================================
// COLLABORATION TYPES
// ============================================================================

export interface CollabSession {
  id: string;
  resourceId: string; // File, document, or app instance ID
  participants: string[]; // User IDs
  createdAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

export interface CollabUpdate {
  id: string;
  sessionId: string;
  userId: string;
  type: 'insert' | 'delete' | 'update' | 'cursor';
  path: string; // Where in the resource
  data: any;
  timestamp: Date;
  version: number;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  email?: string;
  role: 'user' | 'developer' | 'admin';
  reputation: number;
  joinedAt: Date;
  lastSeenAt: Date;
  preferences: UserPreferences;
  metadata: Record<string, any>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    allowMessages: boolean;
    showOnlineStatus: boolean;
  };
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

export interface SystemStats {
  totalProcesses: number;
  activeApps: number;
  activeAgents: number;
  storageUsed: number; // Bytes
  storageAvailable: number; // Bytes
  totalUsers: number;
  activeUsers: number;
  uptime: number; // Milliseconds
  lastBootAt: Date;
}

export interface KernelEvent {
  type: string;
  timestamp: Date;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StorageQuota {
  userId: string;
  used: number; // Bytes
  available: number; // Bytes
  limit: number; // Bytes
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class KernelError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'KernelError';
  }
}

export class FileSystemError extends KernelError {
  constructor(message: string, details?: any) {
    super('FS_ERROR', message, details);
    this.name = 'FileSystemError';
  }
}

export class ProcessError extends KernelError {
  constructor(message: string, details?: any) {
    super('PROCESS_ERROR', message, details);
    this.name = 'ProcessError';
  }
}

export class PermissionError extends KernelError {
  constructor(message: string, details?: any) {
    super('PERMISSION_ERROR', message, details);
    this.name = 'PermissionError';
  }
}
