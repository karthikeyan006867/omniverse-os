# 🏗️ OMNIVERSE OS Architecture

## System Overview

OMNIVERSE OS is a browser-based operating system built on a layered architecture:

```
┌─────────────────────────────────────────────────┐
│              User Interface Layer               │
│  (React Components, Windows, Desktop, Taskbar) │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            Application Layer                    │
│  (App Manager, Built-in Apps, User Apps)       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Subsystems Layer                   │
│ (AI System, Economy, Collaboration, Security)   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│               Kernel Layer                      │
│  (Process Manager, File System, Storage)        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Browser Platform Layer                │
│  (IndexedDB, WebSockets, Service Workers)       │
└─────────────────────────────────────────────────┘
```

## Core Components

### 1. Kernel (`src/kernel/`)

The kernel is the heart of the OS, managing all core functionality.

#### Storage Manager
- **Purpose**: Persistent data storage using IndexedDB
- **Stores**: Files, processes, apps, transactions, users, agents
- **Features**: 
  - CRUD operations for all data types
  - Indexed queries for performance
  - Storage statistics and quotas
  - Data import/export

#### Virtual File System (VFS)
- **Purpose**: Browser-based file system with permissions
- **Features**:
  - Hierarchical directory structure
  - File/folder CRUD operations
  - Permission system (read/write/execute)
  - Path-based access
  - File caching for performance
- **Default Structure**:
  ```
  /
  ├── home/           # User directories
  ├── apps/           # Installed applications
  ├── system/         # System files
  ├── tmp/            # Temporary files
  └── shared/         # Shared resources
  ```

#### Process Manager
- **Purpose**: Manages running apps, services, and agents
- **Features**:
  - Process lifecycle (spawn, kill, pause, resume)
  - Resource tracking (CPU, memory - simulated)
  - Process hierarchy (parent-child relationships)
  - Priority management
  - Event system (spawn, kill, crash, etc.)
  - Automatic cleanup

#### Kernel Core
- **Purpose**: Orchestrates all subsystems
- **Features**:
  - Boot sequence management
  - User session management
  - System statistics
  - Emergency functions
  - Diagnostics

### 2. App System (`src/apps/`)

Manages application installation, launching, and windowing.

#### App Manager
- **Purpose**: App registry and lifecycle
- **Features**:
  - App installation/uninstallation
  - Launch/close apps
  - Window management (create, move, resize, focus)
  - Built-in app provisioning
  - Multi-instance support
- **Built-in Apps**:
  - File Explorer
  - Terminal
  - Text Editor
  - Wallet
  - AI Assistant
  - Settings

#### Window System
- **Purpose**: Multi-window UI management
- **Features**:
  - Draggable windows
  - Resizable windows
  - Minimize/maximize/close
  - Z-index management (focus order)
  - Window state persistence

### 3. AI System (`src/ai/`)

Autonomous AI agents with memory, goals, and learning capabilities.

#### AI Agent
- **Purpose**: Intelligent assistants and automation
- **Types**: assistant, worker, moderator, trader, custom
- **Features**:
  - Conversation with context
  - Memory system (conversation, facts, tasks, emotions)
  - Goal management with progress tracking
  - Personality tuning (creativity, formality, helpfulness, assertiveness)
  - Skill learning
  - Memory search

#### Memory System
- **Storage**: Up to 1000 memories per agent
- **Types**: conversation, fact, task, emotion
- **Importance Scoring**: 0-1 scale
- **Related Memories**: Graph-like connections

#### Personality
- **Parameters**:
  - Creativity (0-1)
  - Formality (0-1)
  - Helpfulness (0-1)
  - Assertiveness (0-1)
  - Traits (array of strings)

### 4. Economy System (`src/economy/`)

Virtual currency, wallets, and transaction engine.

#### Currency
- **System Currency**: OmniCoin (OMC)
- **User Currencies**: Create custom currencies
- **Features**:
  - Total supply tracking
  - Circulating supply
  - Exchange rates between currencies
  - Decimals support

#### Wallets
- **Multi-currency**: Hold multiple currencies
- **Features**:
  - Balance tracking
  - Transaction history
  - Auto-creation on first use
  - Initial balance (1000 OMC)

#### Transactions
- **Types**: transfer, mint, burn, reward, tax
- **Features**:
  - Atomic transfers
  - Transaction history
  - Status tracking (pending, completed, failed)
  - Metadata support

### 5. Collaboration Engine (`src/collaboration/`)

Real-time synchronization using WebSockets.

#### Client
- **Purpose**: Real-time updates between users
- **Features**:
  - Session management
  - Update broadcasting
  - Participant tracking
  - Reconnection handling

#### Server (`server/index.js`)
- **Technology**: Socket.IO
- **Features**:
  - Session creation/joining
  - Update broadcasting
  - Participant management
  - Automatic session cleanup
  - Inactive session removal (30 min timeout)

### 6. UI Layer (`src/components/`, `src/app/`)

React-based user interface.

#### Boot Screen
- Shows boot progress
- System initialization messages
- Loading animation

#### Desktop
- Main workspace
- Window container
- App menu
- System stats widget
- Background effects

#### Window Component
- Draggable titlebar
- Minimize/maximize/close buttons
- Resizable (planned)
- Focus management
- Content area

#### Taskbar
- App menu button
- Running apps list
- System stats (processes, apps, storage)
- Clock and date

## Data Flow

### App Launch Flow
```
User clicks app
    ↓
Desktop → appManager.launchApp()
    ↓
App Manager → processManager.spawn()
    ↓
Process Manager creates process
    ↓
App Manager creates window
    ↓
Window added to Desktop
    ↓
App marked as running
```

### File System Flow
```
App requests file
    ↓
VFS checks permissions
    ↓
If allowed: VFS checks cache
    ↓
Cache miss: VFS → Storage Manager
    ↓
Storage Manager → IndexedDB
    ↓
Data returned through chain
    ↓
VFS updates cache
```

### AI Chat Flow
```
User sends message
    ↓
AI System receives message
    ↓
Add to agent memory
    ↓
Generate response (rule-based / LLM)
    ↓
Add response to memory
    ↓
Return to user
```

### Transaction Flow
```
Transfer requested
    ↓
Economy System checks balance
    ↓
If sufficient: Create transaction
    ↓
Deduct from source wallet
    ↓
Add to destination wallet
    ↓
Mark transaction complete
    ↓
Save wallets and transaction
```

## Performance Considerations

### Caching
- VFS caches file nodes by ID and path
- Windows kept in memory
- Processes tracked in Map

### Indexing
- IndexedDB indexes for fast queries:
  - Files: by-path, by-parent
  - Apps: by-category
  - Transactions: by-wallet, by-timestamp
  - Users: by-username
  - Agents: by-owner

### Optimization
- Lazy loading of file content
- Window virtualization (minimize removes from DOM)
- Process cleanup (crashed processes removed after 1 hour)
- Memory limits (agents limited to 1000 memories)

## Security Model

### Permissions
- File permissions: read, write, execute
- App permissions:
  - `filesystem.read`
  - `filesystem.write`
  - `network.access`
  - `ai.execute`
  - `economy.transact`
  - `system.admin`
  - `collaboration.sync`

### Isolation
- Apps run as separate processes
- Windows isolated in their own DOM trees
- Storage namespaced by user

### Future Security
- End-to-end encryption
- Code signing for apps
- Sandboxed execution environment
- Rate limiting
- Audit logging

## Scalability

### Current (v0.1.0)
- Single user
- Local storage only
- ~10-20 apps
- ~100 files
- ~10 AI agents
- ~1000 transactions

### Future (Full Vision)
- Multi-user
- Distributed storage
- ~1000+ apps
- Unlimited files
- ~100+ AI agents per user
- Millions of transactions
- Real economy simulations

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **State Management**: Zustand, React hooks
- **Storage**: IndexedDB (via idb library)
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React

## Browser Compatibility

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Mobile**: ⚠️ Limited (no dragging)

## Future Architecture Enhancements

1. **WebAssembly Kernel**: Port kernel to Wasm for performance
2. **Service Workers**: Offline-first PWA
3. **Web Workers**: Multi-threaded processing
4. **WebRTC**: P2P collaboration
5. **WebGPU**: 3D metaverse rendering
6. **Module Federation**: Dynamic app loading
7. **IPFS**: Distributed file storage
8. **Web3**: Blockchain integration (optional)

---

This architecture is designed to scale from a simple demo to a full-fledged operating system while maintaining clean separation of concerns and extensibility.
