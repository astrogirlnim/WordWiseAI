# Delete Document Feature – Implementation Checklist

- [x] Backend / data  
  - [x] Verify `DocumentService.deleteDocument` works (already present).  
  - [x] Verify `useDocuments.deleteDocument` calls the service & updates local state (already present).  
  - [x] Inside `useDocuments.deleteDocument` add `AuditService.logEvent(AuditEvent.DOCUMENT_DELETE, user.uid, { documentId }).`

- [x] Hook API surface  
  - [x] Ensure `useDocuments` exports `deleteDocument` (already true) and its type.

- [x] UI – `EnhancedDocumentList`  
  - [x] Add new prop `onDeleteDocument?: (id: string) => void`.  
  - [x] Render `Trash` icon/button per row, with `AlertDialog` confirmation.  
  - [x] Call `onDeleteDocument(id)` on confirm with `event.stopPropagation()`.  
  - [x] Keyboard focus & `aria-label`.

- [x] Bridge – `NavigationBar`  
  - [x] Extend props with `onDeleteDocument`.  
  - [x] Pass handler to desktop & mobile `EnhancedDocumentList`.

- [x] Page logic – `DocumentContainer`  
  - [x] Implement `handleDeleteDocument`.  
  - [x] If deleted doc active, switch or clear current doc.  
  - [x] Show toast success/error.

- [x] Styling & UX  
  - [x] Hide delete button until hover on desktop; always visible on mobile.  
  - [x] Disable delete while `loading`; show spinner.

- [x] Security  
  - [x] Firestore rule already allows owner delete.

- [x] Manual QA  
  - [x] Deleting non-active doc removes it & logs audit.  
  - [x] Deleting active doc updates view gracefully.  
  - [x] Error path shows toast.

- [ ] Version control  
  - [ ] `git add -A` & `git commit -m "feat: allow users to delete recent documents"` 