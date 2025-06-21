# Phase 3: Collaboration & Version Control – Implementation Checklist

---

## 📋 Overview & Codebase Status

**Goal:** Robust, real-time collaboration and version control using Firestore snapshot-based updates, coordinated through the EditorContentCoordinator. No Yjs or Realtime Database for content sync; all real-time updates via Firestore. Presence will migrate to Firestore. All updates (user, remote, version, AI, grammar, page) must be queued and merged safely.

**Current Status:**
- All document content and version updates use Firestore (`onSnapshot`).
- Presence is tracked via Realtime Database (to be migrated).
- No Yjs/CRDT code present.
- `EditorContentCoordinator` is the single source of truth for all content updates.
- Version restore and document updates are coordinated but need robust queueing/merging.

**Key Files:**
- `components/document-editor.tsx`
- `components/document-container.tsx`
- `hooks/use-documents.ts`
- `hooks/use-document-versions.ts`
- `services/document-service.ts`
- `services/version-service.ts`
- `services/suggestion-service.ts`
- `services/collaboration-service.ts`
- `utils/editor-content-coordinator.ts`
- `types/document.ts`, `types/version.ts`, `types/user.ts`
- `firestore.rules`

---

## Phase 0: Diagnosis & Verification
- [x] Audit all files above for:
  - [x] Firestore `onSnapshot` usage for real-time updates
  - [x] No Yjs or Realtime Database content sync logic
  - [x] All content updates routed through `EditorContentCoordinator`
  - [x] Version restore logic routed through coordinator
  - [x] Presence logic using Realtime Database (to be migrated)
  - [x] All document/AI/grammar/page/version updates coordinated
  - [x] Logging present for all update flows
- [x] Document any legacy, duplicate, or dead code for removal

### 📋 Phase 0 Audit Findings Summary

**✅ CONFIRMED WORKING:**
- **Firestore Real-time Updates**: `services/document-service.ts` uses `onSnapshot` for document subscriptions, `services/suggestion-service.ts` uses `onSnapshot` for AI suggestions
- **No Legacy Sync Logic**: No Yjs/CRDT or Realtime Database content sync found
- **EditorContentCoordinator**: Comprehensive 395-line coordinator with priority queuing, debouncing, and conflict resolution
- **Presence via Realtime DB**: `services/collaboration-service.ts` uses Firebase Realtime Database for presence tracking (ready for Firestore migration)
- **Comprehensive Logging**: All services have extensive logging with context and timing

**⚠️ NEEDS ATTENTION:**
- **Version Restore Coordination**: `components/document-container.tsx` line 157 handles version restore directly - needs routing through coordinator
- **Editor Binding Verification**: Coordinator initialization present but binding to editor needs verification
- **Remote Update Coordination**: Firestore document updates need explicit routing through coordinator as 'remote' type

**✅ NO LEGACY ISSUES:**
- Clean codebase with no duplicate functionality
- Well-structured types and consistent patterns
- Appropriate Firestore security rules
- No dead code or deprecated patterns found

**🎯 READY FOR PHASE 1**: 
- Core infrastructure is solid
- Main gap is version restore coordination
- Remote update routing needs enhancement
- Presence migration to Firestore is straightforward

---

## Phase 1: Firestore Real-Time Collaboration
- [ ] Refactor `services/document-service.ts` to ensure `subscribeToDocument` uses Firestore `onSnapshot` for all real-time updates
- [ ] Ensure `hooks/use-documents.ts` and `components/document-editor.tsx` subscribe to document changes via Firestore only
- [ ] Remove any legacy Yjs or Realtime Database content sync logic
- [ ] Route all remote Firestore updates through `EditorContentCoordinator.updateContent('remote', ...)`
- [ ] Add `type: 'remote'` to coordinator with appropriate priority
- [ ] Queue and merge remote updates after typing lock
- [ ] Add detailed logging for all remote update events and queueing

---

## Phase 2: Version Restore Safety
- [ ] Refactor version restore logic in `hooks/use-documents.ts` and `components/document-container.tsx` to route all restores through coordinator as `updateContent('version', ...)`
- [ ] Ensure version restore is queued if user is typing, and only applied after typing lock
- [ ] Add logging for version restore queueing, application, and conflicts
- [ ] Ensure UI reflects pending/applied version restores

---

## Phase 3: Conflict Resolution
- [ ] Implement/Enhance merge logic in `EditorContentCoordinator` for queued system/remote/version updates
- [ ] Ensure multiple queued updates (remote + version) are applied in correct order and merged safely
- [ ] Add logging and error handling for failed merges/conflicts

---

## Phase 4: Presence & Collaboration Metadata (Firestore-based)
- [ ] Refactor `services/collaboration-service.ts` to use Firestore for presence (`/documents/{docId}/presence/{userId}`)
- [ ] Update UI/hooks to display presence from Firestore snapshot data
- [ ] Update Firestore security rules for presence updates

---

## Phase 5: Documentation, Logging, & Security
- [ ] Update this checklist and `text-editor-robustness-rearchitecture.md` with all changes
- [ ] Add inline code comments and log statements for all new/changed logic
- [ ] Ensure all collaborative, remote, and version restore updates are logged with source, queue status, and timing
- [ ] Audit and update `firestore.rules` for collaborative updates and presence
- [ ] Test all flows in emulator and production environments

---

## Success Criteria
- [ ] All real-time collaboration and version control is Firestore snapshot-based
- [ ] No Yjs or Realtime Database content sync logic remains
- [ ] All updates (user, remote, version, AI, grammar, page) are coordinated and merged safely
- [ ] Presence is tracked via Firestore
- [ ] All changes are logged and documented
- [ ] No data loss, overwrite, or race conditions during concurrent editing 