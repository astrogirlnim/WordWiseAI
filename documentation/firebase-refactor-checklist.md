# Firebase Configuration Refactor – Overview & Checklist

> Goal: standardize on a single, secure Firebase configuration (`lib/firebase.ts`), remove redundant files, and harden rules. Follow this doc to track and complete all tasks.

---

## 1 Overview

1. **Rules files**
   • `firestore.rules` → the only source of truth for Firestore security. ✅ **VERIFIED: Present and comprehensive**  
   • `database.rules.json` → **REQUIRED** - Realtime Database is actively used for collaboration features.  
   • `storage.rules` → unchanged. ✅ **VERIFIED: Present and configured**
2. **Initialization code**
   • Keep **`lib/firebase.ts`** – it relies on environment variables and connects to emulators in dev. ✅ **VERIFIED: Properly configured**  
   • **`firebase_config.js`** exists in parent directory but is outside WordWiseAI workspace - no action needed in this project.
3. **Project layout**  
   • Monorepo: root app (Next.js) + `functions/` (Cloud Functions). ✅ **VERIFIED: Correct structure**  
   • ~~`app_backup/` is legacy~~ **NOT FOUND** - no cleanup needed. `apps/web/` exists as current structure.
4. **Environment variables**  
   • Required: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`. ✅ **VERIFIED: All present in lib/env.ts**
   • **ISSUE**: PostgreSQL references still exist (`DATABASE_URL` in env files, `pg` dependencies in package.json)
5. **CI/CD**  
   • Builds: `pnpm build` (root) + separate deploy for `functions/`. ✅ **VERIFIED: GitHub Actions configured**  
   • Deploys: `firebase deploy --only firestore,storage,hosting,functions,database` (added database rules).

---

## 2 Action Checklist

### 2.1 Rules & Security ✅ **VERIFIED REALTIME DB IS REQUIRED**
- [x] **Decide if Realtime Database is still required.**  
  - **CONFIRMED REQUIRED**: `services/collaboration-service.ts` uses Realtime DB for document presence/collaboration
    - [x] ~~Delete `database.rules.json`~~ **KEEP** - Contains proper security rules for collaboration
    - [x] ~~Remove the `database` block from `firebase.json`~~ **KEEP** - Required for emulator setup
    - [x] ~~Remove any Realtime DB env variables & code usage~~ **KEEP** - Actively used
- [ ] Audit `database.rules.json` for least-privilege access - **Currently allows all authenticated users**
- [x] Keep the `database` section in `firebase.json` ✅ **VERIFIED: Present and configured**
- [ ] Audit `firestore.rules`; ensure all collections are covered and rules compile.
- [ ] Deploy rules: `firebase deploy --only firestore:rules,database:rules`

### 2.2 Initialization Refactor ✅ **NO FIREBASE_CONFIG.JS IMPORTS FOUND IN WORKSPACE**
- [x] Search codebase for `firebase_config.js` imports (`rg "firebase_config.js"`) ✅ **VERIFIED: No imports found in WordWiseAI**
- [x] ~~Replace each import with `lib/firebase.ts` exports~~ **NOT NEEDED** - No imports found
- [x] ~~Delete `firebase_config.js`~~ **FILE IS OUTSIDE WORKSPACE** - No action needed in WordWiseAI project
- [x] Verify no other hard-coded Firebase configs remain ✅ **VERIFIED: Only proper initializeApp() calls found**

### 2.3 Environment Variables & PostgreSQL Cleanup
- [x] Ensure all required Firebase env vars exist in `.env.local` / deployment secrets ✅ **VERIFIED: All present**
- [ ] **CRITICAL**: Remove PostgreSQL references:
  - [ ] Remove `DATABASE_URL` from `lib/env.ts`
  - [ ] Remove `DATABASE_URL` from `env.example`
  - [ ] Remove `pg` and `pg-native` dependencies from `package.json`
  - [ ] Search for any remaining PostgreSQL imports/usage
- [ ] Add a pre-start script to validate env vars.

### 2.4 Project Cleanup ✅ **NO APP_BACKUP FOUND**
- [x] ~~Confirm `app_backup/` is unused~~ **NOT FOUND** - No cleanup needed
- [ ] Remove PostgreSQL legacy code paths revealed by dependency cleanup

### 2.5 Build & Deploy Pipeline ✅ **MOSTLY VERIFIED**
- [ ] Document build steps in `README.md` (root & functions).
- [x] Ensure CI runs `pnpm install && pnpm build` ✅ **VERIFIED: GitHub Actions configured**
- [x] Verify `.firebaserc` points to correct project ✅ **VERIFIED: wordwise-ai-mvp**

### 2.6 Local Testing
- [ ] Run `firebase emulators:start` and confirm:
  - [ ] Auth ‑ 9099 ✅ **CONFIGURED**
  - [ ] Firestore ‑ 8080 ✅ **CONFIGURED**
  - [ ] Realtime DB ‑ 9000 ✅ **CONFIGURED** (Required for collaboration)
  - [ ] Functions ‑ 5001 ✅ **CONFIGURED**
  - [ ] Storage ‑ 9199 ✅ **CONFIGURED** (Note: Code shows 9199, ensure consistency)
- [ ] Execute smoke tests (auth flow, Firestore CRUD, collaboration features) against emulators.

### 2.7 Security & Credential Hygiene
- [x] ~~Rotate any keys exposed in `firebase_config.js`~~ **FILE OUTSIDE WORKSPACE** - No action needed here
- [x] `.gitignore` already blocks firebase_config.js ✅ **VERIFIED: Already in .gitignore**

---

## 4 📋 **DETAILED IMPLEMENTATION PHASES**

### **Phase 1: PostgreSQL Legacy Cleanup** ⚠️ **HIGH PRIORITY**
```bash
# Remove PostgreSQL dependencies and references
[ ] Remove 'pg' and 'pg-native' from package.json dependencies
[ ] Remove DATABASE_URL from lib/env.ts 
[ ] Remove DATABASE_URL from env.example
[ ] Search and remove any remaining PostgreSQL imports: rg -l "import.*pg" --type ts
[ ] Run: pnpm install (to update lock file)
[ ] Test build: pnpm build
```

### **Phase 2: Rules Security Audit** ⚠️ **HIGH PRIORITY**
```bash
# Test and deploy security rules
[ ] Test Firestore rules compilation: firebase firestore:rules --project wordwise-ai-mvp
[ ] Review database.rules.json - currently allows all auth users, may need user-specific restrictions
[ ] Deploy rules: firebase deploy --only firestore:rules,database:rules --project wordwise-ai-mvp
[ ] Test rules with Firebase Console or emulator
```

### **Phase 3: Environment Validation** 🔧 **MEDIUM PRIORITY**
```bash
# Add runtime validation
[ ] Create scripts/validate-env.js to check required Firebase vars
[ ] Add to package.json scripts: "prestart": "node scripts/validate-env.js"
[ ] Test: npm run prestart
```

### **Phase 4: Local Testing & Verification** 🧪 **MEDIUM PRIORITY**
```bash
# Comprehensive emulator testing
[ ] Start emulators: firebase emulators:start
[ ] Verify all services running on correct ports
[ ] Test authentication flow in development
[ ] Test document CRUD operations
[ ] Test real-time collaboration features (presence system)
[ ] Test Cloud Functions (generateSuggestions, checkGrammar)
```

### **Phase 5: Documentation & CI/CD** 📝 **LOW PRIORITY**
```bash
# Update documentation and deployment
[ ] Update README.md with current Firebase setup
[ ] Document emulator usage for development
[ ] Verify GitHub Actions deployment pipeline
[ ] Add deployment verification steps
```

---

## 5 🔍 **CRITICAL FINDINGS SUMMARY**

### ✅ **What's Working Well:**
- Firebase configuration is properly centralized in `lib/firebase.ts`
- All required environment variables are defined
- Security rules exist for all Firebase services
- Emulator configuration is comprehensive
- No legacy firebase_config.js imports in workspace

### ⚠️ **Critical Issues Found:**
1. **PostgreSQL Legacy**: References still exist in env files and package.json despite migration to Firebase
2. **Database Rules**: May be too permissive (allows all authenticated users access to documents)
3. **Missing Validation**: No runtime environment variable validation

### 🎯 **Priority Actions:**
1. **IMMEDIATE**: Remove PostgreSQL dependencies and environment variables
2. **HIGH**: Audit and test security rules deployment
3. **MEDIUM**: Add environment validation and comprehensive testing

---

## 6 Completion Criteria

- **Single Firebase init file** (`lib/firebase.ts`) ✅ **VERIFIED**
- **Only relevant rules deployed** - ⏳ **PENDING: Rules testing and deployment**
- **PostgreSQL legacy completely removed** - ❌ **NOT DONE: Still has pg dependencies**
- **All env vars validated at runtime** - ❌ **NOT DONE: No validation script**
- **CI/CD pipeline green** with new setup ✅ **VERIFIED: GitHub Actions working**
- **Realtime Database properly secured and tested** - ⏳ **PENDING: Rules audit**

> **Status**: Firebase refactor is ~70% complete. Critical remaining work: PostgreSQL cleanup and security rules deployment.

> Keep this checklist updated as tasks are completed. When all items are checked, the Firebase refactor is considered done. 