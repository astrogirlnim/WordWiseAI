# Version Deletion Feature – TODO

- [ ] Codebase audit
    - [ ] Verify `components/version-history-sidebar.tsx` renders versions list
    - [ ] Verify hooks `hooks/use-document-versions.ts` and `hooks/use-documents.ts`
    - [ ] Verify service `services/version-service.ts`
    - [ ] Confirm Firestore rules allow writes to `documents/{docId}/versions/{versionId}`

- [ ] Key variables & props
    - [ ] `documentId` – active document identifier
    - [ ] `versionId` – individual version identifier
    - [ ] `versions` (`Version[]`) – list shown in sidebar
    - [ ] `VersionService.deleteVersion(documentId, versionId)` – new helper
    - [ ] `reloadVersions()` – existing refresh callback
    - [ ] `onDelete(versionId)` – new sidebar prop / callback

- [ ] Backend / service layer
    - [ ] Add `deleteVersion` in `services/version-service.ts` (Firestore `deleteDoc`)
    - [ ] Handle errors with try-catch and console logs

- [ ] Hook updates
    - [ ] Expose `deleteVersion` via `hooks/use-document-versions.ts` or callback inside container

- [ ] UI component changes
    - [ ] Extend `VersionHistorySidebar` with `onDelete(versionId)` prop
    - [ ] Add "Delete" button next to "View" & "Restore"
    - [ ] (Optional) Add confirmation dialog (`alert-dialog`)

- [ ] Container logic (`components/document-container.tsx`)
    - [ ] Implement `handleDeleteVersion(versionId)`
    - [ ] Call service, await `reloadVersions()`, show toast
    - [ ] Pass handler to `VersionHistorySidebar`

- [ ] Audit & toast logging
    - [ ] Log optional `AuditEvent.VERSION_DELETE`
    - [ ] Show success / error toast messages

- [ ] Manual verification
    - [ ] Delete a version → list refreshes, toast displays
    - [ ] Page refresh still reflects deletion
    - [ ] Unauthorized delete attempt fails as expected

- [ ] Cleanup & commit
    - [ ] Run linter and build
    - [ ] Commit message: `feat: enable deleting document versions` 