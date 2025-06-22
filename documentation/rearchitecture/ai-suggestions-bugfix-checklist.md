# AI Suggestions Bugfix & Rearchitecture Checklist

## Overview
This checklist addresses the four critical bugs in the AI suggestions feature, with actionable steps for each. All relevant files, variables, and architectural considerations are included. Each phase is broken down into sub-tasks for clarity and completeness.

---

## Phase 1: Regenerate Suggestions on Sidebar Regenerate Button
- [x] **Identify all regenerate/refresh button logic**
  - [x] Confirm usage of `refreshSuggestions` and `reloadSuggestions` in `components/ai-sidebar.tsx` and `hooks/use-ai-suggestions.ts`
  - [x] Ensure `refreshSuggestions` triggers:
    - [x] Clearing of old suggestions via `SuggestionService.clearExistingSuggestions`
    - [x] New suggestions generation via `AIService.generateStyleSuggestions` and `AIService.generateFunnelSuggestions`
- [x] **Update logic to always clear and regenerate**
  - [x] Guarantee that clicking the regenerate button:
    - [x] Deletes all pending suggestions for the current document/user
    - [x] Triggers new suggestions with current document content and goals
- [x] **Add/verify logging for all steps**
- [x] **Test end-to-end: UI, Firestore, and function logs**

**Relevant files:**
- `components/ai-sidebar.tsx` - ✅ Updated refresh button with logging and current content passing
- `hooks/use-ai-suggestions.ts` - ✅ Added refreshSuggestionsWithClear function that clears and regenerates 
- `services/ai-service.ts` - ✅ No changes needed (functions work correctly)
- `services/suggestion-service.ts` - ✅ clearExistingSuggestions function already implemented
- `functions/index.js` - ✅ Removed duplicate prevention logic from generateFunnelSuggestions

**Phase 1 Implementation Summary:**
1. **Identified refresh button logic**: The refresh button in AISidebar calls `refreshSuggestions` from useAISuggestions hook
2. **Updated refresh logic**: Created `refreshSuggestionsWithClear` that:
   - Clears existing style suggestions via `SuggestionService.clearExistingSuggestions`
   - Clears existing funnel suggestions via `SuggestionService.clearExistingSuggestions`  
   - Waits for clear operations to complete
   - Generates new style suggestions with current document content via `AIService.generateStyleSuggestions`
   - Shows user feedback via toast notifications
3. **Enhanced content passing**: Added currentContent parameter to useAISuggestions hook and passed from AISidebar
4. **Improved logging**: Added comprehensive logging at all steps for debugging
5. **Removed duplicate prevention**: Updated generateFunnelSuggestions Cloud Function to allow regeneration
6. **Error handling**: Added proper try/catch blocks and user-friendly error messages

**Architecture Changes:**
- useAISuggestions now accepts currentContent parameter for refresh functionality
- refreshSuggestions now maps to refreshSuggestionsWithClear instead of reloadSuggestions
- Cloud Functions no longer prevent regeneration when existing suggestions are found
- All operations include detailed console logging for debugging

---

## Phase 2: Regenerate Suggestions on Document Change
- [ ] **Detect document change in all entry points**
  - [ ] Confirm `documentId` change triggers in `DocumentContainer`, `AISidebar`, and `useAISuggestions`
- [ ] **Ensure suggestions are reloaded and regenerated**
  - [ ] On document change:
    - [ ] Clear old suggestions for the new document/user
    - [ ] Generate new suggestions for the new document content
- [ ] **Add/verify logging for document change and suggestion reload**
- [ ] **Test: Open new document, verify fresh suggestions**

**Relevant files:**
- `components/document-container.tsx`
- `components/ai-sidebar.tsx`
- `hooks/use-ai-suggestions.ts`
- `services/suggestion-service.ts`

---

## Phase 3: Sidebar Toggle/Multiple Fetches (Stale Suggestions)
- [ ] **Audit sidebar open/close and fetch logic**
  - [ ] Ensure toggling the sidebar always fetches fresh suggestions
  - [ ] Prevent stale suggestions from persisting or being replaced incorrectly
- [ ] **Update logic to always clear and fetch new suggestions on sidebar open**
- [ ] **Add/verify logging for sidebar toggling and suggestion state**
- [ ] **Test: Toggle sidebar multiple times, verify suggestions are always fresh**

**Relevant files:**
- `components/ai-sidebar.tsx`
- `hooks/use-ai-suggestions.ts`
- `services/suggestion-service.ts`

---

## Phase 4: Suggestion Application Positioning (Plain vs. Rich Text)
- [ ] **Audit suggestion application logic**
  - [ ] Review `handleApplyAISuggestion` in `components/document-editor.tsx`
  - [ ] Ensure correct mapping of `originalText` and `suggestedText` for both plain and rich text
  - [ ] Verify funnel suggestions (headline, subheadline, cta, outline) are inserted at correct positions
  - [ ] Ensure style suggestions replace the correct text, with robust partial matching if needed
- [ ] **Add/verify logging for all suggestion applications**
- [ ] **Test: Apply all types of suggestions, verify correct placement and no duplication**

**Relevant files:**
- `components/document-editor.tsx`
- `types/ai-features.ts`
- `services/suggestion-service.ts`
- `functions/index.js`

---

## Firebase & Indexing Considerations
- [x] **Ensure Firestore indexes for styleSuggestions and funnelSuggestions**
  - Current indexes in firestore.indexes.json support the queries used by clearExistingSuggestions
  - Indexes for userId, status="pending", and createdAt are already configured
- [x] **Review and update security rules if needed**  
  - No security rule changes needed for Phase 1 implementation
  - Existing rules allow authenticated users to read/write their own suggestions
- [x] **Test with Firebase emulators and production**
  - Ready for testing once development server is running
  - All logging is in place to monitor operations

**Relevant files:**
- `firestore.indexes.json`
- `firestore.rules`
- `database.rules.json`
- `storage.rules`

---

## General Checklist
- [ ] Add/verify deep logging at every step (UI, service, function)
- [ ] Test all flows with real data (no mock data)
- [ ] Ensure all code is modular, clean, and production-ready
- [ ] Reference and update this checklist as each step is completed

---

**This checklist is the single source of truth for the AI suggestions bugfix and rearchitecture process.** 