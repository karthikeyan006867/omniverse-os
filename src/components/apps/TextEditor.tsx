'use client';

import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, FileText, Download, Copy, Scissors, Clipboard } from 'lucide-react';
import { vfs } from '@/kernel/filesystem';

export default function TextEditor() {
  const [content, setContent] = useState('');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState({ chars: 0, words: 0, lines: 0 });

  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    setStats({
      chars: content.length,
      words,
      lines,
    });
  }, [content]);

  const handleChange = (value: string) => {
    setContent(value);
    setIsDirty(true);
  };

  const saveFile = async () => {
    if (!currentFile) {
      const filename = prompt('Enter filename:', 'untitled.txt');
      if (!filename) return;
      
      try {
        await vfs.createFile('/home/demo-user', filename, content);
        setCurrentFile(`/home/demo-user/${filename}`);
        setIsDirty(false);
        alert('File saved!');
      } catch (error: any) {
        alert(error.message);
      }
    } else {
      try {
        await vfs.writeFile(currentFile, content);
        setIsDirty(false);
        alert('File saved!');
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const openFile = async (path: string) => {
    try {
      const fileContent = await vfs.readFile(path);
      const text = typeof fileContent === 'string' ? fileContent : new TextDecoder().decode(fileContent);
      setContent(text);
      setCurrentFile(path);
      setIsDirty(false);
      setShowOpenDialog(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const showOpen = async () => {
    try {
      const allFiles = await vfs.listDirectory('/home/demo-user');
      const textFiles = allFiles.filter(f => f.type === 'file');
      setFiles(textFiles);
      setShowOpenDialog(true);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const newFile = () => {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    setContent('');
    setCurrentFile(null);
    setIsDirty(false);
  };

  const downloadAsFile = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile?.split('/').pop() || 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Menu Bar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={newFile}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 flex items-center gap-1"
        >
          <FileText size={16} /> New
        </button>
        <button
          onClick={showOpen}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 flex items-center gap-1"
        >
          <FolderOpen size={16} /> Open
        </button>
        <button
          onClick={saveFile}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500 flex items-center gap-1"
        >
          <Save size={16} /> Save
        </button>
        <button
          onClick={downloadAsFile}
          className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 flex items-center gap-1"
        >
          <Download size={16} /> Download
        </button>
        
        <div className="flex-1"></div>
        
        <span className="text-sm text-gray-400">
          {currentFile ? currentFile.split('/').pop() : 'Untitled'} {isDirty && '*'}
        </span>
      </div>

      {/* Open Dialog */}
      {showOpenDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-gray-800 p-4 rounded-lg w-96 max-h-96 overflow-auto">
            <h3 className="text-lg font-bold mb-3">Open File</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => openFile(file.path)}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer flex items-center gap-2"
                >
                  <FileText size={16} />
                  <span>{file.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{file.size} bytes</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowOpenDialog(false)}
              className="w-full mt-3 px-3 py-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-full bg-gray-800 text-white p-4 rounded font-mono text-sm resize-none outline-none"
          placeholder="Start typing..."
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <span>
          Line {stats.lines} | {stats.chars} characters | {stats.words} words
        </span>
        <span>Plain Text</span>
      </div>
    </div>
  );
}
