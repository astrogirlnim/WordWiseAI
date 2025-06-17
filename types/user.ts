import type { WritingGoals } from "./writing-goals"

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  orgId: string
  preferences: {
    defaultWritingGoals: WritingGoals
    autoSaveInterval: number
    showAdvancedSuggestions: boolean
    preferredTone: string
  }
  brandVoiceGlossaryId?: string
  acceptedSuggestions: string[]
  rejectedSuggestions: string[]
  createdAt: number
  updatedAt: number
}

export interface Organization {
  id: string
  name: string
  brandGuidelines: {
    toneGuidelines: {
      primary: string
      secondary: string[]
      avoid: string[]
    }
    vocabularyPreferences: {
      preferred: string[]
      avoid: string[]
    }
    formalityLevel: "casual" | "professional" | "formal"
    brandVoice: string
  }
  members: string[]
  createdAt: number
  updatedAt: number
}
