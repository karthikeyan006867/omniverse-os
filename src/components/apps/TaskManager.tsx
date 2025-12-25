'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, X, Pause, Play } from 'lucide-react';
import { processManager } from '@/kernel/process';
import { kernel } from '@/kernel';
import type { Process } from '@/kernel/types';

export default function TaskManager() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [stats, setStats] = useState<any>({
    processCount: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    fileCount: 0,
    uptime: 0,
  });
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const procs = await processManager.getAllProcesses();
    const systemStats = await kernel.getSystemStats();
    setProcesses(procs);
    setStats(systemStats);
  };

  const killProcess = async (id: string) => {
    if (!confirm('End this process?')) return;
    try {
      await processManager.kill(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const pauseProcess = async (id: string) => {
    try {
      await processManager.pause(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const resumeProcess = async (id: string) => {
    try {
      await processManager.resume(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-bold">Task Manager</h2>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800/50">
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Cpu size={20} />
            <span className="font-semibold">CPU</span>
          </div>
          <div className="text-2xl font-bold">{stats.cpuUsage}%</div>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <HardDrive size={20} />
            <span className="font-semibold">Memory</span>
          </div>
          <div className="text-2xl font-bold">{formatMemory(stats.memoryUsage)}</div>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Activity size={20} />
            <span className="font-semibold">Processes</span>
          </div>
          <div className="text-2xl font-bold">{stats.processCount}</div>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Activity size={20} />
            <span className="font-semibold">Uptime</span>
          </div>
          <div className="text-lg font-bold">{formatUptime(stats.uptime)}</div>
        </div>
      </div>

      {/* Process List */}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">PID</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">CPU</th>
              <th className="text-left p-2">Memory</th>
              <th className="text-left p-2">Priority</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc) => (
              <tr
                key={proc.pid}
                onClick={() => setSelectedProcess(proc.pid)}
                className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${
                  selectedProcess === proc.pid ? 'bg-gray-800' : ''
                }`}
              >
                <td className="p-2">{proc.name}</td>
                <td className="p-2 font-mono text-sm text-gray-400">
                  {proc.pid.slice(0, 8)}
                </td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      proc.status === 'running'
                        ? 'bg-green-600'
                        : proc.status === 'paused'
                        ? 'bg-yellow-600'
                        : proc.status === 'stopped'
                        ? 'bg-gray-600'
                        : 'bg-red-600'
                    }`}
                  >
                    {proc.status}
                  </span>
                </td>
                <td className="p-2">{proc.cpuUsage}%</td>
                <td className="p-2">{formatMemory(proc.memoryUsage)}</td>
                <td className="p-2">{proc.priority}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    {proc.status === 'running' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pauseProcess(proc.pid);
                        }}
                        className="p-1 bg-yellow-600 rounded hover:bg-yellow-500"
                        title="Pause"
                      >
                        <Pause size={14} />
                      </button>
                    )}
                    {proc.status === 'paused' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resumeProcess(proc.pid);
                        }}
                        className="p-1 bg-green-600 rounded hover:bg-green-500"
                        title="Resume"
                      >
                        <Play size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        killProcess(proc.pid);
                      }}
                      className="p-1 bg-red-600 rounded hover:bg-red-500"
                      title="End Task"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {processes.length === 0 && (
          <div className="text-center text-gray-500 mt-8">No processes running</div>
        )}
      </div>

      {/* Status Bar */}
      <div className="p-2 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
        {processes.length} processes • {formatMemory(stats.memoryUsage)} memory used
      </div>
    </div>
  );
}
