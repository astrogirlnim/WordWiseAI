import { FieldValue, Timestamp } from 'firebase/firestore'

export type FirestoreTimestamp = Timestamp | FieldValue | number

export interface Document {
  id: string
  title: string
  content: string
  ownerId: string
  orgId: string
  goalId?: string
  status: 'draft' | 'review' | 'final' | 'archived'
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
