// AI Service is disabled for MVP. All methods are stubs.

import { getFunctions, httpsCallable } from 'firebase/functions'
import type { AISuggestion } from '@/types/ai-features'

const functions = getFunctions()

const generateSuggestionsCallable = httpsCallable<
  { text: string },
  { suggestions: AISuggestion[] }
>(functions, 'generateSuggestions')

export async function getAiSuggestions(text: string): Promise<AISuggestion[]> {
  try {
    const result = await generateSuggestionsCallable({ text })
    return result.data.suggestions
  } catch (error) {
    console.error('Error calling generateSuggestions function:', error)
    // You might want to throw a custom error or handle it differently
    throw new Error('Failed to get AI suggestions.')
  }
}

export class AIService {
  static async generateAnalysis() {
    throw new Error('AI analysis is coming soon.')
  }

  static async saveSuggestionFeedback() {
    throw new Error('AI suggestion feedback is coming soon.')
  }

  static async getUserSuggestionHistory() {
    return []
  }
}
