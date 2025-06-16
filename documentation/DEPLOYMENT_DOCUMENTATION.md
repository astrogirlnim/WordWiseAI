# WordWise AI - Deployment Documentation

## Project Overview
AI-powered writing assistant for marketing teams built with Next.js 14 and Firebase.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Authentication**: Firebase Authentication
- **Database**: Firebase Realtime DB (documents), Firestore (AI data)
- **AI Processing**: Firebase Cloud Functions (planned)
- **Deployment**: Firebase Hosting

## Environment Variables Required

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://project-default-rtdb.firebaseio.com/

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Database Setup

### Firebase Collections Structure

**Firestore Collections:**
- `users` - User profiles and preferences
- `organizations` - Brand guidelines and settings
- `ai_analyses` - AI analysis results and history
- `ai_suggestions` - Suggestion feedback and interactions
- `writing_goals` - Document-specific writing goals
- `voice_reports` - Brand alignment reports

**Realtime Database Structure:**
```
documents/
  {userId}/
    {documentId}/
      title: string
      content: string
      userId: string
      orgId: string
      status: "draft" | "review" | "final" | "archived"
      writingGoals: object
      analysisSummary: object
      timestamps...
```

## Core Architecture

### File Structure
```
app/
├── api/                    # API routes
│   ├── user/me/           # User profile management
│   ├── documents/[id]/    # Document CRUD operations
│   ├── suggestions/       # AI suggestion feedback
│   ├── goals/[documentId]/ # Writing goals per document
│   └── voice-report/[documentId]/ # Brand alignment reports
├── sign-in/               # Firebase authentication pages
├── sign-up/
├── layout.tsx             # Root layout
└── page.tsx               # Main application entry

components/
├── document-container.tsx      # Main app container
├── document-editor.tsx         # Real-time text editor
├── navigation-bar.tsx          # Top navigation
├── ai-sidebar.tsx             # AI assistant panel
├── writing-goals-modal.tsx     # Goals configuration
├── tone-alignment-report.tsx   # Brand alignment analysis
├── user-preferences-form.tsx   # User settings
├── suggestion-history-panel.tsx # Suggestion tracking
├── voice-report-panel.tsx      # Brand compliance reports
└── enhanced-document-list.tsx  # Document management

lib/
├── env.ts                 # Environment configuration
├── firebase.ts            # Firebase client setup
└── firebase-admin.ts      # Firebase admin setup

services/
├── document-service.ts    # Document operations
└── ai-service.ts          # AI analysis and suggestions

types/
├── user.ts               # User and organization types
├── document.ts           # Document and report types
├── ai-features.ts        # AI suggestion types
├── tone-alignment.ts     # Tone analysis types
└── writing-goals.ts      # Writing goals types
```

## Component Documentation

### DocumentContainer
**File**: `components/document-container.tsx`
**Purpose**: Main application orchestrator
**Key Features**:
- Manages document state and AI analysis
- Coordinates between editor, sidebar, and navigation
- Handles real-time auto-save to Firebase
- Integrates Firebase authentication

**Dependencies**: All major components, Firebase services

### DocumentEditor
**File**: `components/document-editor.tsx`
**Purpose**: Real-time text editor with auto-save
**Key Features**:
- Auto-save every 2 seconds to Firebase Realtime DB
- Word/character counting
- Document title editing
- Status bar with save indicators

**Props**: `onContentChange`, `suggestions`, `onApplySuggestion`

### NavigationBar
**File**: `components/navigation-bar.tsx`
**Purpose**: Top navigation with document management
**Key Features**:
- Document list dropdown with status indicators
- Writing goals button
- AI sidebar toggle
- User menu with role-based options

**Props**: `user`, `documents`, `writingGoals`, event handlers

### AISidebar
**File**: `components/ai-sidebar.tsx`
**Purpose**: Collapsible AI assistant panel
**Key Features**:
- Real-time AI suggestions
- Tone alignment reports
- Tone analysis charts
- Apply/dismiss suggestion actions

**Props**: `suggestions`, `toneAnalysis`, `toneAlignmentReport`, `isOpen`

### WritingGoalsModal
**File**: `components/writing-goals-modal.tsx`
**Purpose**: Goal configuration for documents
**Key Features**:
- Marketing-focused goal options
- Audience, formality, domain, intent selection
- Per-document goal persistence
- Auto-show on new document option

**Props**: `isOpen`, `currentGoals`, `onSave`

### ToneAlignmentReportComponent
**File**: `components/tone-alignment-report.tsx`
**Purpose**: Brand voice compliance analysis
**Key Features**:
- Overall alignment scoring (0-100)
- Category breakdown (audience, formality, domain, intent)
- Actionable recommendations with priority levels
- Brand consistency tracking

**Props**: `report`, `onApplyRecommendation`

### UserPreferencesForm
**File**: `components/user-preferences-form.tsx`
**Purpose**: User settings and role management
**Key Features**:
- Role selection (Marketing Manager, Brand Strategist, Content Writer)
- Auto-save interval configuration
- Preferred tone settings
- Advanced suggestions toggle

**API Integration**: `/api/user/me` (GET/PUT)

### SuggestionHistoryPanel
**File**: `components/suggestion-history-panel.tsx`
**Purpose**: Historical suggestion tracking
**Key Features**:
- Filter by status (all, applied, dismissed)
- Suggestion details with confidence scores
- Interaction timestamps
- Performance analytics ready

**API Integration**: `/api/suggestions/history` (GET)

### VoiceReportPanel
**File**: `components/voice-report-panel.tsx`
**Purpose**: Brand guideline compliance reports
**Key Features**:
- On-demand report generation
- Tone matching analysis
- Violation detection with severity levels
- Actionable improvement suggestions

**API Integration**: `/api/voice-report/[documentId]` (GET/POST)

### EnhancedDocumentList
**File**: `components/enhanced-document-list.tsx`
**Purpose**: Document management with metadata
**Key Features**:
- Document status indicators (draft, review, final, archived)
- Brand alignment scores
- Last modified timestamps
- Word count tracking

**API Integration**: `/api/documents` (GET)

## API Endpoints

### User Management
- `GET /api/user/me` - Fetch user profile
- `PUT /api/user/me` - Update user preferences

### Document Operations
- `GET /api/documents/[id]` - Fetch document
- `PUT /api/documents/[id]` - Update document
- `POST /api/documents` - Create document

### AI Suggestions
- `POST /api/suggestions/[id]/accept` - Accept suggestion
- `POST /api/suggestions/[id]/reject` - Reject suggestion
- `GET /api/suggestions/history` - Get suggestion history

### Writing Goals
- `GET /api/goals/[documentId]` - Fetch document goals
- `POST /api/goals/[documentId]` - Save document goals

### Voice Reports
- `GET /api/voice-report/[documentId]` - Fetch latest report
- `POST /api/voice-report/[documentId]` - Generate new report

## Services

### DocumentService
**File**: `services/document-service.ts`
**Purpose**: Firebase Realtime DB operations
**Key Methods**:
- `createDocument()` - Create new document
- `updateDocument()` - Update existing document
- `getUserDocuments()` - Fetch user's documents
- `subscribeToDocument()` - Real-time document updates

### AIService
**File**: `services/ai-service.ts`
**Purpose**: AI analysis and Firestore operations
**Key Methods**:
- `generateAnalysis()` - Create AI analysis
- `saveSuggestionFeedback()` - Track user interactions
- `getUserSuggestionHistory()` - Fetch interaction history

## Authentication Flow

1. **Firebase Integration**: Root layout initializes Firebase
2. **Route Protection**: Main page checks auth state and redirects to sign-in
3. **User Context**: Components use Firebase auth hooks for user data
4. **API Security**: All API routes validate Firebase auth token

## Data Flow

1. **Document Creation**: User creates document → Firebase Realtime DB
2. **Content Changes**: Auto-save every 2s → Firebase Realtime DB
3. **AI Analysis**: Content + Goals → Firebase Cloud Function → Firestore
4. **User Interactions**: Suggestion feedback → Firestore analytics

## Deployment Checklist

### Pre-deployment
- [ ] Set all environment variables
- [ ] Configure Firebase project with Realtime DB and Firestore
- [ ] Configure Firebase security rules

### Firebase Security Rules
**Realtime Database**:
```json
{
  "rules": {
    "documents": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid"
      }
    }
  }
}
```

**Firestore**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### Post-deployment
- [ ] Test authentication flow
- [ ] Verify document CRUD operations
- [ ] Test AI suggestion generation
- [ ] Monitor error logs

## Performance Notes

- **Auto-save**: Debounced to 2 seconds to prevent excessive writes
- **Real-time**: Only active document subscribes to real-time updates
- **Lazy Loading**: AI analysis triggered only after content changes
- **Optimization**: Components use React.memo and useCallback for performance

## Known Limitations

- AI processing currently uses mock data (Firebase Cloud Functions needed)
- Organization features partially implemented (brand guidelines API missing)
- No offline support (requires service worker implementation)
- Limited error boundaries (needs comprehensive error handling)

## Next Steps for Production

1. Implement Firebase Cloud Functions for real AI processing
2. Add organization management API (`/api/organization/[id]/guidelines`)
3. Implement comprehensive error boundaries
4. Add offline support with service workers
5. Set up monitoring and analytics
6. Configure CDN for static assets
7. Implement rate limiting for API endpoints
