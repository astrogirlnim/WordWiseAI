# Style & Readability Feature Checklist

## Phase 1: Backend & Data Model

- [ ] **Firestore:**
  - [ ] Add `styleSuggestions` subcollection under `documents`.
  - [ ] Set rules: creator can read/write, admin can delete.
  - [ ] Add composite index on `(documentId, createdAt desc)`.
- [ ] **Types:**
  - [ ] In `types/ai-features.ts`, add `"readability"` to `AISuggestion.type`.
- [ ] **Cloud Function (`generateStyleSuggestions`):**
  - [ ] Create a new callable function.
  - [ ] Input: `{ text: string, goals?: WritingGoals }`.
  - [ ] Prompt: engineer a prompt for `gpt-4o` to return style/readability suggestions as a JSON list. The prompt must explicitly forbid using hyphens.
  - [ ] Implement rate-limiting.
- [ ] **Service Layer:**
  - [ ] In `services/ai-service.ts`, add `generateStyleSuggestions` to call the new function.
  - [ ] Create `services/suggestion-service.ts` to handle CRUD operations for `styleSuggestions` in Firestore.

## Phase 2: Frontend Hooks & State

- [ ] **Data Hook (`hooks/use-style-suggestions.ts`):**
  - [ ] Create a hook to manage style suggestions.
  - [ ] Expose `suggestions`, `loading`, `error`.
  - [ ] Expose methods: `fetchSuggestions`, `applySuggestion`, `dismissSuggestion`.
  - [ ] Use `suggestion-service.ts` for Firestore communication.
  - [ ] Get `documentId` and `goals` from `use-documents` hook.

## Phase 3: UI Integration

- [ ] **Document Editor (`components/document-editor.tsx`):**
  - [ ] Integrate `use-style-suggestions`.
  - [ ] Call `fetchSuggestions` on document save or after a debounce period of user inactivity.
- [ ] **AI Sidebar (`components/ai-sidebar.tsx`):**
  - [ ] Add a new "Style" or "Readability" tab.
  - [ ] Render suggestions using the existing `AISuggestions` component.
- [ ] **AI Sidebar Toggle (`components/ai-sidebar-toggle.tsx`):**
  - [ ] Update the badge count to include new style suggestions.
- [ ] **Suggestion Card (`components/ai-suggestions.tsx`):**
  - [ ] (Optional) Enhance card to show confidence score or readability improvement.
  - [ ] Ensure empty state is handled correctly.
- [ ] **Accessibility:**
  - [ ] Add `aria-label` to all new interactive elements.
  - [ ] Consider a keyboard shortcut to toggle the new sidebar tab.

## Phase 4: Testing & Rollout

- [ ] **Testing:**
  - [ ] Unit test the Cloud Function prompt and output schema.
  - [ ] Unit test the `use-style-suggestions` hook for all states (loading, success, error).
  - [ ] Write an E2E test (Cypress) for the full user flow.
- [ ] **Analytics (`services/audit-service.ts`):**
  - [ ] Extend `AuditEvent` to log when style suggestions are applied or ignored.
- [ ] **Feature Flag:**
  - [ ] Add a `style_suggestions_enabled` flag in Firebase Remote Config.
  - [ ] Gate the entire feature with this flag.
- [ ] **Documentation:**
  - [ ] Write a brief internal document explaining the feature. 