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

### Features
- Add funnel stage property to documents
- Add conversion goal property
- Calculate campaign readiness score

### Implementation Steps
- [ ] Add `funnelStage` field to Document type: 'awareness' | 'interest' | 'consideration' | 'conversion' | 'retention'
- [ ] Add `conversionGoal` field to Document type linking to writing goals
- [ ] Add `campaignReadiness` calculated field based on:
  - Document completion status
  - AI suggestion implementation rate
  - Conversion score (renamed from brandAlignmentScore)
  - Last review date
- [ ] Update Firestore schema and migration scripts
- [ ] Update document creation flow to include funnel stage selection

---

## Phase 2: Enhanced List View Component

### Features
- Replace dropdown with full-page table/grid view
- Add sortable columns
- Add visual indicators for readiness

### Implementation Steps
- [ ] Create `FunnelPageList` component extending current list
- [ ] Add table view with columns:
  - Title
  - Funnel Stage (with visual badge)
  - Goal/Intent
  - Campaign Readiness (progress bar)
  - Status
  - Last Updated
  - Actions
- [ ] Implement column sorting functionality
- [ ] Add pagination for large lists
- [ ] Add empty state with quick-start actions

---

## Phase 3: Filtering & Sorting System

### Features
- Quick filters for funnel stage
- Goal-based filtering
- Multi-sort capabilities
- Search functionality

### Implementation Steps
- [ ] Add filter toolbar above list:
  - Funnel stage multi-select
  - Goal/intent dropdown
  - Status filter
  - Search bar
- [ ] Implement client-side filtering logic
- [ ] Add sort dropdown with options:
  - Campaign readiness (default)
  - Funnel stage order
  - Last updated
  - Alphabetical
- [ ] Save filter preferences to localStorage
- [ ] Add "Clear filters" option

---

## Phase 4: Campaign Readiness Indicators

### Features
- Visual readiness scoring
- Priority recommendations
- Quick status updates

### Implementation Steps
- [ ] Create readiness calculation algorithm:
  - Content completeness (40%)
  - AI suggestions addressed (30%)
  - Review status (20%)
  - Time since last update (10%)
- [ ] Add visual indicators:
  - Color-coded readiness bars
  - Priority badges (High/Medium/Low)
  - Warning icons for stale content
- [ ] Add hover tooltips explaining readiness factors
- [ ] Enable quick status updates from list view

---

## Phase 5: Bulk Operations & Quick Actions

### Features
- Multi-select for bulk operations
- Quick edit capabilities
- Export functionality

### Implementation Steps
- [ ] Add checkbox column for multi-select
- [ ] Implement bulk actions toolbar:
  - Bulk status update
  - Bulk delete
  - Bulk export
- [ ] Add quick actions per row:
  - Edit
  - Duplicate
  - Archive
  - View analytics
- [ ] Add export to CSV functionality
- [ ] Implement keyboard shortcuts for power users

---

## Technical Dependencies
- Update `types/document.ts` with new fields
- Create `components/funnel-page-list.tsx`
- Update `hooks/use-documents.ts` for enhanced queries
- Add `utils/campaign-readiness.ts` for scoring logic
- Update routing to support list view at `/funnel-pages`

## Success Metrics
- Time to find relevant funnel page reduced by 50%
- Campaign readiness visibility improves prioritization
- Bulk operations reduce management time by 30%
- Filter usage indicates improved discoverability