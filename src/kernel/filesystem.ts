/**
 * VIRTUAL FILE SYSTEM (VFS)
 * Browser-based file system with permissions, quota, and caching
 */

import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import type { FileNode, DirectoryNode, FilePermissions, FileSystemError } from './types';

export class VirtualFileSystem {
  private static instance: VirtualFileSystem;
  private currentUserId: string = 'system';
  private cache: Map<string, FileNode> = new Map();

  private constructor() {}

  static getInstance(): VirtualFileSystem {
    if (!VirtualFileSystem.instance) {
      VirtualFileSystem.instance = new VirtualFileSystem();
    }
    return VirtualFileSystem.instance;
  }

  async initialize(userId: string = 'system'): Promise<void> {
    this.currentUserId = userId;

    // Check if root exists
    const root = await this.getByPath('/');
    
    if (!root) {
      // Create root directory
      await this.createDirectory('/', 'root', {
        owner: 'system',
        read: ['*'],
        write: ['system'],
        execute: ['*'],
        public: true,
      });

      // Create default directories
      await this.createDirectory('/', 'home', this.getDefaultPermissions());
      await this.createDirectory('/', 'apps', this.getDefaultPermissions());
      await this.createDirectory('/', 'system', {
        owner: 'system',
        read: ['*'],
        write: ['system'],
        execute: ['system'],
        public: true,
      });
      await this.createDirectory('/', 'tmp', this.getDefaultPermissions());
      await this.createDirectory('/', 'shared', this.getDefaultPermissions());

      console.log('📁 VFS initialized with default structure');
    }
  }

  // ============================================================================
  // DIRECTORY OPERATIONS
  // ============================================================================

  async createDirectory(
    parentPath: string,
    name: string,
    permissions?: FilePermissions
  ): Promise<DirectoryNode> {
    const parent = await this.getByPath(parentPath);
    
    if (!parent || parent.type !== 'directory') {
      throw new Error(`Parent directory not found: ${parentPath}`);
    }

    if (!this.canWrite(parent)) {
      throw new Error('Permission denied');
    }

    const path = this.joinPath(parentPath, name);
    const existing = await this.getByPath(path);
    
    if (existing) {
      throw new Error(`Directory already exists: ${path}`);
    }

    const directory: DirectoryNode = {
      id: uuidv4(),
      name,
      type: 'directory',
      path,
      parentId: parent.id,
      size: 0,
      children: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
      permissions: permissions || this.getDefaultPermissions(),
      metadata: {},
    };

    await storage.set('files', directory);
    
    // Update parent's children
    (parent as DirectoryNode).children.push(directory.id);
    await storage.set('files', parent);

    this.cache.set(directory.id, directory);
    this.cache.set(path, directory);

    return directory;
  }

  async listDirectory(path: string): Promise<FileNode[]> {
    const dir = await this.getByPath(path);
    
    if (!dir || dir.type !== 'directory') {
      throw new Error(`Not a directory: ${path}`);
    }

    if (!this.canRead(dir)) {
      throw new Error('Permission denied');
    }

    const children: FileNode[] = [];
    const dirNode = dir as DirectoryNode;

    for (const childId of dirNode.children) {
      const child = await storage.get('files', childId);
      if (child && this.canRead(child)) {
        children.push(child);
      }
    }

    return children.sort((a, b) => {
      // Directories first, then alphabetically
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  async createFile(
    parentPath: string,
    name: string,
    content: string | ArrayBuffer = '',
    mimeType: string = 'text/plain',
    permissions?: FilePermissions
  ): Promise<FileNode> {
    const parent = await this.getByPath(parentPath);
    
    if (!parent || parent.type !== 'directory') {
      throw new Error(`Parent directory not found: ${parentPath}`);
    }

    if (!this.canWrite(parent)) {
      throw new Error('Permission denied');
    }

    const path = this.joinPath(parentPath, name);
    const existing = await this.getByPath(path);
    
    if (existing) {
      throw new Error(`File already exists: ${path}`);
    }

    const size = typeof content === 'string' 
      ? new Blob([content]).size 
      : content.byteLength;

    const file: FileNode = {
      id: uuidv4(),
      name,
      type: 'file',
      path,
      parentId: parent.id,
      content,
      size,
      mimeType,
      createdAt: new Date(),
      modifiedAt: new Date(),
      permissions: permissions || this.getDefaultPermissions(),
      metadata: {},
    };

    await storage.set('files', file);
    
    // Update parent's children
    (parent as DirectoryNode).children.push(file.id);
    await storage.set('files', parent);

    this.cache.set(file.id, file);
    this.cache.set(path, file);

    return file;
  }

  async readFile(path: string): Promise<string | ArrayBuffer> {
    const file = await this.getByPath(path);
    
    if (!file || file.type !== 'file') {
      throw new Error(`File not found: ${path}`);
    }

    if (!this.canRead(file)) {
      throw new Error('Permission denied');
    }

    return file.content || '';
  }

  async writeFile(
    path: string,
    content: string | ArrayBuffer,
    append: boolean = false
  ): Promise<void> {
    const file = await this.getByPath(path);
    
    if (!file || file.type !== 'file') {
      throw new Error(`File not found: ${path}`);
    }

    if (!this.canWrite(file)) {
      throw new Error('Permission denied');
    }

    if (append && typeof content === 'string' && typeof file.content === 'string') {
      file.content = file.content + content;
    } else {
      file.content = content;
    }

    file.size = typeof file.content === 'string'
      ? new Blob([file.content]).size
      : file.content.byteLength;
    
    file.modifiedAt = new Date();

    await storage.set('files', file);
    this.cache.set(file.id, file);
    this.cache.set(path, file);
  }

  async deleteFile(path: string): Promise<void> {
    const node = await this.getByPath(path);
    
    if (!node) {
      throw new Error(`File not found: ${path}`);
    }

    if (!this.canWrite(node)) {
      throw new Error('Permission denied');
    }

    // If directory, recursively delete children
    if (node.type === 'directory') {
      const dirNode = node as DirectoryNode;
      for (const childId of dirNode.children) {
        const child = await storage.get('files', childId);
        if (child) {
          await this.deleteFile(child.path);
        }
      }
    }

    // Remove from parent's children
    if (node.parentId) {
      const parent = await storage.get('files', node.parentId);
      if (parent && parent.type === 'directory') {
        const parentDir = parent as DirectoryNode;
        parentDir.children = parentDir.children.filter(id => id !== node.id);
        await storage.set('files', parent);
      }
    }

    await storage.delete('files', node.id);
    this.cache.delete(node.id);
    this.cache.delete(path);
  }

  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    const source = await this.getByPath(sourcePath);
    
    if (!source) {
      throw new Error(`Source not found: ${sourcePath}`);
    }

    if (!this.canWrite(source)) {
      throw new Error('Permission denied');
    }

    const destParts = this.splitPath(destPath);
    const destParentPath = destParts.slice(0, -1).join('/') || '/';
    const destName = destParts[destParts.length - 1];

    const destParent = await this.getByPath(destParentPath);
    
    if (!destParent || destParent.type !== 'directory') {
      throw new Error(`Destination parent not found: ${destParentPath}`);
    }

    if (!this.canWrite(destParent)) {
      throw new Error('Permission denied');
    }

    // Remove from old parent
    if (source.parentId) {
      const oldParent = await storage.get('files', source.parentId);
      if (oldParent && oldParent.type === 'directory') {
        const oldParentDir = oldParent as DirectoryNode;
        oldParentDir.children = oldParentDir.children.filter(id => id !== source.id);
        await storage.set('files', oldParent);
      }
    }

    // Update source
    source.name = destName;
    source.path = destPath;
    source.parentId = destParent.id;
    source.modifiedAt = new Date();

    await storage.set('files', source);

    // Add to new parent
    (destParent as DirectoryNode).children.push(source.id);
    await storage.set('files', destParent);

    this.cache.delete(sourcePath);
    this.cache.set(source.id, source);
    this.cache.set(destPath, source);
  }

  async copyFile(sourcePath: string, destPath: string): Promise<FileNode> {
    const source = await this.getByPath(sourcePath);
    
    if (!source) {
      throw new Error(`Source not found: ${sourcePath}`);
    }

    if (!this.canRead(source)) {
      throw new Error('Permission denied');
    }

    const destParts = this.splitPath(destPath);
    const destParentPath = destParts.slice(0, -1).join('/') || '/';
    const destName = destParts[destParts.length - 1];

    if (source.type === 'file') {
      return await this.createFile(
        destParentPath,
        destName,
        source.content || '',
        source.mimeType,
        { ...source.permissions }
      );
    } else {
      const newDir = await this.createDirectory(
        destParentPath,
        destName,
        { ...source.permissions }
      );

      // Recursively copy children
      const children = await this.listDirectory(sourcePath);
      for (const child of children) {
        await this.copyFile(child.path, this.joinPath(destPath, child.name));
      }

      return newDir;
    }
  }

  // ============================================================================
  // PERMISSION HELPERS
  // ============================================================================

  private canRead(node: FileNode): boolean {
    if (node.permissions.public) return true;
    if (node.permissions.owner === this.currentUserId) return true;
    if (node.permissions.read.includes(this.currentUserId)) return true;
    if (node.permissions.read.includes('*')) return true;
    return false;
  }

  private canWrite(node: FileNode): boolean {
    if (node.permissions.owner === this.currentUserId) return true;
    if (node.permissions.write.includes(this.currentUserId)) return true;
    if (node.permissions.write.includes('*')) return true;
    return false;
  }

  private canExecute(node: FileNode): boolean {
    if (node.permissions.owner === this.currentUserId) return true;
    if (node.permissions.execute.includes(this.currentUserId)) return true;
    if (node.permissions.execute.includes('*')) return true;
    return false;
  }

  private getDefaultPermissions(): FilePermissions {
    return {
      owner: this.currentUserId,
      read: [this.currentUserId],
      write: [this.currentUserId],
      execute: [this.currentUserId],
      public: false,
    };
  }

  // ============================================================================
  // PATH UTILITIES
  // ============================================================================

  private async getByPath(path: string): Promise<FileNode | null> {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path) || null;
    }

    const node = await storage.getFileByPath(path);
    
    if (node) {
      this.cache.set(path, node);
      this.cache.set(node.id, node);
    }

    return node || null;
  }

  private joinPath(...parts: string[]): string {
    return parts
      .join('/')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '') || '/';
  }

  private splitPath(path: string): string[] {
    return path.split('/').filter(p => p.length > 0);
  }

  async getStats(): Promise<{
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
  }> {
    const allFiles = await storage.getAll('files');
    
    return {
      totalFiles: allFiles.filter(f => f.type === 'file').length,
      totalDirectories: allFiles.filter(f => f.type === 'directory').length,
      totalSize: allFiles.reduce((sum, f) => sum + f.size, 0),
    };
  }

  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const vfs = VirtualFileSystem.getInstance();
