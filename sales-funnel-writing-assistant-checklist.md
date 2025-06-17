### MVP Development Checklist ­— _Sales Funnel Writing Assistant_

This checklist breaks the PRD into four dependency-ordered phases.  
_Checkbox legend:_  
`[ ]` Not started `[~]` In progress `[x]` Done `[!]` Blocked

---

## Phases Overview

- [x] **Phase 1 – Foundation**
- [x] **Phase 2 – Data Layer**
- [ ] **Phase 3 – Interface Layer**
- [ ] **Phase 4 – Implementation Layer**

---

## Phase 1 – Foundation

_Criteria: essential building blocks with zero external dependencies._

### [x] Feature 1 – Project Scaffolding & Tooling

- [x] Initialize a Git repository and push a _README_. **(Critical)**
- [x] Scaffold a **Next.js 15 + React 19 + TypeScript 5** project that runs "Hello World" locally. **(Critical)**
- [x] Install **Tailwind CSS** and **shadcn UI** and verify styles compile. **(High)**
- [x] Add ESLint + Prettier with Husky pre-commit hooks. **(Medium)**

### [x] Feature 2 – Core Firebase Infrastructure

- [x] Create a Firebase project and enable **Hosting**. **(Critical)**
- [x] Enable **Firebase Auth** (email + Google). **(Critical)**
- [x] Provision **Firestore**, **Realtime DB**, **Cloud Functions**, and **Cloud Storage**. **(Critical)**
- [x] Write baseline security rules that restrict data to authenticated users. **(Critical)**

### [~] Feature 3 – DevOps Pipeline & Observability Base

- [x] Configure a **GitHub Actions** workflow to lint, test, build, and deploy to Firebase Hosting on `main` pushes. **(High)**
- [ ] Install **OpenTelemetry** in Next.js and Cloud Functions, exporting traces to Firebase Trace. **(Medium)**
- [ ] Integrate **Sentry** for client- and server-side error reporting. **(Medium)**
- [x] Add `.env` management with GitHub Secrets, storing the OpenAI API key. **(High)**

### [x] Feature 4 – OpenAI Connectivity Layer

- [x] Build a secure Cloud Function that proxies text to **GPT-4o** and returns structured suggestions. **(Critical)**
- [x] Add per-user rate limiting (30 req/min) inside the Cloud Function. **(High)**
- [x] Ship a typed client SDK for calling the function with Firebase Auth token. **(Critical)**
- [x] Expose a health-check endpoint that measures OpenAI latency. **(Medium)**

---

## Phase 2 – Data Layer

_Criteria: persistent data structures; depends on Phase 1._

### [x] Feature 1 – Firestore Schemas

- [x] Define `users` collection schema with role field. **(Critical)**
- [x] Define `docs` collection schema (title, ownerId, createdAt). **(Critical)**
- [x] Define `versions` sub-collection schema (content, createdAt, diff). **(High)**
- [x] Define `comments` collection schema (docId, anchorStart, anchorEnd). **(High)**

### [x] Feature 2 – Realtime Collaboration Data

- [x] Implement OT/CRDT structure in **Realtime DB** keyed by `docId`. **(Critical)**
- [x] Create a `presence` node for cursor position and user color. **(High)**
- [x] Enforce a **20-editor limit** via Realtime DB security rules. **(Critical)**
- [x] Write a disconnect cleanup Cloud Function for `presence` nodes. **(Medium)**

### [x] Feature 3 – Glossary & Brand-Voice Storage

- [x] Add Cloud Storage path `/glossaries/{userId}/{fileId}.csv`. **(High)**
- [x] Parse uploaded CSV/JSON into `glossaries` collection via Cloud Function. **(High)**
- [x] Reject malformed uploads with descriptive errors. **(Medium)**
- [x] Store `brandVoiceGlossaryId` on the user profile. **(Medium)**

### [x] Feature 4 – Version Retention & Audit Logs

- [x] Schedule a Cloud Function that prunes snapshots > 30 days or > 100 versions. **(High)**
- [x] Log create/edit/delete events to an `auditLogs` collection. **(High)**
- [x] Export `auditLogs` to BigQuery for future analysis. **(Nice to Have)**
- [x] Make retention policy duration configurable via Remote Config. **(Medium)**

---

## Phase 3 – Interface Layer

_Criteria: user-facing components; depends on Phases 1 & 2._

### [x] Feature 1 – Core Editor UI

- [x] Build a distraction-free editor component. **(Critical)**
- [x] Implement dark/light theme toggle with Tailwind. **(High)**
- [x] Show live word/character count in the footer. **(Medium)**
- [x] Display an autosave spinner whenever Firestore write completes. **(High)**

### [x] Feature 2 – Collaboration UI

- [x] Render remote cursors with user names and colors. **(High)**
- [x] Show active-collaborator avatars in the header. **(Medium)**
- [x] Implement inline comment thread pop-ups anchored to selections. **(High)**
- [x] Allow comments to be resolved and reopened. **(Medium)**

### [x] Feature 3 – Version History UI

- [x] List snapshots with timestamp and author in a sidebar. **(High)**
- [x] Provide a diff viewer highlighting additions and deletions. **(Critical)**
- [x] Add "Restore this version" button that overwrites current doc. **(High)**
- [x] Paginate the list after 50 items. **(Medium)**

### [x] Feature 4 – Forms & Settings

- [x] Build login/registration forms with React Hook Form + Zod. **(Critical)**
- [x] Build glossary upload form supporting CSV/JSON drag-and-drop. **(High)**
- [x] Create user-profile settings (display name, brand tone preset). **(Medium)**
- [x] Implement account-deletion screen triggering cleanup. **(Medium)**

### [x] Feature 5 – Readability Metrics Visualization

- [x] Render a Flesch-Kincaid gauge with Recharts. **(High)**
- [x] Display a bar chart of sentence lengths. **(Medium)**
- [x] Add tooltips explaining each readability metric. **(Medium)**
- [x] Provide a toggle to hide/show the metrics panel. **(Low)**

---

## Phase 4 – Implementation Layer

_Criteria: application value delivery; depends on Phases 1-3._

### [ ] Feature 1 – Real-Time Grammar & Spelling

- [ ] Send editor deltas to the Cloud Function after 300 ms idle. **(Critical)**
- [ ] Underline grammar errors (blue) and spelling errors (red) inline. **(Critical)**
- [ ] Show a right-click quick-fix menu with replacement options. **(Critical)**
- [ ] Log round-trip latency and fail test if > 2 s (p95). **(Critical)**

### [ ] Feature 2 – Style & Tone Suggestions

- [ ] Detect paragraph tone and display a badge (persuasive, formal, etc.). **(High)**
- [ ] Surface ad-copy tips (power words, CTAs) in a sidebar. **(Medium)**
- [ ] Suggest AIDA/PAS frameworks for long copy blocks. **(Medium)**
- [ ] Let users dismiss or apply suggestions in one click. **(Medium)**

### [ ] Feature 3 – Readability Highlighting

- [ ] Recalculate Flesch-Kincaid every 10 s in the background. **(High)**
- [ ] Highlight sentences with grade > 10 in yellow. **(High)**
- [ ] Show tooltip explanations for each highlight. **(Medium)**
- [ ] Update Recharts panel in real time as the user edits. **(Medium)**

### [ ] Feature 4 – Brand Voice Alignment

- [ ] Flag terms not in the approved glossary and underline them. **(High)**
- [ ] Offer glossary-approved replacements in the quick-fix menu. **(High)**
- [ ] Persist "ignore" or "accept" actions to a user-level custom dictionary. **(Medium)**
- [ ] Allow owners to share glossaries with collaborators. **(Medium)**

### [ ] Feature 5 – Export & Integration

- [ ] Generate PDF exports via server-side Puppeteer and serve download link. **(High)**
- [ ] Generate DOCX exports using docx.js. **(Medium)**
- [ ] Generate Markdown exports by stripping HTML tags. **(Medium)**
- [ ] Provide a webhook/Zapier trigger named **Document Finalized**. **(Medium)**

### [ ] Feature 6 – Observability & SLA Enforcement

- [ ] Create a Firebase Monitoring dashboard charting median suggestion latency. **(Critical)**
- [ ] Alert Slack if p95 latency > 2 s for 5 min. **(High)**
- [ ] Track error rate in Sentry and auto-create Jira ticket on threshold breach. **(Medium)**
- [ ] Run a synthetic test every 5 min that opens the editor and triggers a sample correction. **(Medium)**

---

### Acceptance-Criteria Examples

(Apply similar sub-items wherever clarity is needed.)

- **Phase 1 > Feature 1 > Sub-feature 1.2**
  - [ ] _Acceptance:_ running `pnpm dev` shows "Hello World" on `localhost:3000` with no console errors.
- **Phase 4 > Feature 1 > Sub-feature 1.4**
  - [ ] _Acceptance:_ p95 suggestion round-trip latency recorded in Cloud Trace is ≤ 2000 ms for 24 h.

---

### Priority Key

**Critical** – must-have for core functionality  
**High** – significant UX/value  
**Medium** – additional value, not launch-blocking  
**Low** – quality-of-life
