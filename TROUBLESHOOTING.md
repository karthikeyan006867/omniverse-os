# 🔧 Installation & Troubleshooting Guide

## System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **RAM**: 2GB available
- **Storage**: 500MB available disk space
- **Internet**: Required for initial setup

### Recommended Requirements
- **Node.js**: 20.0.0 or higher
- **npm**: 10.0.0 or higher
- **Browser**: Latest version of Chrome/Edge
- **RAM**: 4GB+ available
- **Storage**: 2GB+ available disk space
- **Internet**: Required for collaboration features

## Installation Steps

### 1. Clone or Download

**Option A: Git Clone**
```bash
git clone <repository-url>
cd project-2
```

**Option B: Download ZIP**
- Download the project as ZIP
- Extract to your preferred location
- Open terminal in the extracted folder

### 2. Install Dependencies

```bash
npm install
```

**Estimated time**: 2-5 minutes

**Common Issues**:
- If `npm install` fails, try: `npm install --legacy-peer-deps`
- If you see Python errors, they're usually warnings and can be ignored
- If you see gyp errors on Windows, install Windows Build Tools:
  ```bash
  npm install --global windows-build-tools
  ```

### 3. Verify Installation

```bash
npm run type-check
```

This should complete without errors.

### 4. Start Development Server

**Terminal 1** (Main App):
```bash
npm run dev
```

**Terminal 2** (Collaboration Server - Optional):
```bash
npm run server
```

### 5. Open Browser

Navigate to: [http://localhost:3000](http://localhost:3000)

You should see the OMNIVERSE OS boot screen.

## Common Installation Issues

### Issue: "Node version not compatible"

**Error**: `The engine "node" is incompatible with this module`

**Solution**:
```bash
# Check your Node version
node --version

# Update Node.js to 18+ or 20+
# Download from: https://nodejs.org/
```

### Issue: "Port 3000 already in use"

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find and kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use a different port:
npm run dev -- -p 3001
```

### Issue: "Module not found"

**Error**: `Cannot find module 'next'` or similar

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If on Windows:
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Issue: "TypeScript errors"

**Error**: `Type 'X' is not assignable to type 'Y'`

**Solution**:
```bash
# Rebuild TypeScript
npm run type-check

# If errors persist, clean Next.js cache
rm -rf .next
npm run dev
```

## Runtime Issues

### Issue: "Boot screen stuck at X%"

**Symptoms**: Boot screen doesn't complete

**Solutions**:
1. Open browser DevTools (F12) and check Console for errors
2. Clear browser cache and reload (Ctrl+Shift+R / Cmd+Shift+R)
3. Clear IndexedDB:
   - DevTools → Application → Storage → IndexedDB
   - Delete `omniverse-os` database
   - Reload page

### Issue: "Collaboration server not available"

**Symptoms**: Warning message during boot

**Solutions**:
1. This is normal if you haven't started the collaboration server
2. The OS works perfectly fine without it
3. To enable collaboration:
   ```bash
   # In separate terminal
   npm run server
   ```
4. Refresh the browser

### Issue: "Apps won't launch"

**Symptoms**: Clicking apps does nothing

**Solutions**:
1. Check browser console for errors
2. Try emergency cleanup:
   - Open browser console (F12)
   - Run: `await kernel.emergencyCleanup()`
3. If still broken, reset system:
   - Console: `await kernel.resetSystem()`
   - **Warning**: This deletes all data

### Issue: "Windows won't drag"

**Symptoms**: Can't move windows

**Solutions**:
1. Make sure you're clicking and dragging the titlebar (top bar)
2. Check that window isn't maximized
3. Try on desktop/laptop (touch dragging not fully supported)

### Issue: "Out of storage"

**Symptoms**: "QuotaExceededError" in console

**Solutions**:
1. Check storage usage:
   ```javascript
   const stats = await storage.getStorageStats();
   console.log(stats);
   ```
2. Clear old files:
   ```javascript
   await storage.vacuum();
   ```
3. Increase browser quota (browser settings)
4. Delete unnecessary apps/files

### Issue: "High memory usage"

**Symptoms**: Browser tab using lots of RAM

**Solutions**:
1. Close unused app windows
2. Run cleanup:
   ```javascript
   await processManager.cleanupCrashedProcesses();
   vfs.clearCache();
   ```
3. Close and reopen the browser tab
4. Reduce number of active apps

## Performance Issues

### Slow Boot Time

**Target**: <2 seconds  
**If slower**:

1. Clear browser cache
2. Disable browser extensions
3. Check browser DevTools Performance tab
4. Run on a better browser (Chrome/Edge recommended)

### Laggy Windows

**Target**: 60fps window dragging  
**If laggy**:

1. Close other browser tabs
2. Reduce number of open windows
3. Disable browser hardware acceleration (sometimes helps)
4. Update graphics drivers

### Slow File Operations

**Target**: <100ms  
**If slower**:

1. Clear VFS cache: `vfs.clearCache()`
2. Run vacuum: `await storage.vacuum()`
3. Check file count (too many files can slow things down)

## Browser-Specific Issues

### Chrome/Edge
- Generally best performance
- Occasionally have quota issues → Check site settings
- Service Worker may need manual clearing

### Firefox
- Works well but slightly slower IndexedDB
- May need to manually enable storage quota

### Safari
- Works but has stricter storage limits
- IndexedDB can be slower
- WebSocket may need manual permission

### Mobile Browsers
- Limited support (no dragging)
- Works in portrait mode but better in landscape
- Touch-to-click works for launching apps

## Development Issues

### Hot Reload Not Working

```bash
# Kill the dev server (Ctrl+C)
# Delete .next folder
rm -rf .next

# Restart
npm run dev
```

### Type Errors During Development

```bash
# Run type check to see all errors
npm run type-check

# Common fix: restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Build Errors

```bash
# Clean build
npm run build

# If errors:
rm -rf .next
npm run build
```

## Data Issues

### Lost Data After Refresh

**Cause**: IndexedDB not persisting

**Solutions**:
1. Check browser privacy settings
2. Disable "Clear cookies on exit"
3. Add localhost to allowed sites
4. Check if in Incognito/Private mode (data won't persist)

### Corrupt Database

**Symptoms**: Random errors, crashes

**Solution**:
```javascript
// In browser console
await kernel.resetSystem();
// This will delete all data and reinitialize
```

### Export/Import Data

**Export**:
```javascript
const data = await storage.exportData();
console.log(JSON.stringify(data));
// Copy the output and save to a file
```

**Import**:
```javascript
const data = { /* paste exported data */ };
await storage.importData(data);
```

## Network Issues

### Collaboration Server Won't Start

**Error**: Port 3001 in use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

**Error**: Module not found

```bash
# Make sure you're in project root
cd project-2
npm run server
```

### WebSocket Connection Failed

**Symptoms**: "Disconnected from collaboration server"

**Solutions**:
1. Make sure server is running: `npm run server`
2. Check firewall (allow port 3001)
3. Try different port in server/index.js
4. Check browser console for CORS errors

## Security Issues

### CORS Errors

**Error**: "blocked by CORS policy"

**Solution**: Already handled in server config, but if you see this:
```javascript
// server/index.js
cors: {
  origin: '*',  // Change to specific origin in production
}
```

### Permission Denied

**Symptoms**: Can't access files/features

**Solutions**:
1. Check user permissions in file system
2. Verify app has required permissions
3. Make sure you're logged in as correct user

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Check browser console for errors (F12)
3. Check if issue exists in incognito/private mode
4. Try on a different browser
5. Search GitHub issues

### How to Report a Bug

Include:
1. **Environment**:
   - OS (Windows/Mac/Linux)
   - Browser and version
   - Node.js version
2. **Steps to Reproduce**:
   - Detailed steps
   - Expected behavior
   - Actual behavior
3. **Console Errors**:
   - Screenshots of browser console
   - Full error messages
4. **System State**:
   ```javascript
   const diag = await kernel.runDiagnostics();
   console.log(diag);
   ```

### Where to Get Help

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community help
- **Discord**: (coming soon)
- **Documentation**: Check docs/ folder

## Advanced Troubleshooting

### Enable Debug Mode

```javascript
// In browser console
localStorage.setItem('DEBUG', 'true');
// Reload page
```

### View System Diagnostics

```javascript
const diag = await kernel.runDiagnostics();
console.table(diag);
```

### Monitor System Stats

```javascript
setInterval(async () => {
  const stats = await kernel.getSystemStats();
  console.log('System Stats:', stats);
}, 5000);
```

### Inspect Storage

```javascript
// See all stored data
const files = await storage.getAll('files');
const apps = await storage.getAll('apps');
const processes = await storage.getAll('processes');

console.log('Files:', files.length);
console.log('Apps:', apps.length);
console.log('Processes:', processes.length);
```

## Clean Reinstall

If nothing works, try a clean reinstall:

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Delete everything
rm -rf node_modules .next package-lock.json

# 3. Clear browser data
# - DevTools → Application → Clear Storage → Clear All

# 4. Reinstall
npm install

# 5. Start fresh
npm run dev
```

---

**Still having issues?** 

Create an issue on GitHub with:
- Detailed description
- Console errors
- System diagnostics output
- Steps you've already tried

We're here to help! 🚀
