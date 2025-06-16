export interface Document {
  id: string
  title: string
  content: string
  userId: string
  orgId: string
  goalId?: string
  status: "draft" | "review" | "final" | "archived"
  analysisSummary: {
    overallScore: number
    brandAlignmentScore: number
    lastAnalyzedAt: number
    suggestionCount: number
  }
  lastSaved: number
  wordCount: number
  characterCount: number
  createdAt: number
  updatedAt: number
}

export interface AutoSaveStatus {
  status: "saving" | "saved" | "error"
  lastSaved?: number
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
    severity: "low" | "medium" | "high"
    suggestions: string[]
  }[]
  createdAt: number
}
