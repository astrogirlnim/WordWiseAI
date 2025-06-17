# 📘 Grammarly MVP – Product Requirements Document (PRD)

---

## ✅ Project Overview

Build an AI-first writing assistant for professional marketing teams that enhances clarity, tone, and persuasiveness in business documents. The MVP supports real-time editing, contextual AI suggestions, tone alignment, and goal-based writing feedback.

---

## ✅ User Roles & Core Workflows

1. **Marketing Manager** creates and edits proposals with goal-based AI suggestions.
2. **Brand Strategist** defines and enforces tone guidelines for consistent messaging.
3. **Content Writer** receives grammar, tone, and clarity feedback in real time while writing.
4. **All users** view suggestion history, accept/reject feedback, and save writing goals.
5. **Managers and Strategists** review final drafts and run tone alignment checks.

---

## ✅ Technical Foundation

### 🔹 Data Models

- `UserProfile`: preferences, role, orgId, accepted/rejected suggestions
- `Organization`: brand tone guidelines, name
- `Document`: title, content, goalId, ownerId, orgId, status, analysisSummary
- `Suggestion`: selection, type, text, confidence, alternatives, feedback
- `WritingGoal`: goal type, documentId, notes
- `VoiceReport`: alignment score, tone matches, violations
- `UsageAnalytics`: suggestion interaction stats, progress trends

### 🔹 API Endpoints

- `GET/PUT /api/user/me`
- `POST/GET/PUT /api/documents/:id`
- `POST /api/suggestions` and `POST /api/suggestions/:id/{accept|reject}`
- `POST/GET /api/goals/:documentId`
- `POST/GET /api/voice-report/:documentId`
- `GET/PUT /api/organization/:id/guidelines`

### 🔹 Key Components

- `DocumentEditor` (real-time editing + AI overlay)
- `SuggestionPanel` (inline and sidebar AI suggestions)
- `ToneReportSidebar` (shows brand alignment)
- `WritingGoalForm` (sets document goals)
- `UserPreferencesForm` (tone, vocab, defaults)
- `DocumentList`, `Navbar`, `AuthGuard`, `Sidebar`

---

## ✅ MVP Launch Requirements

1. Users can log in with Clerk and access documents tied to their organization.
2. Writers can create, edit, and auto-save documents with Firebase Realtime DB.
3. Writers receive grammar, tone, and clarity suggestions via GPT-4o and accept/reject them.
4. Each document supports a writing goal (e.g., persuasive), which tailors AI suggestions.
5. Strategists can define tone guidelines and generate tone alignment reports.
6. Suggestions, feedback, and tone reports are stored in Firestore and cached in PostgreSQL.
7. Document list shows status, last edited date, and brand alignment score.
8. All role-based access is enforced with Clerk and Firebase role claims.
9. All AI processing is handled via secured Firebase Cloud Functions.
10. Project is deployed and publicly accessible via Firebase Hosting.
