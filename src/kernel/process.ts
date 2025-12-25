/**
 * PROCESS MANAGER
 * Manages app instances, services, and AI agents as processes
 */

import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import type { Process, ProcessMetadata } from './types';

export class ProcessManager {
  private static instance: ProcessManager;
  private processes: Map<string, Process> = new Map();
  private eventHandlers: Map<string, Set<(proc: Process) => void>> = new Map();

  private constructor() {}

  static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  async initialize(): Promise<void> {
    // Clean up any crashed processes from previous session
    const storedProcesses = await storage.getAll('processes');
    
    for (const proc of storedProcesses) {
      if (proc.status === 'running') {
        // Mark as crashed if it was running when system shut down
        proc.status = 'crashed';
        await storage.set('processes', proc);
      }
    }

    console.log('⚙️ Process Manager initialized');
  }

  // ============================================================================
  // PROCESS LIFECYCLE
  // ============================================================================

  async spawn(
    name: string,
    type: Process['type'],
    metadata: Partial<ProcessMetadata> = {},
    parentPid?: string
  ): Promise<Process> {
    const process: Process = {
      pid: uuidv4(),
      name,
      type,
      status: 'running',
      priority: 5,
      parentPid: parentPid || null,
      startedAt: new Date(),
      cpuUsage: 0,
      memoryUsage: 0,
      metadata: {
        permissions: [],
        environment: {},
        ...metadata,
      },
    };

    this.processes.set(process.pid, process);
    await storage.set('processes', process);

    this.emit('spawn', process);

    // Simulate initial resource usage
    this.updateResourceUsage(process.pid);

    console.log(`🚀 Process spawned: ${name} (${process.pid})`);
    
    return process;
  }

  async kill(pid: string, force: boolean = false): Promise<void> {
    const process = this.processes.get(pid);
    
    if (!process) {
      throw new Error(`Process not found: ${pid}`);
    }

    // Kill child processes first
    const children = Array.from(this.processes.values()).filter(
      p => p.parentPid === pid
    );

    for (const child of children) {
      await this.kill(child.pid, force);
    }

    process.status = 'stopped';
    await storage.set('processes', process);
    
    this.processes.delete(pid);
    this.emit('kill', process);

    console.log(`⛔ Process killed: ${process.name} (${pid})`);
  }

  async pause(pid: string): Promise<void> {
    const process = this.processes.get(pid);
    
    if (!process) {
      throw new Error(`Process not found: ${pid}`);
    }

    if (process.status !== 'running') {
      throw new Error('Process is not running');
    }

    process.status = 'paused';
    await storage.set('processes', process);
    this.emit('pause', process);
  }

  async resume(pid: string): Promise<void> {
    const process = this.processes.get(pid);
    
    if (!process) {
      throw new Error(`Process not found: ${pid}`);
    }

    if (process.status !== 'paused') {
      throw new Error('Process is not paused');
    }

    process.status = 'running';
    await storage.set('processes', process);
    this.emit('resume', process);
  }

  async crash(pid: string, error?: Error): Promise<void> {
    const process = this.processes.get(pid);
    
    if (!process) {
      throw new Error(`Process not found: ${pid}`);
    }

    process.status = 'crashed';
    process.metadata.crashInfo = {
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date(),
    };

    await storage.set('processes', process);
    this.emit('crash', process);

    console.error(`💥 Process crashed: ${process.name} (${pid})`, error);
  }

  // ============================================================================
  // PROCESS QUERIES
  // ============================================================================

  getProcess(pid: string): Process | undefined {
    return this.processes.get(pid);
  }

  getAllProcesses(): Process[] {
    return Array.from(this.processes.values());
  }

  getProcessesByType(type: Process['type']): Process[] {
    return this.getAllProcesses().filter(p => p.type === type);
  }

  getRunningProcesses(): Process[] {
    return this.getAllProcesses().filter(p => p.status === 'running');
  }

  getProcessByAppId(appId: string): Process | undefined {
    return this.getAllProcesses().find(
      p => p.metadata.appId === appId && p.status === 'running'
    );
  }

  getChildProcesses(parentPid: string): Process[] {
    return this.getAllProcesses().filter(p => p.parentPid === parentPid);
  }

  // ============================================================================
  // RESOURCE MANAGEMENT
  // ============================================================================

  private updateResourceUsage(pid: string): void {
    const process = this.processes.get(pid);
    if (!process || process.status !== 'running') return;

    // Simulate CPU and memory usage (in real app, would measure actual usage)
    process.cpuUsage = Math.random() * 20 + (process.priority * 2);
    process.memoryUsage = Math.random() * 100 + 50;

    // Periodically update
    setTimeout(() => this.updateResourceUsage(pid), 5000);
  }

  async setPriority(pid: string, priority: number): Promise<void> {
    const process = this.processes.get(pid);
    
    if (!process) {
      throw new Error(`Process not found: ${pid}`);
    }

    process.priority = Math.max(0, Math.min(10, priority));
    await storage.set('processes', process);
  }

  getSystemStats(): {
    total: number;
    running: number;
    paused: number;
    crashed: number;
    totalCpu: number;
    totalMemory: number;
  } {
    const processes = this.getAllProcesses();
    
    return {
      total: processes.length,
      running: processes.filter(p => p.status === 'running').length,
      paused: processes.filter(p => p.status === 'paused').length,
      crashed: processes.filter(p => p.status === 'crashed').length,
      totalCpu: processes.reduce((sum, p) => sum + p.cpuUsage, 0),
      totalMemory: processes.reduce((sum, p) => sum + p.memoryUsage, 0),
    };
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  on(event: string, handler: (proc: Process) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (proc: Process) => void): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, process: Process): void {
    this.eventHandlers.get(event)?.forEach(handler => handler(process));
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async cleanupCrashedProcesses(): Promise<void> {
    const crashed = this.getAllProcesses().filter(
      p => p.status === 'crashed'
    );

    for (const proc of crashed) {
      this.processes.delete(proc.pid);
      await storage.delete('processes', proc.pid);
    }

    console.log(`🧹 Cleaned up ${crashed.length} crashed processes`);
  }

  async killAll(): Promise<void> {
    const pids = Array.from(this.processes.keys());
    
    for (const pid of pids) {
      await this.kill(pid, true);
    }
  }
}

export const processManager = ProcessManager.getInstance();
