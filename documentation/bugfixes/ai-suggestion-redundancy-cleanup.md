# AI Suggestion Redundancy Cleanup

## Current State Overview

### 1. Suggestion Types & Data Model
- **AISuggestion** and **FunnelSuggestion** interfaces are nearly identical; both used in code, causing confusion.
- Both interfaces have a `position` (legacy) and `positioning` (modern, character-based) field.
- Only `AISuggestion` is needed; `FunnelSuggestion` is redundant.

### 2. Firestore Collections
- **funnelSuggestions**: Actively used for all AI-generated copy (headline, subheadline, cta, outline).
- **styleSuggestions**: Legacy; no longer surfaced in UI, but still present in code and backend.

### 3. Subscription & State Management
- Both `subscribeToStyleSuggestions` and `subscribeToFunnelSuggestions` are called in the main hook, but only funnel suggestions are shown in the UI.
- State is maintained for both, but only funnel suggestions are used.

### 4. Application Logic
- Document editor and apply logic handle both legacy and modern suggestion types, increasing complexity.

### 5. Firebase Deployment & Architecture
- **Cloud Functions**: `generateFunnelSuggestions` (active), `generateStyleSuggestions` (legacy, should be removed).
- **Firestore Indexes**: Both collections have indexes; only funnelSuggestions is required going forward.
- **Security Rules**: Both collections are referenced; rules for styleSuggestions can be removed after migration.
- **Emulator/Prod**: Ensure only funnelSuggestions is used in all environments.

---

## Cleanup & Streamlining Plan

### **Phase 0: Pre-Work**
- [x] Review all files and codebase for current state and hidden dependencies  
  _Summary: The codebase supports both legacy and modern suggestion types/collections, with redundancy in types, backend logic, and state management. Legacy code is present but not surfaced in the UI._
- [x] List all files referencing styleSuggestions, FunnelSuggestion, or legacy position logic  
  _Summary: References found in `types/ai-features.ts`, `services/suggestion-service.ts`, `hooks/use-ai-suggestions.ts`, `components/document-editor.tsx`, `components/ai-suggestions.tsx`, `functions/index.js`, and test scripts._

#### Phase 0 Findings

**1. Review of Current State and Hidden Dependencies:**
- The codebase currently maintains both `AISuggestion` and `FunnelSuggestion` interfaces in `types/ai-features.ts`. Both have a `position` (legacy) and `positioning` (modern, character-based) field.
- The `funnelSuggestions` Firestore collection is actively used for AI-generated copy (headline, subheadline, cta, outline). The `styleSuggestions` collection is legacy but still present in the backend and some frontend logic.
- Both `subscribeToStyleSuggestions` and `subscribeToFunnelSuggestions` are implemented in `services/suggestion-service.ts` and referenced in `hooks/use-ai-suggestions.ts`, but only funnel suggestions are surfaced in the UI.
- The document editor (`components/document-editor.tsx`) contains logic to handle both legacy and modern suggestion types, including fallback logic for legacy position-based application.
- Backend functions for both `generateFunnelSuggestions` (active) and `generateStyleSuggestions` (legacy) exist in `functions/index.js`.
- There are references to both collections in Firestore rules and indexes (not yet reviewed in detail).
- UI components such as `components/ai-suggestions.tsx` reference `FunnelSuggestion` directly.
- Test scripts (`test-firebase-function-with-auth.js`, `test-firebase-function.js`) log and check for both legacy and modern suggestion fields.

**2. Files Referencing styleSuggestions, FunnelSuggestion, or Legacy position Logic:**
- `types/ai-features.ts`: Defines both `AISuggestion` and `FunnelSuggestion` interfaces, including both `position` and `positioning` fields.
- `services/suggestion-service.ts`: Implements `subscribeToStyleSuggestions` and `subscribeToFunnelSuggestions`. Uses both collections in `applySuggestion`, `dismissSuggestion`, and `clearExistingSuggestions`. Contains logic to determine collection based on suggestion type.
- `hooks/use-ai-suggestions.ts`: Maintains state for both `styleSuggestions` and `funnelSuggestions`. Handles both legacy and modern suggestion types in application and dismissal logic.
- `components/document-editor.tsx`: Handles both legacy position-based and modern positioning-based application of suggestions. Contains fallback logic for legacy funnel suggestion insertion.
- `components/ai-suggestions.tsx`: Uses `FunnelSuggestion` type for props and rendering.
- `functions/index.js`: Contains both `generateStyleSuggestions` (legacy) and `generateFunnelSuggestions` (active) cloud functions. Writes to both collections and maintains both legacy and modern fields.
- `test-firebase-function-with-auth.js` & `test-firebase-function.js`: Log and check for both `position` and `positioning` fields in suggestions.

---

### **Phase 1: Data Model Simplification**
- [ ] Remove FunnelSuggestion interface; use only AISuggestion
- [ ] Remove legacy `position` field from AISuggestion; use only `positioning`
- [ ] Update all type imports and usages

### **Phase 2: Backend & Firestore**
- [ ] Remove generateStyleSuggestions Cloud Function
- [ ] Remove all references to styleSuggestions collection in backend
- [ ] Remove styleSuggestions indexes from firestore.indexes.json
- [ ] Remove styleSuggestions rules from firestore.rules

### **Phase 3: Frontend State & Subscription**
- [ ] Remove subscribeToStyleSuggestions and related state from SuggestionService and hooks
- [ ] Remove styleSuggestions state and logic from useAISuggestions
- [ ] Remove all UI and logic for style suggestions

### **Phase 4: Application Logic**
- [ ] Remove legacy position-based application logic from document editor
- [ ] Ensure all suggestion application uses positioning (character-based) logic
- [ ] Refactor apply/dismiss logic to only use funnelSuggestions

### **Phase 5: Validation & Deployment**
- [ ] Test all flows in emulator and production
- [ ] Validate Firestore rules and indexes
- [ ] Remove any remaining dead code or references

---

## Features/Checklist
- [ ] Single source of truth: Only funnelSuggestions and positioning logic used
- [ ] No legacy types, collections, or UI
- [ ] Clean, maintainable, and easy-to-understand codebase
- [ ] All changes documented and validated 