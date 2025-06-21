# WordWiseAI

A Next.js-based writing assistant powered by Firebase and AI, featuring real-time collaboration, grammar checking, and intelligent writing suggestions.

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Realtime Database, Functions, Auth, Storage)
- **AI Integration**: OpenAI API for writing suggestions and grammar checking
- **Editor**: TipTap with real-time collaboration
- **Deployment**: Firebase Hosting with GitHub Actions CI/CD

## 🔧 Firebase Configuration

This project uses Firebase as the primary backend with the following services:
- **Firestore**: Document storage and user data
- **Realtime Database**: Real-time collaboration and presence system
- **Authentication**: User authentication and authorization
- **Cloud Functions**: AI processing and serverless backend logic
- **Storage**: File uploads and document attachments
- **Hosting**: Static website hosting

### Environment Variables

Required Firebase environment variables (add to `.env.local`):

```env
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# Firebase Admin Configuration (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI Integration
OPENAI_API_KEY=your_openai_api_key
```

Copy `env.example` to `.env.local` and fill in your values.

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Firebase CLI: `npm install -g firebase-tools`

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd WordWiseAI
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your Firebase configuration
   ```

3. **Validate environment setup:**
   ```bash
   pnpm prestart
   ```
   This validates all required environment variables are present.

### 🧪 Local Development with Firebase Emulators

For safe local development, use Firebase emulators (recommended):

**⚠️ IMPORTANT: You need TWO separate terminals running simultaneously**

1. **Terminal 1 - Start Firebase emulators with persistence:**
   ```bash
   pnpm emulators:start
   ```

2. **Terminal 2 - Start the Next.js development server:**
   ```bash
   pnpm dev
   ```

3. **Access your application:**
   - **App**: http://localhost:3000
   - **Firebase Emulator UI**: http://localhost:4000
   - **Emulator Services**:
     - Auth: http://localhost:9099
     - Firestore: http://localhost:8080
     - Realtime Database: http://localhost:9000
     - Cloud Functions: http://localhost:5001
     - Storage: http://localhost:9199

📋 **For detailed setup instructions, see [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)**

### 🔒 Emulator Benefits

- **Complete isolation** from production Firebase data
- **No billing charges** for development usage
- **Faster development** with local data
- **Safe testing** of security rules and functions
- **Offline development** capability

### 🎯 Development Workflow

The app automatically detects when emulators are running and connects to them instead of production Firebase. This is configured in `lib/firebase.ts`:

```typescript
// Automatically connects to emulators in development
if (process.env.NODE_ENV === 'development') {
  // Connects to local emulators
}
```

## 🏗️ Build & Deployment

### Build Process

```bash
# Install dependencies
pnpm install

# Run linting  
pnpm lint

# Build the application
pnpm build

# Start production server (optional)
pnpm start
```

### 🚀 Deployment

The project uses **Firebase Hosting** with automated GitHub Actions deployment:

#### Automatic Deployment
- **Production**: A push to the `main` branch automatically deploys the latest version of the web application to the live site and updates the production **Firestore Rules**.
- **Preview**: New pull requests automatically deploy a preview version of the web application for testing. This does **not** deploy Firestore rules.

#### Manual Deployment
```bash
# Deploy everything (hosting, functions, rules)
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules,database:rules
```

### 🔍 Deployment Verification

After deployment, verify these components:

1. **Hosting**: Check that the site loads at your Firebase hosting URL
2. **Functions**: Test API endpoints and Cloud Functions
3. **Rules**: Verify Firestore and Database security rules are active
4. **Authentication**: Test user sign-up/sign-in flow
5. **Real-time features**: Test document collaboration and live updates

## 📋 Available Scripts

```bash
pnpm dev          # Start development server (uses emulators if running)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm prestart     # Validate environment variables
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

## 🔧 Code Quality & Linting

This project uses **ESLint v9+** with the new flat configuration format for code linting and quality control.

### ESLint Configuration

- **Config File**: `eslint.config.js` (ESLint v9+ flat config format)
- **Legacy Config**: `.eslintrc.json` (kept for compatibility but not used)
- **Rules**: Next.js, React, TypeScript, and Prettier integration

### Running ESLint

```bash
# Lint all files
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix

# Lint specific files
npx eslint path/to/file.ts
```

### ESLint Configuration Details

The project uses ESLint's new flat configuration format (`eslint.config.js`):
- **Next.js** core web vitals rules
- **React** recommended rules
- **TypeScript** recommended rules  
- **Prettier** integration for formatting
- **Custom rules** for project-specific requirements

Build artifacts and generated files are automatically ignored to keep CI/CD fast and focused on source code quality.

### ⚠️ ESLint Upgrade Notes

This project uses **ESLint v9+** with the new flat configuration format. When upgrading ESLint in the future:

1. **Check compatibility** with the flat config format (`eslint.config.js`)
2. **Review breaking changes** in ESLint release notes
3. **Test locally** before pushing changes: `pnpm lint`
4. **Update configuration** if new rules or deprecated features are introduced

The pre-commit hook will automatically run ESLint checks to prevent commits with linting errors.

## 🧪 Firebase Emulator Commands

**⚠️ IMPORTANT**: By default, Firebase emulators are **ephemeral** - all data (users, documents, etc.) is lost when emulators are stopped. Use persistence commands below to save your development data.

### Basic Commands
```bash
# Start all emulators (ephemeral - data lost on restart)
firebase emulators:start

# Start specific emulators
firebase emulators:start --only firestore,auth
```

### Persistent Data Commands (Recommended for Development)
```bash
# Start with data persistence (saves data between sessions)
pnpm emulators:start
# or manually:
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data

# Reset all emulator data (fresh start)
pnpm emulators:reset

# Export current emulator data manually
pnpm emulators:export

# Import existing emulator data
pnpm emulators:import
```

### Data Persistence Workflow
1. **First time**: `pnpm emulators:start` (creates emulator-data directory)
2. **Create accounts**: Sign up users, create documents, etc.
3. **Stop emulators**: `Ctrl+C` (data auto-exported to emulator-data/)
4. **Restart**: `pnpm emulators:start` (data auto-imported)
5. **Your users and data persist!** 🎉

## 🔒 Security & Rules

Security rules are defined in:
- `firestore.rules` - Firestore security rules
- `database.rules.json` - Realtime Database security rules  
- `storage.rules` - Cloud Storage security rules

Deploy rules:
```bash
firebase deploy --only firestore:rules,database:rules,storage
```

## 🚨 Troubleshooting

### Environment Issues
```bash
# Validate environment variables
pnpm prestart

# Check Firebase project connection
firebase projects:list
firebase use --add
```

### Emulator Issues
```bash
# Clear emulator data
firebase emulators:start --import=./empty

# Check emulator status
firebase emulators:exec "echo 'Emulators running'"

# Kill emulator processes
pkill -f firebase
```

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

## 🔗 Key Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [TipTap Editor](https://tiptap.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📁 Project Structure

```
WordWiseAI/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                   # Firebase config and utilities
├── services/              # Business logic and API services
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── functions/             # Firebase Cloud Functions
├── documentation/         # Project documentation
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── database.rules.json    # Realtime Database security rules
└── storage.rules          # Storage security rules
```

---

For specific feature documentation, see the `documentation/` directory. 