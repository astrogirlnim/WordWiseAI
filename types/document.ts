import { FieldValue, Timestamp } from 'firebase/firestore'

export type FirestoreTimestamp = Timestamp | FieldValue | number

// Access control types
export interface DocumentAccess {
  userId: string
  email: string
  role: 'owner' | 'editor' | 'commenter' | 'viewer'
  addedAt: FirestoreTimestamp
  addedBy: string
}

export interface Document {
  id: string
  title: string
  content: string
  ownerId: string
  orgId: string
  goalId?: string
  status: 'draft' | 'review' | 'final' | 'archived'
  // Access control list
  sharedWith: DocumentAccess[]
  // Flat list of user IDs for efficient querying (optional for backward compatibility)
  sharedWithUids?: string[]
  // Sharing settings
  isPublic: boolean
  publicViewMode: 'view' | 'comment' | 'disabled'
  shareableLink?: string
  // Collaboration metadata
  lastEditedBy?: string
  lastEditedAt?: FirestoreTimestamp
  // Workflow
  workflowState: {
    currentStatus: 'draft' | 'review' | 'final' | 'archived'
    submittedForReview?: boolean
    submittedAt?: FirestoreTimestamp
    submittedBy?: string
    reviewedBy?: string[]
    approvedBy?: string
    approvedAt?: FirestoreTimestamp
    rejectedBy?: string
    rejectedAt?: FirestoreTimestamp
    rejectionReason?: string
  }
  analysisSummary: {
    overallScore: number
    brandAlignmentScore: number
    lastAnalyzedAt: FirestoreTimestamp
    suggestionCount: number
  }
  lastSaved: FirestoreTimestamp
  wordCount: number
  characterCount: number
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

export interface ShareToken {
  id: string
  documentId: string
  createdBy: string
  email: string
  role: 'viewer' | 'commenter' | 'editor'
  expiresAt?: FirestoreTimestamp
  isUsed: boolean
  usedAt?: FirestoreTimestamp
  createdAt: FirestoreTimestamp
}

export type ShareTokenData = Omit<ShareToken, 'id' | 'createdAt'> & {
  createdAt: FieldValue
}

export interface DocumentSharingInfo {
  document: Document
  sharedWith: DocumentAccess[]
  activeTokens: ShareToken[]
}

export interface AutoSaveStatus {
  status: 'saving' | 'saved' | 'error' | 'checking'
  lastSaved?: FirestoreTimestamp
}

export interface VoiceReport {
  id: string
  documentId: string
  userId: string
  orgId: string
  alignmentScore: number
  toneMatches: {
    category: string
    expected: string
    actual: string
    score: number
  }[]
  violations: {
    type: string
    description: string
    severity: 'low' | 'medium' | 'high'
    suggestions: string[]
  }[]
  createdAt: FirestoreTimestamp
}
