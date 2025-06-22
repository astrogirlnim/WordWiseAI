import type { WritingGoals } from "./writing-goals"

/**
 * Demo progress tracking interface for onboarding flow
 * Tracks user's progress through the 7-step demo experience
 */
export interface DemoProgress {
  /** Whether user has ever seen the demo modal */
  hasSeenDemo: boolean
  /** Array of completed step numbers (1-7) */
  completedSteps: number[]
  /** Highest step number the user has reached */
  lastStepReached: number
  /** When the demo was fully completed (all 7 steps) */
  completionDate?: number
  /** Number of times user has skipped the demo */
  skipCount: number
  /** Whether user has completely finished the demo */
  isCompleted: boolean
  /** Timestamp when demo was first started */
  firstStartedAt?: number
  /** Total time spent in demo (milliseconds) */
  totalTimeSpent: number
}

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
  /** Demo progress tracking for onboarding experience */
  demoProgress?: DemoProgress
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
