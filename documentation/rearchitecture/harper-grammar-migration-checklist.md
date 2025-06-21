# Harper.js Grammar Migration Checklist

## Codebase Status & File Inventory

**Current Real-Time Grammar Check System:**
- **Editor:** TipTap-based, custom extensions for grammar error decoration
- **Grammar Check:** Firebase Cloud Functions (OpenAI), chunking, mapping, and error deduplication
- **Key Files:**
  - `components/document-editor.tsx` (main editor, grammar integration)
  - `components/tiptap-grammar-extension.ts` (decorations)
  - `hooks/use-grammar-checker.ts` (grammar check logic)
  - `services/ai-service.ts` (API layer)
  - `utils/text-chunker.ts` (chunking/mapping)
  - `functions/index.js` (Cloud Function)
  - `types/grammar.ts` (error types)
  - `app/globals.css` (styles)
- **No Harper.js or WASM-based grammar checker present.**
- **No Harper.js-related documentation or dependencies.**

---

## PHASE 0: Diagnosis & Verification
- [ ] Audit all grammar-related files and variables:
  - [ ] `components/document-editor.tsx`
  - [ ] `components/tiptap-grammar-extension.ts`
  - [ ] `hooks/use-grammar-checker.ts`
  - [ ] `services/ai-service.ts`
  - [ ] `utils/text-chunker.ts`
  - [ ] `functions/index.js`
  - [ ] `types/grammar.ts`
  - [ ] `app/globals.css`
- [ ] List all grammar error types, chunking logic, and API call points
- [ ] Document all grammar check triggers and decoration flows

---

## PHASE 1: Remove Legacy AI/Cloud Function Grammar Check
- [ ] Remove OpenAI/Firebase grammar check calls from `services/ai-service.ts`
- [ ] Remove chunking logic from `utils/text-chunker.ts` and `hooks/use-grammar-checker.ts`
- [ ] Remove grammar check Cloud Function from `functions/index.js`
- [ ] Remove rate limiting, error mapping, and chunk progress logic

---

## PHASE 2: Research & Install Harper.js
- [ ] Research Harper.js usage for browser/React/TypeScript:
  - [ ] Confirm Harper.js WASM/browser support ([Harper GitHub](https://github.com/automattic/harper))
  - [ ] Review Harper.js API for grammar error output format
- [ ] Install Harper.js:
  - [ ] Add Harper.js/WASM as a dependency (npm or direct import)
  - [ ] Example: `npm install @harperdb/harperdb` (or per official docs)
  - [ ] If WASM, ensure correct loader/config for Next.js/React
- [ ] Create a wrapper utility for Harper.js grammar check (e.g., `utils/harper-wrapper.ts`)

---

## PHASE 3: Integrate Harper.js in Grammar Flow
- [ ] Update `hooks/use-grammar-checker.ts` to use Harper.js for grammar checking
- [ ] Refactor error state to match Harper.js output (positions, types, suggestions)
- [ ] Remove all chunking, mapping, and deduplication logic

---

## PHASE 4: Refactor Editor Decorations
- [ ] Update `components/tiptap-grammar-extension.ts` to use Harper.js error format
- [ ] Ensure error highlights, tooltips, and suggestions work as before
- [ ] Remove any chunk/position mapping logic that is no longer needed

---

## PHASE 5: UI/UX & Performance
- [ ] Add logs at every step of the grammar check and decoration process
- [ ] Ensure grammar checks are debounced and do not block typing
- [ ] Test error highlighting for accuracy and responsiveness
- [ ] Update styles in `app/globals.css` if needed

---

## PHASE 6: Fallbacks & Feature Flags
- [ ] Implement a feature flag to toggle between Harper.js and the old AI service (for A/B testing and rollback)
- [ ] Keep the old AI service as a fallback during rollout

---

## PHASE 7: Documentation & Testing
- [ ] Update this checklist and all related documentation
- [ ] Add/Update documentation in `docs/` to describe the new architecture
- [ ] Test on all supported browsers (WASM compatibility)
- [ ] Test with large and small documents for performance and accuracy

---

## PHASE 8: Firebase/Infra Cleanup
- [ ] Remove unused Firebase Cloud Functions and related environment variables
- [ ] Update deployment scripts and CI/CD to remove AI grammar check dependencies
- [ ] Ensure no sensitive data is sent to external APIs

---

## PHASE 9: Gradual Rollout & Monitoring
- [ ] Enable Harper.js for a subset of users (feature flag)
- [ ] Monitor performance, error rates, and user feedback
- [ ] Gradually increase rollout as confidence grows
- [ ] Remove old AI service and chunking code once Harper.js is fully validated

---

## Harper.js Install & Usage (Summary)
- **Install:**
  - `npm install @harperdb/harperdb` (or per [official docs](https://github.com/automattic/harper))
  - For WASM: follow Harper.js/harper-wasm browser usage instructions
- **Usage:**
  - Import Harper.js or WASM module in your utility
  - Call grammar check function with plain text
  - Receive array of error objects (positions, types, suggestions)
  - Map directly to TipTap decorations

---

**This checklist is the single source of truth for the Harper.js migration. All steps must be checked off before rollout is considered complete.** 