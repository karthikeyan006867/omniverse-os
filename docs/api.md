# 📚 API Documentation

## Kernel API

### Storage Manager

```typescript
import { storage } from '@kernel/storage';

// Initialize
await storage.initialize();

// Generic operations
await storage.set('files', fileNode);
const file = await storage.get('files', fileId);
const allFiles = await storage.getAll('files');
await storage.delete('files', fileId);
await storage.clear('files');

// File-specific
const fileByPath = await storage.getFileByPath('/path/to/file');
const children = await storage.getFilesByParent(parentId);

// Key-value store
await storage.setKV('myKey', { any: 'data' });
const data = await storage.getKV('myKey');

// Stats
const stats = await storage.getStorageStats();
// Returns: { used, available, quota }

// Maintenance
await storage.vacuum(); // Clean up old data
const exported = await storage.exportData();
await storage.importData(exported);
```

### Virtual File System

```typescript
import { vfs } from '@kernel/filesystem';

// Initialize
await vfs.initialize('userId');

// Directories
const dir = await vfs.createDirectory('/path', 'dirname', permissions);
const children = await vfs.listDirectory('/path/to/dir');

// Files
const file = await vfs.createFile(
  '/parent/path',
  'filename.txt',
  'content',
  'text/plain',
  permissions
);

const content = await vfs.readFile('/path/to/file.txt');
await vfs.writeFile('/path/to/file.txt', 'new content', false);

// Operations
await vfs.deleteFile('/path/to/file');
await vfs.moveFile('/old/path', '/new/path');
const copy = await vfs.copyFile('/source', '/destination');

// Stats
const stats = await vfs.getStats();
// Returns: { totalFiles, totalDirectories, totalSize }

// User management
vfs.setCurrentUser('userId');
vfs.clearCache();
```

#### File Permissions

```typescript
interface FilePermissions {
  owner: string;          // User ID
  read: string[];        // User IDs with read access
  write: string[];       // User IDs with write access
  execute: string[];     // User IDs with execute access
  public: boolean;       // Public access
}
```

### Process Manager

```typescript
import { processManager } from '@kernel/process';

// Initialize
await processManager.initialize();

// Lifecycle
const process = await processManager.spawn(
  'ProcessName',
  'app', // or 'service', 'agent'
  { permissions: [], environment: {} },
  parentPid?
);

await processManager.kill(pid, force?);
await processManager.pause(pid);
await processManager.resume(pid);
await processManager.crash(pid, error?);

// Queries
const proc = processManager.getProcess(pid);
const all = processManager.getAllProcesses();
const byType = processManager.getProcessesByType('app');
const running = processManager.getRunningProcesses();
const appProc = processManager.getProcessByAppId(appId);
const children = processManager.getChildProcesses(parentPid);

// Management
await processManager.setPriority(pid, priority); // 0-10

// Stats
const stats = processManager.getSystemStats();
// Returns: { total, running, paused, crashed, totalCpu, totalMemory }

// Events
processManager.on('spawn', (proc) => { });
processManager.on('kill', (proc) => { });
processManager.on('crash', (proc) => { });

// Cleanup
await processManager.cleanupCrashedProcesses();
await processManager.killAll();
```

### Kernel Core

```typescript
import { kernel } from '@kernel/index';

// Boot/Shutdown
await kernel.boot('userId');
await kernel.shutdown();
await kernel.reboot();

// User management
const user = kernel.getCurrentUser();
await kernel.switchUser('userId');

// System info
const stats = await kernel.getSystemStats();
/*
Returns: {
  totalProcesses, activeApps, activeAgents,
  storageUsed, storageAvailable,
  totalUsers, activeUsers,
  uptime, lastBootAt
}
*/

const uptime = kernel.getUptime(); // milliseconds
const ready = kernel.isReady();

// Diagnostics
const diag = await kernel.runDiagnostics();
/*
Returns: {
  storage: { used, available, quota, usagePercent },
  filesystem: { totalFiles, totalDirectories, totalSize },
  processes: { total, running, crashed, cpuUsage, memoryUsage },
  overall: 'healthy' | 'warning' | 'critical'
}
*/

// Emergency
await kernel.emergencyCleanup();
await kernel.resetSystem(); // Clears ALL data
```

## App System API

### App Manager

```typescript
import { appManager } from '@/apps/appManager';

// Initialize
await appManager.initialize();

// Installation
const app = await appManager.installApp({
  name: 'My App',
  version: '1.0.0',
  description: 'App description',
  icon: '🎨',
  author: 'yourname',
  category: 'productivity',
  permissions: ['filesystem.read'],
  entryPoint: '/apps/MyApp',
  installSize: 102400,
  isBuiltIn: false,
  windowConfig: { /* ... */ },
  metadata: {},
});

await appManager.uninstallApp(appId);

// Queries
const app = await appManager.getApp(appId);
const allApps = await appManager.getAllApps();
const categoryApps = await appManager.getAppsByCategory('productivity');

// Launching
const windowId = await appManager.launchApp(appId, initialState?);
await appManager.closeApp(appId);

// Window management
const window = appManager.getWindow(windowId);
const allWindows = appManager.getAllWindows();

appManager.focusWindow(windowId);
appManager.minimizeWindow(windowId);
appManager.maximizeWindow(windowId);
appManager.moveWindow(windowId, x, y);
appManager.resizeWindow(windowId, width, height);
appManager.updateWindowState(windowId, newState);
await appManager.closeWindow(windowId);
```

#### App Categories
- `productivity`
- `communication`
- `development`
- `entertainment`
- `finance`
- `ai`
- `system`
- `custom`

#### App Permissions
- `filesystem.read`
- `filesystem.write`
- `network.access`
- `ai.execute`
- `economy.transact`
- `system.admin`
- `collaboration.sync`

## AI System API

### AI Agents

```typescript
import { aiSystem } from '@/ai/aiSystem';

// Initialize
await aiSystem.initialize();

// Agent management
const agent = await aiSystem.createAgent(
  'ownerId',
  'AgentName',
  'assistant', // or 'worker', 'moderator', 'trader', 'custom'
  {
    creativity: 0.7,
    formality: 0.5,
    helpfulness: 0.9,
    assertiveness: 0.6,
    traits: ['friendly', 'helpful'],
  }
);

await aiSystem.deleteAgent(agentId);

// Queries
const agent = await aiSystem.getAgent(agentId);
const myAgents = await aiSystem.getAgentsByOwner('userId');
const active = await aiSystem.getActiveAgents();

// Conversation
const response = await aiSystem.chat(agentId, 'Hello!', context?);

// Memory
const memory = await aiSystem.addMemory(agentId, {
  type: 'conversation', // or 'fact', 'task', 'emotion'
  content: 'Remembered information',
  importance: 0.8, // 0-1
});

const memories = await aiSystem.searchMemory(agentId, 'query', limit?);

// Goals
const goal = await aiSystem.addGoal(
  agentId,
  'Complete this task',
  priority, // 0-10
  deadline?
);

await aiSystem.updateGoalProgress(agentId, goalId, 0.5); // 0-1

// Skills
await aiSystem.addSkill(agentId, 'new-skill');

// Personality
await aiSystem.updatePersonality(agentId, {
  creativity: 0.9,
  formality: 0.3,
});
```

#### Agent Types
- `assistant` - Personal helper
- `worker` - Task automation
- `moderator` - Content moderation
- `trader` - Economic trading
- `custom` - User-defined

## Economy System API

### Wallets & Currency

```typescript
import { economySystem } from '@/economy/economySystem';

// Initialize
await economySystem.initialize();

// Wallet management
const wallet = await economySystem.createWallet('ownerId');
const wallet = await economySystem.getWallet(walletId);
const wallet = await economySystem.getWalletByOwner('userId');
const wallet = await economySystem.getOrCreateWallet('userId');

// Currency
const currency = await economySystem.createCurrency(
  'MyToken',
  'MTK',
  'issuerId',
  1000000, // initial supply
  false // isSystem
);

const currency = await economySystem.getCurrency(currencyId);
const allCurrencies = await economySystem.getAllCurrencies();
const systemCurrency = economySystem.getSystemCurrency();

await economySystem.setExchangeRate(fromCurrencyId, toCurrencyId, rate);

// Transactions
const tx = await economySystem.transfer(
  fromWalletId,
  toWalletId,
  amount,
  currencyId,
  metadata?
);

const tx = await economySystem.mint(
  walletId,
  amount,
  currencyId,
  reason?
);

// Queries
const balance = await economySystem.getBalance(walletId, currencyId);
const history = await economySystem.getTransactionHistory(walletId, limit?);

// Rewards
await economySystem.rewardUser('userId', amount, 'reason');
```

#### Transaction Types
- `transfer` - User to user
- `mint` - Create new currency
- `burn` - Destroy currency
- `reward` - System reward
- `tax` - System tax

## Collaboration API

### Real-time Sync

```typescript
import { collaborationEngine } from '@/collaboration/collaborationEngine';

// Initialize
await collaborationEngine.initialize('http://localhost:3001');

// Connection
const connected = collaborationEngine.isConnected();
collaborationEngine.disconnect();

// Sessions
const session = await collaborationEngine.createSession(
  'resourceId',
  'userId'
);

await collaborationEngine.joinSession(sessionId, 'userId');
await collaborationEngine.leaveSession(sessionId, 'userId');

const session = collaborationEngine.getSession(sessionId);
const allSessions = collaborationEngine.getAllSessions();

// Updates
collaborationEngine.sendUpdate({
  sessionId,
  userId,
  type: 'insert', // or 'delete', 'update', 'cursor'
  path: '/document/content',
  data: { text: 'Hello' },
  version: 1,
});

// Listeners
collaborationEngine.onUpdate(sessionId, (update) => {
  console.log('Received update:', update);
});

collaborationEngine.offUpdate(sessionId, handler);
```

## Type Definitions

All type definitions can be imported from `@kernel/types`:

```typescript
import type {
  // Files
  FileNode,
  DirectoryNode,
  FilePermissions,
  
  // Processes
  Process,
  ProcessMetadata,
  
  // Apps
  App,
  AppWindow,
  WindowConfig,
  AppCategory,
  AppPermission,
  
  // AI
  AIAgent,
  AIMemory,
  AIGoal,
  AIPersonality,
  
  // Economy
  Wallet,
  Currency,
  Transaction,
  
  // Collaboration
  CollabSession,
  CollabUpdate,
  
  // Users
  User,
  UserPreferences,
  
  // System
  SystemStats,
  KernelEvent,
  StorageQuota,
  
  // Errors
  KernelError,
  FileSystemError,
  ProcessError,
  PermissionError,
} from '@kernel/types';
```

---

For more examples, see the [Quick Start Guide](../QUICKSTART.md).
