# Real-Time Grammar Check & Text Editor Refactor Plan

---

## Overview
This document summarizes the current state of the real-time grammar check and text editor in the WordWiseAI codebase, identifies all related files and variables, and provides a detailed plan to investigate and refactor the following issues:

- **A. Text Editor Usability**: Users experience laggy typing and issues with copy-paste (styling relics).
- **B. Real-Time Grammar Service**: Inefficient, error-prone, and overly complex grammar checking.
- **C. Intertwined Architecture**: Tight coupling between editor, grammar, and suggestion systems.

Each section below includes:
- A summary of the current implementation
- All related files, hooks, and services
- Key variables and architectural concerns
- A step-by-step investigation and refactor checklist

---

## A. Text Editor Usability Issues

### 1. **Symptoms**
- Typing is not always smooth (lag, flashing, missed spaces)
- Copy-pasted text sometimes retains unwanted formatting

### 2. **Key Files & Components**
- `components/document-editor.tsx` (main editor logic, TipTap config)
- `components/tiptap-grammar-extension.ts` (decorations)
- `hooks/use-grammar-checker.ts` (grammar integration)
- `utils/document-utils.ts` (text/word count)
- `app/globals.css` (editor and error styling)
- `documentation/bugfixes/document-sharing-implementation-bugfix-plan.md` (historical context)

### 3. **Key Variables & Extensions**
- `PlainTextPasteExtension` (TipTap/ProseMirror plugin for paste events)
- `isUpdatingContentRef`, `lastContentUpdateRef` (debounce/recursion guards)
- `PAGE_SIZE_CHARS` (pagination)
- `fullContentHtml`, `pageContent`, `currentPage`, `editor` (state)

### 4. **Architectural Concerns**
- Editor state is paginated and must sync with full document state
- Paste events must always strip formatting
- Multiple `useEffect` hooks coordinate content, autosave, and error sync
- Debouncing and update flags prevent race conditions

### 5. **Investigation & Refactor Checklist**
- [ ] **Review all uses of `PlainTextPasteExtension`**: Ensure all paste events are intercepted and only plain text is inserted
- [ ] **Audit all content update flows**: Confirm debounce logic and update flags prevent flashing/lag
- [ ] **Test copy-paste with various sources**: Validate no formatting is retained
- [ ] **Trace editor state sync**: Ensure `fullContentHtml` and `pageContent` are always in sync
- [ ] **Check pagination logic**: Confirm page changes do not cause content loss or duplication
- [ ] **Add/verify logging**: Ensure all update flows are logged for debugging
- [ ] **Document all variables and flows**

---

## B. Real-Time Grammar Service Issues

### 1. **Symptoms**
- Grammar checks are slow, sometimes fail, or do not render errors
- Rate limiting errors (429) from backend
- Decorations sometimes do not appear

### 2. **Key Files & Components**
- `hooks/use-grammar-checker.ts` (core logic, chunking, throttling)
- `services/ai-service.ts` (API calls to Firebase Functions)
- `functions/index.js` (Firebase Cloud Function: `checkGrammar`)
- `components/tiptap-grammar-extension.ts` (ProseMirror plugin for error decorations)
- `components/document-editor.tsx` (integration, error dispatch)
- `types/grammar.ts` (error types)
- `utils/text-chunker.ts` (chunking logic)
- `documentation/real-time-grammar-performance-optimization-checklist.md` (detailed status)
- `documentation/phase-4-feature-1-real-time-grammar-spelling-checklist.md` (feature breakdown)

### 3. **Key Variables & Patterns**
- `errors`, `setErrors`, `chunkProgress`, `isChecking` (grammar state)
- `checkGrammar`, `checkGrammarImmediately`, `checkFullDocument` (main triggers)
- `TextChunker`, `processChunksInParallel`, `processChunk` (chunking/processing)
- `activeProcessingSession`, `abortController` (session management)
- `THROTTLE_INTERVAL`, `MAX_CONCURRENT_CHUNKS`, `CHUNK_THRESHOLD` (constants)
- `GrammarExtension` (ProseMirror plugin)

### 4. **Architectural Concerns**
- Grammar checks are paginated (only visible page is checked by default)
- Chunking is used for large documents, but session/cancellation logic is complex
- Rate limiting is enforced both client and server side
- Error positions must be mapped between chunk, page, and document
- Decorations are dispatched via ProseMirror transactions
- Logging is extensive but may need further granularity

### 5. **Investigation & Refactor Checklist**
- [ ] **Trace all grammar check triggers**: Ensure debounce/throttle logic is correct and not causing excess calls
- [ ] **Audit chunking and session management**: Confirm only one session runs at a time, and all background queues are cancelled on new edits
- [ ] **Test rate limiting**: Simulate rapid edits and confirm backend does not return 429s
- [ ] **Trace error flow**: From `useGrammarChecker` to `DocumentEditor` to `GrammarExtension` to ensure errors are always dispatched and rendered
- [ ] **Validate error position mapping**: Confirm errors are always aligned with the correct text, especially across page boundaries
- [ ] **Test decorations**: Ensure all error types are rendered and context menus work
- [ ] **Review and optimize logging**: Add logs for all async flows and error cases
- [ ] **Document all variables and flows**

---

## C. Intertwined Architecture & General Concerns

### 1. **Symptoms**
- Difficult to reason about the flow of data between editor, grammar, and AI suggestions
- Tight coupling between UI, grammar, and backend logic

### 2. **Key Files & Components**
- All files listed above, plus:
  - `components/document-container.tsx` (parent container)
  - `services/document-service.ts`, `services/suggestion-service.ts` (document/AI logic)
  - `hooks/use-ai-suggestions.ts` (AI suggestions)
  - `components/ai-suggestions.tsx` (UI)

### 3. **Architectural Concerns**
- Many hooks and services are interdependent
- Autosave/versioning, grammar, and suggestions all update document state
- UI must remain responsive despite async backend calls
- Logging and error handling must be consistent

### 4. **Investigation & Refactor Checklist**
- [ ] **Map all data flows**: Diagram how document state, grammar errors, and suggestions interact
- [ ] **Identify tight couplings**: Propose abstractions or boundaries between editor, grammar, and AI
- [ ] **Audit all hooks/services for side effects**
- [ ] **Review autosave/versioning logic**: Ensure it is robust to async errors and race conditions
- [ ] **Test UI responsiveness under load**
- [ ] **Document all findings and proposed changes**

---

## Appendix: Related Documentation & References
- `documentation/real-time-grammar-performance-optimization-checklist.md`
- `documentation/phase-4-feature-1-real-time-grammar-spelling-checklist.md`
- `documentation/bugfixes/document-sharing-implementation-bugfix-plan.md`
- `documentation/pr-fix-grammar-decorator-positioning.md`
- `README.md` (project structure, tech stack)

---

**Next Steps:**
- Complete all checklists above, documenting findings and changes
- Propose concrete refactor steps for each area
- Review with team before implementation 