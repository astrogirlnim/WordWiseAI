export interface AISuggestion {
  id: string
  documentId: string
  userId: string
  type: 'grammar' | 'style' | 'clarity' | 'engagement' | 'readability' | 'headline' | 'subheadline' | 'cta' | 'outline'
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
  // Optional positioning for funnel suggestions
  positioning?: SuggestionPositioning
  // Optional funnel-specific properties
  targetAudience?: string
  intent?: string
  domain?: string
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

// Positioning strategy for intelligent funnel suggestion placement with character indices
export interface SuggestionPositioning {
  strategy: 'insert' | 'replace' | 'append'
  startIndex: number  // Character position where action starts (0-based)
  endIndex: number    // Character position where action ends (0-based, same as startIndex for inserts)
  targetText: string  // Text being replaced (for validation, empty for inserts)
  insertionPoint: string  // Human-readable description of positioning logic
  preserveExisting: boolean  // Whether to preserve existing content
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
  originalText: string
  // Legacy position field for backward compatibility
  position: {
    start: number
    end: number
  }
  // New intelligent positioning structure
  positioning?: SuggestionPositioning
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
