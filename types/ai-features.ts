export interface AISuggestion {
  id: string
  documentId: string
  userId: string
  type: 'grammar' | 'style' | 'clarity' | 'engagement' | 'readability' | 'urgency' | 'trust' | 'headline' | 'subheadline' | 'cta' | 'outline'
  title: string
  description: string
  originalText: string
  suggestedText: string
  position: {
    start: number
    end: number
  }
  confidence: number
  status: 'pending' | 'applied' | 'dismissed'
  createdAt: number
  appliedAt?: number
}

export interface ToneAnalysis {
  id: string
  documentId: string
  userId: string
  overall:
    | 'professional'
    | 'casual'
    | 'friendly'
    | 'formal'
    | 'confident'
    | 'neutral'
  confidence: number
  aspects: {
    formality: number
    friendliness: number
    confidence: number
    clarity: number
  }
  suggestions: string[]
  createdAt: number
}

export interface UserFeedback {
  id: string
  userId: string
  suggestionId: string
  documentId: string
  action: 'applied' | 'dismissed' | 'helpful' | 'not-helpful'
  feedback?: string
  createdAt: number
}

// New funnel-specific suggestion types
export interface FunnelSuggestion {
  id: string
  documentId: string
  userId: string
  type: 'headline' | 'subheadline' | 'cta' | 'outline'
  title: string
  description: string
  suggestedText: string
  confidence: number
  status: 'pending' | 'applied' | 'dismissed'
  createdAt: number
  appliedAt?: number
  // Funnel-specific properties
  targetAudience?: string
  intent?: string
  domain?: string
}

export interface FunnelSuggestionsResponse {
  suggestions: FunnelSuggestion[]
  generatedAt: number
  basedOnGoals: boolean
}
