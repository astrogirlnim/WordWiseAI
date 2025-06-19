# PR Plan: Phase 3 – Team Review & Commenting

## Overview
Implements a robust, real-time team commenting and review system for collaborative document editing. Enables users to add, view, resolve, and discuss comments anchored to text ranges, with real-time sync and access control. All features are modular, scalable, and production-ready, with extensive logging and type safety.

---

## 1. Architecture & File Status

### Data Model
- **types/comment.ts**: Defines `Comment`, `CommentThread`, `CommentStats` interfaces. Status: ✅ Complete, ready for use.
- **types/document.ts**: Document structure includes access control and workflow fields. Status: ✅ Complete.

### Backend/Service Layer
- **services/comment-service.ts**: (Stub) To implement Firestore CRUD for comments, real-time sync, resolve/unresolve, and thread management. Status: ⬜️ Needs full implementation.
- **services/collaboration-service.ts**: Used for presence, not directly for comments. Status: ✅ Complete.

### Hooks
- **hooks/use-comments.ts**: (Stub) To implement real-time comment state, add/resolve actions, and UI integration. Status: ⬜️ Needs full implementation.

### UI Components
- **components/comments-sidebar.tsx**: (Stub) Sidebar for displaying and managing comments. Status: ⬜️ Needs full implementation.
- **components/document-editor.tsx**: Main editor; will need integration for inline comment anchors and context menus. Status: ⬜️ Needs integration.
- **components/document-container.tsx**: Orchestrates editor and sidebars; will need to pass comment state and handlers. Status: ⬜️ Needs integration.

### Security
- **firestore.rules**: Must be updated to allow per-document comment CRUD for authorized users. Status: ⬜️ Needs update for comments subcollection.

---

## 2. Implementation Phases & Checklist

### Phase 0: Diagnosis & Verification
- [ ] Review all comment-related types, stubs, and UI for consistency
- [ ] Verify no duplicate or conflicting comment logic exists
- [ ] Confirm Firestore structure for `/documents/{docId}/comments` is not in use or is safe to extend
- [ ] Audit logging and error handling for all comment flows

### Phase 1: Firestore Comment Collection
- [ ] Define `/documents/{docId}/comments` subcollection schema
- [ ] Implement Firestore rules for comment CRUD (owner, editor, commenter roles)
- [ ] Add migration/cleanup script if legacy data exists

### Phase 2: Comment Service & Hook
- [ ] Implement `services/comment-service.ts` for add, update, resolve, delete, and real-time sync
- [ ] Implement `hooks/use-comments.ts` for real-time state, add/resolve actions, and error handling
- [ ] Add extensive logging for all service/hook actions

### Phase 3: UI Integration
- [ ] Implement `components/comments-sidebar.tsx` to display, add, and resolve comments
- [ ] Integrate comment thread anchors and context menus in `components/document-editor.tsx`
- [ ] Pass comment state/handlers via `components/document-container.tsx`
- [ ] Add inline comment indicators and selection logic
- [ ] Ensure real-time updates and optimistic UI

### Phase 4: Access Control & Security
- [ ] Update `firestore.rules` for comment subcollection (role-based access)
- [ ] Add UI/UX for permission errors and unauthorized actions
- [ ] Test with all user roles (owner, editor, commenter, viewer)

### Phase 5: Diagnosis & Verification (Post-Implementation)
- [ ] Test end-to-end: add, view, resolve, and delete comments
- [ ] Verify real-time sync and UI updates
- [ ] Audit logs for all comment actions
- [ ] Confirm no duplicate or orphaned comments/threads
- [ ] Review code for modularity, logging, and type safety

---

## 3. File/Type Reference & Status
- **types/comment.ts**: ✅ Complete
- **services/comment-service.ts**: ⬜️ Stub, needs full implementation
- **hooks/use-comments.ts**: ⬜️ Stub, needs full implementation
- **components/comments-sidebar.tsx**: ⬜️ Stub, needs full implementation
- **components/document-editor.tsx**: ⬜️ Needs integration
- **components/document-container.tsx**: ⬜️ Needs integration
- **firestore.rules**: ⬜️ Needs update for comments

---

## 4. Next Steps
- [ ] Complete all checklist items above, in order
- [ ] Add/verify logging for all comment flows
- [ ] Ensure all features are fully functional with real data (no mock data)
- [ ] Update this document as phases are completed

---

## 5. Notes
- All code must be modular, well-logged, and production-ready
- No duplicate files or logic—edit existing files only
- All checklist items must be completed before marking this phase as done 