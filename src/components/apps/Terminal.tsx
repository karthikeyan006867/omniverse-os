'use client';

import React, { useState, useRef, useEffect } from 'react';
import { vfs } from '@/kernel/filesystem';
import { processManager } from '@/kernel/process';
import { kernel } from '@/kernel';

export default function Terminal() {
  const [history, setHistory] = useState<string[]>([
    '🌌 OMNIVERSE OS Terminal v1.0',
    'Type "help" for available commands',
    '',
  ]);
  const [input, setInput] = useState('');
  const [currentDir, setCurrentDir] = useState('/home/demo-user');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    setHistory(prev => [...prev, `$ ${trimmed}`]);
    setCommandHistory(prev => [...prev, trimmed]);

    try {
      let output = '';

      switch (command) {
        case 'help':
          output = `Available commands:
  help          - Show this help
  clear         - Clear terminal
  ls            - List directory contents
  cd <path>     - Change directory
  pwd           - Print working directory
  cat <file>    - Display file contents
  echo <text>   - Print text
  mkdir <name>  - Create directory
  touch <name>  - Create file
  rm <file>     - Remove file
  ps            - List processes
  whoami        - Show current user
  date          - Show current date/time
  sysinfo       - Show system information
  calc <expr>   - Calculate expression (e.g., calc 2+2)`;
          break;

        case 'clear':
          setHistory([]);
          return;

        case 'ls':
          const files = await vfs.listDirectory(currentDir);
          output = files.length > 0
            ? files.map(f => {
                const icon = f.type === 'directory' ? '📁' : '📄';
                return `${icon} ${f.name}`;
              }).join('\n')
            : '(empty)';
          break;

        case 'cd':
          if (args.length === 0) {
            setCurrentDir('/home/demo-user');
            output = 'Changed to home directory';
          } else {
            const newPath = args[0].startsWith('/')
              ? args[0]
              : `${currentDir}/${args[0]}`.replace(/\/+/g, '/');
            try {
              const dir = await vfs.listDirectory(newPath);
              setCurrentDir(newPath);
              output = `Changed to ${newPath}`;
            } catch {
              output = `cd: ${args[0]}: No such directory`;
            }
          }
          break;

        case 'pwd':
          output = currentDir;
          break;

        case 'cat':
          if (args.length === 0) {
            output = 'cat: missing file operand';
          } else {
            const filePath = args[0].startsWith('/')
              ? args[0]
              : `${currentDir}/${args[0]}`;
            const content = await vfs.readFile(filePath);
            output = typeof content === 'string' ? content : new TextDecoder().decode(content);
          }
          break;

        case 'echo':
          output = args.join(' ');
          break;

        case 'mkdir':
          if (args.length === 0) {
            output = 'mkdir: missing operand';
          } else {
            await vfs.createDirectory(currentDir, args[0]);
            output = `Created directory: ${args[0]}`;
          }
          break;

        case 'touch':
          if (args.length === 0) {
            output = 'touch: missing operand';
          } else {
            await vfs.createFile(currentDir, args[0], '');
            output = `Created file: ${args[0]}`;
          }
          break;

        case 'rm':
          if (args.length === 0) {
            output = 'rm: missing operand';
          } else {
            const filePath = args[0].startsWith('/')
              ? args[0]
              : `${currentDir}/${args[0]}`;
            await vfs.deleteFile(filePath);
            output = `Removed: ${args[0]}`;
          }
          break;

        case 'ps':
          const processes = await processManager.getAllProcesses();
          output = `PID    STATUS    NAME\n${processes
            .map(p => `${p.pid.slice(0, 6)}  ${p.status.padEnd(8)}  ${p.name}`)
            .join('\n')}`;
          break;

        case 'whoami':
          const user = kernel.getCurrentUser();
          output = user ? user.username : 'unknown';
          break;

        case 'date':
          output = new Date().toString();
          break;

        case 'sysinfo':
          const stats = await kernel.getSystemStats();
          output = `OMNIVERSE OS System Information
────────────────────────────
Processes:    ${stats.totalProcesses}
Active Apps:  ${stats.activeApps}
Storage:      ${(stats.storageUsed / 1024 / 1024).toFixed(2)} MB
Uptime:       ${Math.floor(stats.uptime / 1000 / 60)} minutes`;
          break;

        case 'calc':
          if (args.length === 0) {
            output = 'calc: missing expression';
          } else {
            try {
              // Simple eval for basic math - in production use a safe math parser
              const expr = args.join('');
              const result = eval(expr.replace(/[^0-9+\-*/.()]/g, ''));
              output = `${expr} = ${result}`;
            } catch {
              output = 'calc: invalid expression';
            }
          }
          break;

        default:
          output = `Command not found: ${command}. Type "help" for available commands.`;
      }

      if (output) {
        setHistory(prev => [...prev, output, '']);
      }
    } catch (error: any) {
      setHistory(prev => [...prev, `Error: ${error.message}`, '']);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setInput(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div
      className="h-full bg-black text-green-400 font-mono text-sm p-4 overflow-auto"
      onClick={() => inputRef.current?.focus()}
    >
      {history.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap">
          {line}
        </div>
      ))}
      
      <div className="flex items-center gap-2">
        <span className="text-blue-400">{currentDir}</span>
        <span>$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-green-400"
          autoFocus
          spellCheck={false}
        />
      </div>
      
      <div ref={endRef} />
    </div>
  );
}
