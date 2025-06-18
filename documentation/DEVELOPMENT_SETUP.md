# 🚀 Development Setup Guide

This guide walks you through starting the WordWiseAI application for local development with Firebase emulators.

## 📋 Prerequisites

- Node.js 18+
- pnpm installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Environment variables configured (`.env.local`)

## 🎯 Quick Start (Two Terminals Required)

### Step 1: Validate Environment
```bash
pnpm prestart
```
✅ Should show all environment variables are present.

### Step 2: Start Firebase Emulators (Terminal 1)
```bash
pnpm emulators:start
```

**Expected Output:**
```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4000/               │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬──────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI              │
├────────────────┼────────────────┼──────────────────────────────────┤
│ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth       │
│ Functions      │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions  │
│ Firestore      │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore  │
│ Database       │ 127.0.0.1:9000 │ http://127.0.0.1:4000/database   │
│ Storage        │ 127.0.0.1:9199 │ http://127.0.0.1:4000/storage    │
├────────────────┼────────────────┼──────────────────────────────────┤
│ Other reserved ports: 4000, 4400, 4500, 9150, 9299, 9499   │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Start Next.js Development Server (Terminal 2)
```bash
pnpm dev
```

**Expected Output:**
```
> my-v0-project@0.1.0 dev
> next dev

   ▲ Next.js 15.2.4
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 2.3s
Connecting to Firebase emulators...
Connected to Firebase emulators
```

### Step 4: Access Your Application
- **App**: http://localhost:3000
- **Firebase Emulator UI**: http://localhost:4000

## 🔄 Daily Development Workflow

### Starting Development
1. **Terminal 1**: `pnpm emulators:start` (starts emulators with persistent data)
2. **Terminal 2**: `pnpm dev` (starts Next.js app)
3. **Browser**: Navigate to `http://localhost:3000`

### Stopping Development
1. **Terminal 2**: `Ctrl+C` (stops Next.js)
2. **Terminal 1**: `Ctrl+C` (stops emulators, auto-exports data)
3. **Verify cleanup**: `pnpm emulators:status` (should show no processes)

### If Processes Don't Stop Properly
Sometimes emulator processes can become "zombie" processes that don't shut down properly:

```bash
# Check for remaining processes
pnpm emulators:status

# If processes are still running, force cleanup
pnpm emulators:kill

# Then verify cleanup worked
pnpm emulators:status
```

### Next Session
1. **Terminal 1**: `pnpm emulators:start` (auto-imports previous data)
2. **Terminal 2**: `pnpm dev`
3. **Your users and data are still there!** 🎉

## 🧪 Emulator Commands Reference

```bash
# Start with persistence (recommended)
pnpm emulators:start

# Reset all data (fresh start)
pnpm emulators:reset

# Export data manually
pnpm emulators:export

# Import existing data
pnpm emulators:import

# Check if Firebase processes are running
pnpm emulators:status

# Kill any remaining Firebase processes (cleanup)
pnpm emulators:kill

# Development server
pnpm dev

# Environment validation
pnpm prestart
```

## 🔧 Code Quality & ESLint

This project uses **ESLint v9+** with the new flat configuration format for maintaining code quality during development.

### ESLint Setup

- **Configuration**: `eslint.config.js` (flat config format)
- **Version**: ESLint v9+ with modern flat configuration
- **Integration**: Configured for Next.js, React, TypeScript, and Prettier

### Development Commands

```bash
# Run ESLint checks
pnpm lint

# Fix auto-fixable linting issues
pnpm lint --fix

# Lint specific files or directories
npx eslint src/components/**/*.tsx
```

### ESLint Integration Notes

- **CI/CD Ready**: Configuration optimized for GitHub Actions
- **Build Artifacts Excluded**: `.next/`, `node_modules/`, and other generated files are ignored
- **Warning vs Error**: Configured to prevent CI failures from minor issues while maintaining code quality
- **Next.js Optimized**: Includes Next.js specific rules and optimizations

### Common ESLint Workflow

1. **During Development**: ESLint runs automatically in most editors with extensions
2. **Before Commits**: Run `pnpm lint` to check for issues
3. **Fix Issues**: Use `pnpm lint --fix` for auto-fixable problems
4. **Manual Fixes**: Address remaining warnings manually

### Troubleshooting ESLint

```bash
# If ESLint seems broken, verify configuration
npx eslint --print-config path/to/file.ts

# Check which files are being linted
npx eslint . --debug

# Clear cache if needed
npx eslint . --cache-location .eslintcache --fix
```

## 🔍 Troubleshooting

### "Port already in use" Error
This happens when Firebase processes from a previous session didn't shut down properly:

```bash
# Check what processes are running
pnpm emulators:status

# Kill any remaining Firebase processes
pnpm emulators:kill

# Verify cleanup worked
pnpm emulators:status

# Now start fresh
pnpm emulators:start
```

### "Cannot connect to emulators" Error
1. Make sure Terminal 1 shows "All emulators ready"
2. Check `http://localhost:4000` loads the Firebase UI
3. Verify emulators are running: `pnpm emulators:status`
4. If needed, restart both terminals

### "User not found" Error
- Your emulators restarted without persistence
- Use `pnpm emulators:start` instead of `firebase emulators:start`
- Create a new user account or ensure data was exported

### Zombie Process Issues
Sometimes emulator processes can become "orphaned" and continue running in the background:

**Common causes:**
- Force-closing terminal while emulators are running
- Computer sleep/wake cycles during development
- Multiple rapid `Ctrl+C` presses
- Network interruptions during shutdown

**Solution:**
```bash
# Always check process status first
pnpm emulators:status

# Clean up any remaining processes
pnpm emulators:kill

# Verify everything is clean
pnpm emulators:status
# Should show: "No Firebase processes running"
```

### Environment Variable Issues
```bash
pnpm prestart
# Should show all variables as ✅ Present
```

## 📱 Development URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Your App** | http://localhost:3000 | Main application |
| **Emulator UI** | http://localhost:4000 | Firebase admin interface |
| **Auth Emulator** | http://localhost:9099 | Authentication service |
| **Firestore** | http://localhost:8080 | Document database |
| **Realtime DB** | http://localhost:9000 | Real-time database |
| **Functions** | http://localhost:5001 | Cloud Functions |
| **Storage** | http://localhost:9199 | File storage |

## 🎯 Key Points

- **Two terminals required**: Emulators + Next.js app run separately
- **Data persists**: Using `pnpm emulators:start` saves data between sessions
- **Auto-detection**: App automatically connects to emulators in development
- **Isolated**: No production data is affected during development
- **Complete stack**: All Firebase services available locally

## 🚀 Pro Tips

1. **Keep emulator terminal open** - Don't close it during development
2. **Use emulator UI** - Great for viewing/editing data at http://localhost:4000
3. **Check console logs** - Both terminals show helpful debugging info
4. **Data persistence** - Always use `pnpm emulators:start` for persistent data
5. **Fresh start** - Use `pnpm emulators:reset` when you need clean data
6. **Verify process cleanup** - Run `pnpm emulators:status` after stopping development
7. **Clean shutdown** - Single `Ctrl+C` and wait for "Emulators shutting down..." message
8. **Force cleanup when needed** - Use `pnpm emulators:kill` for stubborn processes

## 🔧 Process Management

### Daily Workflow with Process Verification
```bash
# 1. Check no existing processes (clean start)
pnpm emulators:status

# 2. Start emulators
pnpm emulators:start

# 3. When done, stop with Ctrl+C and verify
pnpm emulators:status

# 4. If processes remain, clean up
pnpm emulators:kill
```

### Troubleshooting Process Issues
```bash
# The golden trinity for Firebase emulator management:
pnpm emulators:status    # See what's running
pnpm emulators:kill      # Clean up processes  
pnpm emulators:start     # Start fresh
```

---

**Need help?** Check the main [README.md](./README.md) for detailed Firebase configuration information. 