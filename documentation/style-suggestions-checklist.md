# Style & Readability Feature Checklist

## Current Status ✏️

| Area | Implemented? | Notes |
|------|--------------|-------|
| Cloud Function (`generateStyleSuggestions`) | ✅ Exists | Backend function exists, but UI integration has been removed. |
| Firestore Sub-collection (`styleSuggestions`) | ✅ Referenced | Function writes to it, but no longer surfaced in the UI. |
| Firestore Rules | ✅ Entry exists | Uses expensive `get()` call; optimise condition |
| Index Deployment | ❓ | `firestore.indexes.json` updated but **may not be deployed** to all environments |
| Service Layer (`suggestion-service.ts`) | ❌ Missing | CRUD helpers not implemented |
| React Hook (`use-style-suggestions.ts`) | ❌ Missing | No state management for style suggestions |
| UI Integration | ❌ Removed | The AI sidebar now only supports funnel suggestions. Style suggestions are no longer shown in the UI. |
| Tests (Unit / E2E) | ❌ Missing | No test coverage yet |

### Relevant Files & Status 📂

| File | Status | Purpose |
|------|--------|---------|
| `functions/index.js` | **Implemented** | Contains `generateStyleSuggestions` callable Cloud Function |
| `services/ai-service.ts` | **Implemented (partial)** | Front-end helper that triggers the Cloud Function |
| `types/ai-features.ts` | **Implemented** | `AISuggestion` already includes `readability` type ✔️ |
| `firestore.rules` | **Implemented (needs optimisation)** | Adds `styleSuggestions` sub-collection rule |
| `firestore.indexes.json` | **Exists (not deployed)** | Defines composite index on `(documentId, createdAt)` |
| `app/globals.css` | **Implemented** | Gold underline class for `.grammar-error.style` |
| `components/ai-suggestions.tsx` | **Updated** | Now only renders funnel suggestions. Style suggestions UI removed. |
| *(missing)* `services/suggestion-service.ts` | **Not created** | CRUD operations for suggestions |
| *(missing)* `hooks/use-style-suggestions.ts` | **Not created** | React hook for fetching & applying suggestions |

---

## Sidebar UI Refactor

- The AI sidebar now only supports funnel copy suggestions.
- All style suggestion UI, tabs, and related logic have been removed.
- The workflow for style suggestions is no longer available in the sidebar.
- The funnel copy workflow is now the only supported AI suggestion workflow in the sidebar.

### Critical Problems to Address  ⚠️
1. **Unvalidated AI Response** – Cloud Function spreads unknown properties from OpenAI. Add schema validation & sanitisation before writing to Firestore.
2. **Security-Rule Cost & Race** – `get()` call inside rules may fail during batch writes. Either duplicate `ownerId` on suggestion docs or move check to Cloud Function and simplify rule.
3. **Missing Front-end Surface** – Without service, hook, and UI, suggestions cannot be displayed or applied, blocking end-to-end flow.
4. **Index Deployment Gap** – Ensure `styleSuggestions` composite index is deployed to emulators & prod.
5. **Placeholder Fields** – Replace hard-coded `position` and `confidence` placeholders with real values or omit until available.

---

## Phase 1: Backend & Data Model (updated)

- [x] **Firestore:**
  - [x] Add `styleSuggestions` subcollection under `documents` *(Cloud Function already writes to this path)*.
  - [ ] Optimise security rule to avoid `get()` – e.g. duplicate `ownerId` in suggestion docs and use `request.resource.data.ownerId == request.auth.uid`.
  - [ ] Add composite index on `(documentId, createdAt desc)` **and deploy**.
- [x] **Types:**
  - [x] `"readability"` already present in `AISuggestion.type`.
- [ ] **Cloud Function (`generateStyleSuggestions`)** – enhancements:
  - [ ] Validate OpenAI JSON schema (use `zod` or manual checks).
  - [ ] Strip/rename unknown fields before Firestore write.
  - [ ] Replace placeholder `position`/`confidence` or make them optional.
  - [ ] Improve error reporting – surface Firestore errors not just generic 500.
- [ ] **Service Layer:**
  - [ ] Create `services/suggestion-service.ts` for CRUD operations on `/documents/{id}/styleSuggestions`.
  - [ ] Extend `services/ai-service.ts` with retry/back-off on function errors.

## Phase 2: Front-end Hooks & State (updated)

- [ ] **Hook (`hooks/use-style-suggestions.ts`):**
  - [ ] Manage Firestore subscription to suggestion docs.
  - [ ] Expose mutations `applySuggestion`, `dismissSuggestion` that update Firestore & editor content.
  - [ ] Optimistic UI + Toast feedback.
  - [ ] Respect feature flag & user permissions.

## Phase 3: UI Integration (updated)

- [ ] **AI Sidebar:**
  - [ ] Add "Style" tab with count badge.
  - [ ] Render list via existing `AISuggestions` component.
- [ ] **Document Editor:**
  - [ ] Highlight style suggestions similar to grammar errors (gold underline class already in CSS).
  - [ ] Provide apply/dismiss actions wired to hook.
- [ ] **Accessibility & UX:**
  - [ ] Keyboard shortcut to toggle "Style" tab.
  - [ ] Announce suggestion count changes via ARIA-live region.

## Phase 4: Testing & Roll-out (updated)

- [ ] **Unit Tests:**
  - [ ] Validate Cloud Function schema enforcement.
  - [ ] Hook state transitions.
- [ ] **Security-Rules Tests:**
  - [ ] Emulator tests ensuring only owner can CRUD style suggestions.
- [ ] **Performance Tests:**
  - [ ] Measure Cloud Function latency & Firestore costs.
- [ ] **E2E Tests:**
  - [ ] Cypress flow covering write → read → apply suggestion.

## Phase 5: Analytics & Flags (unchanged)

- [ ] **Analytics (`services/audit-service.ts`):**
  - [ ] Extend `AuditEvent` to log when style suggestions are applied or ignored.
- [ ] **Feature Flag:**
  - [ ] Add a `style_suggestions_enabled` flag in Firebase Remote Config.
  - [ ] Gate the entire feature with this flag.
- [ ] **Documentation:**
  - [ ] Write a brief internal document explaining the feature.

---

> **Next milestone**: Finalise Phase 1 (rule optimisation & validation) and scaffold service layer to unblock front-end work. 