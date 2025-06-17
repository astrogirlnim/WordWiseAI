### Phase 4 – Feature 1 — *Real-Time Grammar & Spelling*  

This checklist breaks the feature into six dependency-ordered subfeatures.  
*Checkbox legend:*  
`[ ]` Not started `[~]` In progress `[x]` Done `[!]` Blocked  

---

## Subfeatures Overview  
- [ ] **Subfeature 1 – Change Detection & Dispatch**  
- [ ] **Subfeature 2 – Grammar Service Cloud Function**  
- [ ] **Subfeature 3 – Error Normalization Layer**  
- [ ] **Subfeature 4 – Inline Decorations**  
- [ ] **Subfeature 5 – Quick-Fix UX**  
- [ ] **Subfeature 6 – Observability & SLA Enforcement**  

---

### Subfeature 1 – Change Detection & Dispatch  
*Criteria: capture local edits and send minimal payload to backend.*

  - [ ] Hook into **Yjs** text observer to detect content deltas. **(Critical)**  
  - [ ] Debounce updates for **300 ms** of user idle time. **(Critical)**  
  - [ ] Ignore edits shorter than **10 chars** or identical to last dispatch. **(High)**  
  - [ ] Compose minimal payload `{docId, excerpt, cursorStart, cursorEnd, version}`. **(High)**  
  - [ ] Enforce client-side throttle at **30 req/min** per user. **(High)**  
  - [ ] Unit-test diff builder against edge cases (emoji, RTL text). **(Medium)**  

### Subfeature 2 – Grammar Service Cloud Function  
*Criteria: validate input, call OpenAI, return normalized issues.*

  - [ ] Verify Firebase Auth token and document access rights. **(Critical)**  
  - [ ] Reconstruct full sentence context ± 100 chars around change. **(High)**  
  - [ ] Forward text to **GPT-4o** with deterministic grammar-check prompt. **(Critical)**  
  - [ ] Parse JSON response into `GrammarError[]`. **(Critical)**  
  - [ ] Cache identical requests for **10 s** to cut API spend. **(Medium)**  
  - [ ] Return `{errors, latency}` with `Cache-Control: no-store`. **(High)**  

### Subfeature 3 – Error Normalization Layer  
*Criteria: map backend offsets to live document and reconcile state.*

  - [ ] Convert absolute character offsets to live **Yjs** positions. **(Critical)**  
  - [ ] Skip stale errors on lines modified after check was sent. **(High)**  
  - [ ] Collapse overlapping / duplicate issues. **(Medium)**  
  - [ ] Persist unresolved issues in `useGrammarErrors` atom keyed by `versionId`. **(High)**  
  - [ ] Jest tests for offset mapping with multibyte characters. **(Medium)**  

### Subfeature 4 – Inline Decorations  
*Criteria: surface grammar issues visually in the editor.*

  - [ ] Render spelling issues with **red underline**; grammar with **blue underline**. **(Critical)**  
  - [ ] Use **Slate › Decorations** API (or equivalent) for zero-width markers. **(High)**  
  - [ ] Provide `aria-label` describing issue for screen-reader users. **(Medium)**  
  - [ ] Suppress decorations during IME composition events. **(Low)**  
  - [ ] Update decorations reactively on doc or issue list change ≤ 16 ms. **(High)**  

### Subfeature 5 – Quick-Fix UX  
*Criteria: allow users to act on suggestions inline.*

  - [ ] Open context menu on **right-click / ⌘+.** over highlighted text. **(Critical)**  
  - [ ] Show top **3** replacement suggestions + *Ignore* / *Add to dictionary*. **(Critical)**  
  - [ ] Applying fix executes single **Yjs** transaction and clears issue. **(High)**  
  - [ ] Record action in `auditLogs` with `{issueId, action, msSinceShown}`. **(Medium)**  
  - [ ] Keyboard shortcut **⌥+Enter** accepts first suggestion. **(Low)**  

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