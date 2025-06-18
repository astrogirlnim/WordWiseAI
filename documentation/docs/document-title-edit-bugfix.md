# 🐞 Document Title Editing Bug: Diagnosis & Fix Plan

## Overview
This document provides a step-by-step, checklist-driven plan to diagnose and fix the bug where the document title cannot be edited (cursor flashes, input is unresponsive). The plan includes codebase familiarization, a summary of the root cause, a list of all relevant files, and a phased, actionable bugfix strategy.

---

## Phase 0: Familiarize with Codebase & Bug Context

- [x] Review the following files for document title logic and state management:
  - [x] `components/document-editor.tsx` (title input, local state, effect logic)  
  - [x] `components/document-container.tsx` (passing of `initialDocument` prop, document switching)
  - [x] `hooks/use-documents.ts` (document fetching, updating, and state)
  - [x] `services/document-service.ts` (backend document update logic)
- [x] Understand how `initialDocument` is constructed and passed to `DocumentEditor`.
- [x] Identify how and when the title is updated, saved, and re-fetched.
- [x] Review any related UI components that could trigger document switching or re-renders (e.g., `EnhancedDocumentList`, `NavigationBar`).

---

## Phase 1: Diagnose & Prevent Title Reset Loop

- [x] **Analyze the bug:**
  - [x] Confirm that the `useEffect` in `DocumentEditor` is causing the title to reset on every keystroke due to changing `initialDocument.title` reference.
  - [x] Verify that the effect's dependency array includes both `initialDocument.title` and `title`, creating a feedback loop.
- [x] **Refactor the effect:**
  - [x] Change the effect to only update local `title` state when the document ID changes (i.e., a new document is loaded).
  - [x] Use `documentId` as a dependency instead of `initialDocument.title`.
- [x] **Memoize `initialDocument` in `DocumentContainer`:**
  - [x] Use `useMemo` to ensure the `initialDocument` object reference only changes when the actual document changes.

---

## Phase 2: Ensure UX & Data Consistency

- [x] **Title Save on Blur:**
  - [x] Confirm that the `onBlur` event on the title input triggers a save with the latest title.
- [x] **Debounce Title Save (Optional):**
  - [x] Note: Title saves are already debounced via `useAutoSave` hook in DocumentContainer with 2000ms delay.
- [x] **Test Scenarios:**
  - [x] User can edit the title without interruption or reset.
  - [x] Title persists after reload and navigation.
  - [x] No duplicate or lost updates occur.

---

## Phase 3: Code Quality, Logging & Documentation

- [x] **Add Console Logs:**
  - [x] Log when the title is set from props.
  - [x] Log when the title is changed by the user.
  - [x] Log when the title is saved to the backend.
- [x] **Comment the Fix:**
  - [x] Add comments explaining why the effect only runs on document ID change and not on every prop update.

---

## Phase 4: Regression & Edge Case Testing

- [x] **Switching Between Documents:**
  - [x] Ensure switching documents updates the title field correctly and does not reset during editing.
- [x] **New Document Creation:**
  - [x] Ensure the title input is editable for new documents.
- [x] **Collaboration/Realtime Updates:**
  - [x] If another user changes the title, ensure the UI updates only when appropriate and does not interrupt local editing.

---

## Relevant Files

- `components/document-editor.tsx` — Title input, local state, effect logic
- `components/document-container.tsx` — Passing of `initialDocument`, document switching
- `hooks/use-documents.ts` — Document fetching, updating, and state
- `services/document-service.ts` — Backend document update logic
- (Related UI) `components/enhanced-document-list.tsx`, `components/navigation-bar.tsx`

---

## Root Cause Summary
- The title input is uneditable because the local `title` state in `DocumentEditor` is reset on every keystroke due to a `useEffect` that depends on `initialDocument.title` (which changes reference on every parent render). This creates a feedback loop, making the input unusable.

---

> **Follow this checklist to ensure a robust, user-friendly fix for the document title editing bug.** 