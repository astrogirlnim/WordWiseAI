# User Flow 6: Browse & Prioritize Funnel Pages

## User Story
As a marketing team member, I want to browse a list of funnel pages sorted by funnel stage and goal so I can prioritize which ones to edit based on campaign readiness.

## Executive Summary

### Feature Reuse vs New Development

| Feature Category | Existing Components | New Requirements |
|-----------------|-------------------|------------------|
| **Document Storage** | ✅ Firestore document collection<br>✅ Document service layer<br>✅ Auto-save functionality | ❌ Funnel stage field<br>❌ Conversion goal field<br>❌ Campaign readiness score |
| **Listing UI** | ✅ EnhancedDocumentList dropdown<br>✅ Document status badges<br>✅ Last updated display<br>✅ Word count tracking | ❌ Full-page table view<br>❌ Sortable columns<br>❌ Pagination<br>❌ Grid layout option |
| **Metadata** | ✅ Writing goals system<br>✅ Document status<br>✅ Brand alignment score<br>✅ Timestamps | ❌ Funnel stage categorization<br>❌ Campaign readiness calculation<br>❌ Priority indicators |
| **Actions** | ✅ Create document<br>✅ Delete document<br>✅ Select document<br>✅ Edit document | ❌ Bulk operations<br>❌ Quick status updates<br>❌ Export functionality<br>❌ Duplicate document |
| **Filtering** | ✅ Active document highlight | ❌ Funnel stage filter<br>❌ Goal-based filter<br>❌ Status filter<br>❌ Search functionality |
| **Sorting** | ❌ None currently | ❌ Sort by stage<br>❌ Sort by readiness<br>❌ Sort by date<br>❌ Multi-column sort |

### Minimum Viable Implementation
To deliver this user flow with minimal changes:
1. **Reuse** existing document structure, adding only 2 new fields
2. **Extend** EnhancedDocumentList to table view (keep dropdown as compact option)
3. **Leverage** existing writing goals for goal-based filtering
4. **Calculate** campaign readiness from existing metrics
5. **Add** basic sort/filter without complex UI initially

## Current State Analysis

### Existing Features
- Document list in dropdown format (EnhancedDocumentList)
- Document metadata: title, status, word count, last updated, alignment score
- Writing goals system with audience/intent/domain/formality
- Document status tracking (draft/review/final/archived)
- Document deletion and creation capabilities

### Missing Features
- Funnel stage property on documents
- Campaign readiness/optimization score calculation
- Table/grid view for better browsing
- Sorting by funnel stage and goal
- Filtering capabilities
- Visual readiness indicators
- Bulk selection for operations

---

## Phase 1: Data Model Enhancement

### Background / Architecture
The existing `Document` interface (types/document.ts) contains rich metadata but lacks funnel-specific context. We will extend this type and propagate the additional fields through the service layer, hooks, and Firestore. No new collections are required; we will simply store the extra keys inside each document record.

**Key Variable Additions**
* `funnelStage`: `'awareness' | 'interest' | 'consideration' | 'conversion' | 'retention'`
* `conversionGoal`: `'email-capture' | 'purchase' | 'signup' | 'download' | 'book-call'`
* `campaignReadiness`: `number /* 0-100 */`
* `analysisSummary.conversionScore` *(rename from `brandAlignmentScore`)*

**Files To Create / Edit**
1. Edit `types/document.ts`
2. Edit `hooks/use-documents.ts` – extend Firestore `addDoc` & `updateDoc` payloads
3. Edit `services/document-service.ts` – propagate new fields server-side
4. Edit `components/enhanced-document-list.tsx` – rename score reference
5. Edit every occurrence of `brandAlignmentScore` (grep search revealed: hooks/use-documents.ts, document-service.ts, enhanced-document-list.tsx, types/document.ts)
6. Create `utils/campaign-readiness.ts` *(pure function returning 0-100 score)*
7. (Optional) Write a one-off migration script in `scripts/migrate-add-funnel-fields.ts` to back-fill existing docs

### Implementation Steps
- [ ] **Interface Update** – add three new keys + rename score constant in `types/document.ts`
- [ ] **Score Refactor** – update all `brandAlignmentScore` references to `conversionScore`
- [ ] **Firestore Writes** – default new fields when creating a doc (`funnelStage: 'awareness', conversionGoal: 'email-capture', campaignReadiness: 0, analysisSummary.conversionScore: 0`)
- [ ] **Read Support** – update `use-documents` hook to map undefined values to sensible defaults so legacy docs do not break
- [ ] **Utility Function** – `calculateCampaignReadiness()` in utils file (inputs: `analysisSummary.conversionScore`, `suggestionCount`, `status`, `updatedAt`) – returns percentage
- [ ] **Unit Tests** – ensure readiness calc returns expected values for boundary conditions (low/high)
- [ ] **Migration Script** – iterate over `/documents` and patch the new keys; run once in staging

---

## Phase 2: Enhanced List View Component

### Background / Architecture
The current **EnhancedDocumentList** is a dropdown menu. Marketing users need a bird's-eye view. We'll repurpose the existing logic into a full-width table while keeping the dropdown for quick switching. A new route `/funnel-pages` will host this table.

**Key Components & State**
* `FunnelPageTable` (new) – responsive table/grid view with sortable headers
* `FunnelPageRow` (new) – encapsulates row logic: readiness bar, badges, actions
* `FunnelPagesPage` (new Next.js page at `app/funnel-pages/page.tsx`)

**Files To Create / Edit**
1. **NEW** `components/funnel-page-table.tsx`
2. **NEW** `components/funnel-page-row.tsx`
3. **NEW** `app/funnel-pages/page.tsx` – pulls docs via `use-documents`
4. Edit `hooks/use-documents.ts` – add overload for ordering params (`orderBy: 'stage' | 'readiness' | 'updatedAt'`)
5. Edit `lib/navigation.ts` and navbar links – add "Funnel Pages" link if not present
6. Edit `tailwind.config.ts` if extra colours for readiness bars required

### Implementation Steps
- [ ] **Table Skeleton** – create basic table with headers: *Title · Funnel Stage · Goal · Readiness · Status · Updated · ⋯*
- [ ] **Row Rendering** – reuse `<Badge>` and icons; inject calculated readiness via utility from Phase 1
- [ ] **Responsive Design** – collapse columns on mobile, show card view if < sm breakpoint
- [ ] **Empty State** – informative CTA that links to "New Funnel Page"
- [ ] **Navigation** – clicking row opens editor (`/?documentId=…`); maintain existing behaviour
- [ ] **Dropdown Parity** – keep old dropdown for quick access in nav bar

---

## Phase 3: Filtering & Sorting System

### Background / Architecture
Users must slice and dice the table. All filtering/sorting will be done client-side first (later can push down to Firestore if necessary). State will live in URL query params so views are shareable.

**UI Blocks**
* `FunnelFilterBar` (new component)
* `FunnelSortDropdown` (sub-component)
* Local `useFilterSort` hook – derives filtered list

**Files To Create / Edit**
1. **NEW** `components/funnel-filter-bar.tsx`
2. **NEW** `hooks/use-filter-sort.ts`
3. Edit `FunnelPagesPage` – integrate toolbar and hook
4. Update `utils/local-storage.ts` (if exists) or create for saving user prefs

### Implementation Steps
- [ ] **Filter State Shape** `{ stage: string[], goal: string[], status: string[], q: string }`
- [ ] **Toolbar UI** – multi-select for stage/goal; input for search; badge counter showing active filters
- [ ] **Sort Options** – drop-down with friendly labels; default `readiness DESC`
- [ ] **URL Sync** – use `useRouter` searchParams for deep linking
- [ ] **Persist Prefs** – fallback to localStorage when no query params present
- [ ] **Performance** – memoise filtered list and virtualise rows if > 100 items

---

## Phase 4: Campaign Readiness Indicators

### Background / Architecture
Marketers need a quick visual of which pages are "green" vs "red". We'll compute the score client-side using the utility from Phase 1 and render a progress bar + priority badge. Readiness will also be persisted so that list sorting is deterministic across devices.

**Files To Create / Edit**
1. Edit `utils/campaign-readiness.ts` – finalise algorithm weights
2. Edit `hooks/use-documents.ts` – on document fetch, compute and attach `campaignReadiness` if server value is missing
3. Edit `components/funnel-page-row.tsx` – add progress bar and badge colour logic
4. Edit `services/document-service.ts` – write back readiness whenever document is saved (debounced)
5. **Optional** Cloud Function `functions/updateReadinessScore.ts` for nightly recalculation

### Implementation Steps
- [ ] **Algorithm Finalisation** – confirm weight constants in util
- [ ] **UI Rendering** – gradient bar (red→yellow→green) with percent text
- [ ] **Priority Badge** – map readiness⟶High/Medium/Low (thresholds: <50, 50-80, >80)
- [ ] **Tooltips** – show breakdown on hover *(e.g. 30 % suggestions pending)*
- [ ] **Persistence** – ensure readiness saved in Firestore under `campaignReadiness`

---

## Phase 5: Bulk Operations & Quick Actions

### Background / Architecture
Bulk editing streamlines large campaigns. We will extend the table with a checkbox column and an action bar that appears when ≥1 row is selected.

**Files To Create / Edit**
1. Edit `components/funnel-page-table.tsx` – add `<input type="checkbox" />` column
2. **NEW** `components/bulk-action-bar.tsx` – floating toolbar with mass actions
3. Edit `services/document-service.ts` – add `bulkUpdateStatus(ids, status)` & `bulkDelete(ids)`
4. Edit `hooks/use-documents.ts` – expose bulk helpers via context or direct import
5. **Optional** `utils/export-csv.ts` for CSV generation

### Implementation Steps
- [ ] **Selection State** – use React context or lifted state in page component
- [ ] **Action Bar** – slides up from bottom; buttons: *Update Status · Delete · Export CSV*
- [ ] **Confirmation Modals** – re-use `<AlertDialog>` for destructive ops
- [ ] **Keyboard Shortcuts** – `⌘A` select all, `⌘⇧D` delete selected
- [ ] **Performance** – throttle bulk Firestore writes (batched writes 500 max)

---

## Updated Success Metrics
1. **Discovery Efficiency** – median time to locate a funnel page ≤ 15 s
2. **Prioritisation Accuracy** – 80 % of users report readiness score helps decision-making
3. **Operational Speed** – bulk ops cut repetitive tasks by ≥ 30 %
4. **Adoption** – ≥ 70 % of marketing users switch to the new Funnel Pages view within 2 weeks

> This document now contains detailed architecture notes, exact file names, variable additions, and clear checklists for every phase so it can serve as the authoritative implementation tracker for User Flow 6.