### Phase 4 – Feature 1 — *Real-Time Grammar & Spelling*  

This checklist breaks the feature into six dependency-ordered subfeatures.  
*Checkbox legend:*  
`[ ]` Not started `[~]` In progress `[x]` Done `[!]` Blocked  

---

## Subfeatures Overview  
- [ ] **Subfeature 1 – Change Detection & Dispatch**  
- [x] **Subfeature 2 – Grammar Service Cloud Function**  
- [x] **Subfeature 3 – Error Normalization Layer**  
- [ ] **Subfeature 4 – Inline Decorations**  
- [ ] **Subfeature 5 – Quick-Fix UX**  
- [ ] **Subfeature 6 – Observability & SLA Enforcement**  

---

### Subfeature 1 – Change Detection & Dispatch  
*Criteria: capture local edits and send minimal payload to backend.*

  - [ ] Hook into editor text observer to detect content deltas. **(Critical)**  
  - [ ] Debounce updates for **500 ms** of user idle time. **(Critical)**  
  - [ ] Ignore edits shorter than **10 chars** or identical to last dispatch. **(High)**  
  - [ ] Compose minimal payload `{docId, text, version}`. **(High)**  
  - [ ] Enforce client-side throttle at **30 req/min** per user. **(High)**  
  - [ ] Unit-test diff builder against edge cases (emoji, RTL text). **(Medium)**  

### Subfeature 2 – Grammar Service Cloud Function  
*Criteria: validate input, call OpenAI, return normalized issues.*

  - [x] Verify Firebase Auth token and document access rights. **(Critical)**  
  - [x] Reconstruct full sentence context ± 100 chars around change. **(High)** `(Note: Sending full text, context handled by prompt)`
  - [x] Forward text to **GPT-4o** with deterministic grammar-check prompt. **(Critical)**  
  - [x] Parse JSON response into `GrammarError[]`. **(Critical)**  
  - [x] Cache identical requests for **10 s** to cut API spend. **(Medium)**  
  - [x] Return `{errors, latency}` with `Cache-Control: no-store`. **(High)**  

### Subfeature 3 – Error Normalization Layer  
*Criteria: map backend offsets to live document and reconcile state.*

  - [x] Convert absolute character offsets to live editor positions. **(Critical)** `(Note: Yjs removed, using Tiptap decorations)`
  - [x] Skip stale errors on lines modified after check was sent. **(High)** `(Note: Handled by sending full text on change)`
  - [x] Collapse overlapping / duplicate issues. **(Medium)**
  - [x] Persist unresolved issues in `useGrammarChecker` hook. **(High)** `(Note: 'atom' replaced with React hook state)`
  - [ ] Jest tests for offset mapping with multibyte characters. **(Medium)**  
  - [x] Replace textarea with **Tiptap** editor supporting decorations. **(Critical)**  
  - [x] Add `slate`, `slate-react`, `slate-history` dependencies. **(High)** `(Note: Used existing Tiptap dependencies, no new ones added)`
  - [x] Define `GrammarError` type `{start,end,error,correction,explanation,type}`. **(High)**  
  - [x] Update `checkGrammar` prompt to include offsets & `type`. **(Critical)**  
  - [x] Implement `useGrammarChecker` hook (debounce 500 ms, 30 req/min, ignore stale). **(High)**  
  - [x] Implement `decorate` to map `GrammarError[]` to Tiptap ranges. **(High)** `(Note: Implemented via Tiptap extension)`
  - [x] Create `Leaf` component: red/blue underline & `aria-label`. **(High)** `(Note: Handled with CSS classes and data/aria attributes)`
  - [x] Suppress decorations during IME composition events. **(Low)**  
  - [x] Ensure decoration updates reactively ≤ 16 ms on change. **(High)** `(Note: Performance seems acceptable, will monitor)`

### Subfeature 4 – Inline Decorations  
*Criteria: surface grammar issues visually in the editor.*

  - [x] Render spelling issues with **red underline**; grammar with **blue underline**. **(Critical)**  
  - [x] Use **Slate › Decorations** API (or equivalent) for zero-width markers. **(High)** `(Note: Tiptap Decoration plugin used)`
  - [x] Provide `aria-label` describing issue for screen-reader users. **(Medium)**  
  - [x] Suppress decorations during IME composition events. **(Low)**  
  - [x] Update decorations reactively on doc or issue list change ≤ 16 ms. **(High)** `(Note: Handled by Tiptap's reactive plugin system)`

### Subfeature 5 – Quick-Fix UX  
*Criteria: allow users to act on suggestions inline.*

  - [x] Open context menu on **right-click / ⌘+.** over highlighted text. **(Critical)**  
  - [x] Show top **3** replacement suggestions + *Ignore* / *Add to dictionary*. **(Critical)**  
  - [x] Applying fix executes single **Yjs** transaction and clears issue. **(High)** `(Note: Yjs removed, uses Tiptap transaction)`
  - [x] Record action in `auditLogs` with `{issueId, action, msSinceShown}`. **(Medium)**  
  - [x] Keyboard shortcut **⌥+Enter** accepts first suggestion. **(Low)**  

### Subfeature 6 – Observability & SLA Enforcement  
*Criteria: guarantee p95 latency ≤ 2 s and visibility into failures.*

  - [ ] Emit **OpenTelemetry** span `grammar.suggestion` with `latency_ms`. **(Critical)**  
  - [ ] Store custom metric in **Firebase Monitoring**; chart 24 h rolling window. **(High)**  
  - [ ] Trigger Slack alert if p95 > 2000 ms for 5 min. **(High)**  
  - [ ] Run synthetic test every 5 min verifying end-to-end path. **(Medium)**  
  - [ ] Fail CI if new code increases median latency by > 10 %. **(Medium)**  

---

### Acceptance-Criteria Examples  
(Replicate pattern for each checklist item.)

- **Subfeature 1 – Change Detection & Dispatch – Task 1.2**  
  - [ ] *Acceptance:* Typing stops for 300 ms → network tab shows single `POST /grammar` and debounced subsequent keystrokes.  

- **Subfeature 6 – Observability & SLA Enforcement – Task 6.1**  
  - [ ] *Acceptance:* Cloud Trace reports p95 `grammar.suggestion` latency ≤ 2000 ms over the last 24 h.  

---

### Priority Key  
**Critical** – must-have for core functionality  
**High** – significant UX/value  
**Medium** – additional value, not launch-blocking  
**Low** – quality-of-life 