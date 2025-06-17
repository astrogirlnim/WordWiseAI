### PR Summary: Refactor Data Layer to Firestore & Implement Real-Time Collaboration

This pull request resolves critical permission errors and implements the foundational architecture for real-time, collaborative document editing. The changes can be broken down into two main efforts: a data-layer migration from Realtime Database to Firestore, and the integration of `Yjs` for multi-user editing.

#### 1. Addresses "Permission Denied" Errors by Migrating to Firestore

**Problem:** The application was encountering "Permission Denied" errors when creating, reading, and updating documents. The root cause was an incorrect architecture: document data was being stored in the Firebase Realtime Database, which is not ideal for this use case, and the corresponding security rules were misconfigured.

**Solution:**
*   **Data Layer Refactor:** The entire document persistence layer was migrated from the Realtime Database to **Cloud Firestore**. Firestore's powerful querying capabilities and document-oriented structure make it a much better fit for storing structured document data.
*   **Updated `DocumentService`:** The `services/document-service.ts` was completely rewritten to use the Firestore SDK. All methods (`create`, `update`, `get`, `delete`) now interact with a top-level `documents` collection in Firestore.
*   **Corrected Security Rules:**
    *   `firestore.rules`: New, robust rules were written to secure the `documents` collection, ensuring users can only access and modify their own data.
    *   `database.rules.json`: The now-obsolete rules for document storage were removed, cleaning up the configuration to be used solely for collaboration features going forward.
*   **Hook Correction:** A subsequent permission error on updates was traced to the `hooks/use-documents.ts` hook calling the refactored service with an outdated function signature. This was corrected.

#### 2. Implements Real-Time Collaboration with Yjs

**Problem:** While user presence was partially implemented, the core functionality for synchronizing document content between multiple users in real time was missing.

**Solution:**
*   **Yjs Integration:** The `yjs` library, a robust CRDT implementation, was introduced to manage collaborative state.
*   **`useYjs` Hook:** A new `hooks/use-yjs.ts` hook was created to encapsulate the collaboration logic. It initializes a `Y.Doc` (the shared document) and connects clients using `y-webrtc` for efficient, peer-to-peer communication.
*   **Collaborative Editor:** The `components/document-editor.tsx` was refactored to use the `useYjs` hook. The editor's content is now bound to a `Y.Text` shared type, meaning any edits made by one user are automatically and efficiently synchronized with all other connected clients in the same session.

#### Project Management

*   The `sales-funnel-writing-assistant-checklist.md` has been updated to reflect the completion of these critical **Phase 2 (Data Layer)** tasks.

These changes establish a stable, scalable, and correct architecture for both data persistence and real-time collaboration, resolving the critical bugs and unblocking future feature development. 