import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';
import type { WritingGoals } from '@/types/writing-goals';
import type { FunnelSuggestionsResponse } from '@/types/ai-features';

const functions = getFunctions(app, 'us-central1');

export class AIService {
  static async generateSuggestion(text: string): Promise<string> {
    const generateSuggestionsCallable = httpsCallable<{ text: string }, { suggestion: string }>(functions, 'generateSuggestions');
    try {
      const result = await generateSuggestionsCallable({ text });
      return result.data.suggestion;
    } catch (error) {
      console.error("Error calling generateSuggestions function: ", error);
      throw new Error("Failed to generate suggestions.");
    }
  }

  static async generateStyleSuggestions(documentId: string, text: string, goals?: WritingGoals): Promise<void> {
    console.log('[AIService] Triggering style suggestion generation...', { documentId, textLength: text.length, goals });
    
    const callable = httpsCallable<
      { documentId: string; text: string; goals?: WritingGoals }, 
      { success: boolean; suggestionsAdded: number }
    >(functions, 'generateStyleSuggestions');

    try {
      const result = await callable({ documentId, text, goals });
      console.log(`[AIService] Successfully triggered style suggestion generation. Added ${result.data.suggestionsAdded} suggestions.`);
    } catch (error) {
      console.error("Error calling generateStyleSuggestions function: ", error);
      throw new Error("Failed to trigger style suggestion generation.");
    }
  }



  /**
   * Generates funnel-specific copy suggestions based on writing goals and current content
   * @param documentId - The document ID to generate suggestions for
   * @param goals - Writing goals to tailor suggestions
   * @param currentDraft - Current document content for context
   * @param documentTitle - The title of the document
   * @returns Promise with funnel suggestions
   */
  static async generateFunnelSuggestions(
    documentId: string, 
    goals: WritingGoals, 
    currentDraft: string = '',
    documentTitle: string = ''
  ): Promise<FunnelSuggestionsResponse> {
    console.log('[AIService] Generating funnel suggestions...', { 
      documentId, 
      goals, 
      draftLength: currentDraft.length,
      documentTitle
    });
    
    const callable = httpsCallable<
      { 
        documentId: string; 
        goals: WritingGoals; 
        currentDraft: string;
        documentTitle: string;
      }, 
      FunnelSuggestionsResponse
    >(functions, 'generateFunnelSuggestions');

    try {
      console.log('[AIService] Calling Firebase Function generateFunnelSuggestions');
      const result = await callable({ documentId, goals, currentDraft, documentTitle });
      const response = result.data;
      
      console.log(`[AIService] Generated ${response.suggestions.length} funnel suggestions successfully`);
      return response;

    } catch (error) {
      console.error('[AIService] Error calling generateFunnelSuggestions function:', error);
      throw new Error('Failed to generate funnel suggestions.');
    }
  }

  static async getHealthCheck() {
    // This would typically call the healthCheck endpoint, 
    // but direct client-to-function HTTP calls are more complex to set up securely.
    // For now, we will assume the health check is done by other means (e.g. uptime monitoring services)
    console.log("Health check for AI service is done via external monitoring.");
    return { status: "ok" };
  }
}
