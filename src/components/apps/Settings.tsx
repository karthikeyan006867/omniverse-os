'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Monitor, Bell, Lock, Database } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('system');
  const [settings, setSettings] = useState({
    theme: 'dark',
    fontSize: 'medium',
    notifications: true,
    autoSave: true,
    databaseAPI: '',
  });

  const tabs = [
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'user', label: 'User', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'storage', label: 'Storage', icon: Database },
  ];

  return (
    <div className="h-full bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-48 bg-gray-800 border-r border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon size={20} className="text-blue-400" />
          <h2 className="font-bold">Settings</h2>
        </div>
        
        <div className="space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-400'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'system' && (
          <div>
            <h3 className="text-2xl font-bold mb-6">System Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span>Auto Save</span>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-700 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Storage Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  External Database API (Optional - for LocalDisk D:)
                </label>
                <input
                  type="text"
                  value={settings.databaseAPI}
                  onChange={(e) => setSettings({ ...settings, databaseAPI: e.target.value })}
                  placeholder="https://api.example.com/storage"
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Connect an external database to use as LocalDisk D:
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Storage Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">LocalDisk C:</span>
                    <span>IndexedDB (Browser)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">LocalDisk D:</span>
                    <span>{settings.databaseAPI ? 'External API' : 'Not Connected'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Notification Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-gray-400">Receive system notifications</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-full h-full bg-gray-700 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'user' && (
          <div>
            <h3 className="text-2xl font-bold mb-6">User Profile</h3>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="font-bold text-lg">demo-user</p>
                  <p className="text-sm text-gray-400">User Account</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
