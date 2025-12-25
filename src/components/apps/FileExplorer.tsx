'use client';

import React, { useState, useEffect } from 'react';
import { Folder, File, Download, Trash2, Plus, Search, HardDrive, Home } from 'lucide-react';
import { vfs } from '@/kernel/filesystem';
import type { FileNode } from '@/kernel/types';

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('/home/demo-user');
  const [currentDrive, setCurrentDrive] = useState<'C' | 'D'>('C');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = async (path: string) => {
    try {
      const items = await vfs.listDirectory(path);
      setFiles(items);
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
  };

  const goUp = () => {
    const parts = currentPath.split('/').filter(p => p);
    parts.pop();
    const newPath = '/' + parts.join('/');
    navigateTo(newPath || '/');
  };

  const goToQuickAccess = (location: string) => {
    switch (location) {
      case 'home':
        navigateTo('/home/demo-user');
        break;
      case 'desktop':
        navigateTo('/home/demo-user/Desktop');
        break;
      case 'documents':
        navigateTo('/home/demo-user/Documents');
        break;
      case 'downloads':
        navigateTo('/home/demo-user/Downloads');
        break;
      case 'root':
        navigateTo('/');
        break;
    }
  };

  const createNew = async () => {
    if (!newName.trim()) return;
    
    try {
      if (showNewDialog === 'folder') {
        await vfs.createDirectory(currentPath, newName);
      } else if (showNewDialog === 'file') {
        await vfs.createFile(currentPath, newName, '');
      }
      setShowNewDialog(null);
      setNewName('');
      loadDirectory(currentPath);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const deleteFile = async (file: FileNode) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    
    try {
      await vfs.deleteFile(file.path);
      loadDirectory(currentPath);
      setSelectedFile(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const downloadFile = async (file: FileNode) => {
    if (file.type === 'directory') return;
    
    try {
      const content = await vfs.readFile(file.path);
      const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-48 bg-gray-800 border-r border-gray-700 p-3">
        <div className="space-y-1 mb-4">
          <button
            onClick={() => {
              setCurrentDrive('C');
              navigateTo('/');
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentDrive === 'C' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <HardDrive size={16} />
            <span className="text-sm">LocalDisk (C:)</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentDrive('D');
              alert('LocalDisk D: requires external database API. Configure in Settings.');
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentDrive === 'D' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <HardDrive size={16} />
            <span className="text-sm">LocalDisk (D:)</span>
          </button>
        </div>

        <div className="border-t border-gray-700 pt-3 space-y-1">
          <button
            onClick={() => goToQuickAccess('home')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home size={16} />
            <span className="text-sm">Home</span>
          </button>
          <button
            onClick={() => goToQuickAccess('desktop')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Folder size={16} />
            <span className="text-sm">Desktop</span>
          </button>
          <button
            onClick={() => goToQuickAccess('documents')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Folder size={16} />
            <span className="text-sm">Documents</span>
          </button>
          <button
            onClick={() => goToQuickAccess('downloads')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Folder size={16} />
            <span className="text-sm">Downloads</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
          <button
            onClick={goUp}
            disabled={currentPath === '/'}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            ← Back
          </button>
          
          <div className="flex-1 flex items-center gap-2 bg-gray-700 px-3 py-1 rounded">
            <Folder size={16} />
            <input
              type="text"
              value={currentPath}
              onChange={(e) => navigateTo(e.target.value)}
              className="flex-1 bg-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 bg-transparent outline-none"
            />
          </div>

          <button
            onClick={() => setShowNewDialog('folder')}
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500 flex items-center gap-1"
          >
            <Plus size={16} /> Folder
          </button>
          
          <button
            onClick={() => setShowNewDialog('file')}
            className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 flex items-center gap-1"
          >
            <Plus size={16} /> File
          </button>
        </div>

        {/* New Item Dialog */}
        {showNewDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-gray-800 p-4 rounded-lg w-80">
              <h3 className="text-lg font-bold mb-3">
                Create New {showNewDialog === 'folder' ? 'Folder' : 'File'}
              </h3>
              <input
                type="text"
                placeholder="Name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createNew()}
                className="w-full px-3 py-2 bg-gray-700 rounded mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={createNew}
                  className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-500"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowNewDialog(null); setNewName(''); }}
                  className="flex-1 px-3 py-2 bg-gray-600 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-auto p-2">
          <div className="grid grid-cols-5 gap-2">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => {
                  if (file.type === 'directory') {
                    navigateTo(file.path);
                  } else {
                    setSelectedFile(file);
                  }
                }}
                className={`p-3 rounded cursor-pointer flex flex-col items-center gap-2 ${
                  selectedFile?.id === file.id
                    ? 'bg-blue-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {file.type === 'directory' ? (
                  <Folder size={32} className="text-yellow-400" />
                ) : (
                  <File size={32} className="text-blue-400" />
                )}
                <span className="text-sm text-center truncate w-full">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400">
                  {file.type === 'file' ? `${file.size} bytes` : 'Folder'}
                </span>
              </div>
            ))}
          </div>

          {filteredFiles.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              {searchQuery ? 'No files found' : 'Empty folder'}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 text-sm">
          <span>{filteredFiles.length} items • LocalDisk ({currentDrive}:)</span>
          {selectedFile && (
            <div className="flex gap-2">
              <button
                onClick={() => downloadFile(selectedFile)}
                className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-500 flex items-center gap-1"
              >
                <Download size={14} /> Download
              </button>
              <button
                onClick={() => deleteFile(selectedFile)}
                className="px-2 py-1 bg-red-600 rounded hover:bg-red-500 flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
