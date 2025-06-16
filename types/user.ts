import type { WritingGoals } from "./path/to/WritingGoals" // Assuming WritingGoals is declared in another file

export interface UserProfile {
  id: string
  clerkId: string
  email: string
  name: string
  role: "marketing-manager" | "brand-strategist" | "content-writer"
  orgId: string
  preferences: {
    defaultWritingGoals: WritingGoals
    autoSaveInterval: number
    showAdvancedSuggestions: boolean
    preferredTone: string
  }
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
