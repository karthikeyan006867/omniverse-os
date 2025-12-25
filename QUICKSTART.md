# 🚀 Quick Start Guide

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   # Terminal 1: Run Next.js app
   npm run dev

   # Terminal 2: Run collaboration server (optional)
   npm run server
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

### 1. Boot Sequence
When you open the app, you'll see:
- Kernel initialization
- File system mounting
- App loading
- AI system startup
- Economy initialization
- Collaboration server connection (if available)

### 2. Desktop Interface
After booting, you'll see:
- **Taskbar** at the bottom with app menu, running apps, and system stats
- **System Status Widget** in the top-right corner
- **Click the menu icon** (☰) in the taskbar to see available apps

### 3. Launch Your First App
- Click the **Menu** button in the taskbar
- Select an app (try "Terminal", "Text Editor", or "AI Assistant")
- The app opens in a draggable, resizable window

### 4. Window Management
- **Drag** the titlebar to move windows
- **Minimize** (−) hides the window to taskbar
- **Maximize** (□) fills the screen
- **Close** (×) closes the window
- Click a window to bring it to front

## System Features

### 📁 Virtual File System
```typescript
import { vfs } from '@kernel/index';

// Create a file
await vfs.createFile('/home/demo-user', 'hello.txt', 'Hello World!');

// Read a file
const content = await vfs.readFile('/home/demo-user/hello.txt');

// List directory
const files = await vfs.listDirectory('/home/demo-user');
```

### ⚙️ Process Management
```typescript
import { processManager } from '@kernel/index';

// Spawn a process
const process = await processManager.spawn('MyApp', 'app', {
  appId: 'my-app-id',
  permissions: ['filesystem.read'],
});

// Get all running processes
const processes = processManager.getRunningProcesses();
```

### 🤖 AI Agents
```typescript
import { aiSystem } from '@/ai/aiSystem';

// Create an AI agent
const agent = await aiSystem.createAgent(
  'user-id',
  'MyAssistant',
  'assistant',
  { creativity: 0.8, helpfulness: 0.9 }
);

// Chat with the agent
const response = await aiSystem.chat(agent.id, 'Hello!');
```

### 💰 Virtual Economy
```typescript
import { economySystem } from '@/economy/economySystem';

// Get or create wallet
const wallet = await economySystem.getOrCreateWallet('user-id');

// Check balance
const balance = await economySystem.getBalance(wallet.id, currencyId);

// Transfer currency
await economySystem.transfer(fromWalletId, toWalletId, amount, currencyId);
```

### 🤝 Collaboration
```typescript
import { collaborationEngine } from '@/collaboration/collaborationEngine';

// Create a collaboration session
const session = await collaborationEngine.createSession('resource-id', 'user-id');

// Send updates
collaborationEngine.sendUpdate({
  sessionId: session.id,
  userId: 'user-id',
  type: 'update',
  path: '/content',
  data: { text: 'New content' },
  version: 1,
});
```

## Development

### Project Structure
```
src/
├── kernel/          # OS core (VFS, processes, storage)
├── apps/            # App management
├── ai/              # AI agent system
├── economy/         # Currency & transactions
├── collaboration/   # Real-time sync
├── components/      # React UI components
└── app/             # Next.js pages
```

### Creating a New App

1. **Define the app**:
```typescript
const myApp = {
  name: 'My Cool App',
  version: '1.0.0',
  description: 'Does cool things',
  icon: '🎨',
  author: 'you',
  category: 'productivity',
  permissions: ['filesystem.read'],
  entryPoint: '/apps/MyCoolApp',
  installSize: 102400,
  isBuiltIn: false,
  windowConfig: {
    defaultWidth: 600,
    defaultHeight: 400,
    resizable: true,
    draggable: true,
  },
};
```

2. **Install the app**:
```typescript
import { appManager } from '@/apps/appManager';
await appManager.installApp(myApp);
```

3. **Create the component** at `src/apps/MyCoolApp/index.tsx`

### System Commands

Check system health:
```typescript
import { kernel } from '@kernel/index';

const diagnostics = await kernel.runDiagnostics();
console.log(diagnostics);
```

View system stats:
```typescript
const stats = await kernel.getSystemStats();
console.log(stats);
```

## Tips & Tricks

1. **Storage**: All data is stored in IndexedDB and persists between sessions
2. **Offline Mode**: The OS works fully offline (except collaboration)
3. **Developer Console**: Press F12 to access browser DevTools
4. **Reset System**: `await kernel.resetSystem()` - clears all data
5. **Emergency Cleanup**: `await kernel.emergencyCleanup()` - fixes crashed processes

## Common Issues

### "Collaboration server not available"
- Normal if you haven't started the server
- Run `npm run server` in a separate terminal
- The OS works fine without it

### "Database not initialized"
- Refresh the page to restart the boot sequence
- Check browser console for errors

### Windows not dragging
- Make sure you're dragging from the titlebar
- Check that the window isn't maximized

## Next Steps

1. Explore the built-in apps
2. Check system stats in the widget
3. Try creating files in Terminal (coming soon)
4. Interact with the AI Assistant
5. Monitor your virtual currency balance

## Need Help?

- Check the main [README.md](./README.md)
- Look at the [Architecture Documentation](./docs/architecture.md)
- Inspect the code - it's well-commented!

---

**Happy exploring the OMNIVERSE! 🌌**
