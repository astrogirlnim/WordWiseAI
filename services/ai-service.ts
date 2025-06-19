import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import app, { auth } from '../lib/firebase';
import type { GrammarError } from '@/types/grammar';
import type { AISuggestion } from '@/types/ai-features';
import type { WritingGoals } from '@/types/writing-goals';

const functions = getFunctions(app, 'us-central1');

interface GrammarCheckPayload {
  documentId: string;
  text: string;
}

interface GrammarCheckResult {
  errors: GrammarError[];
  latency: number;
}

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

  static async checkGrammar(documentId: string, text: string): Promise<GrammarError[]> {
    console.log(`[AIService] Checking grammar for document ${documentId}, text length: ${text.length}`);
    
    const checkGrammarCallable = httpsCallable<
      { documentId: string; text: string }, 
      GrammarCheckResult
    >(functions, 'checkGrammar');

    try {
      console.log(`[AIService] Calling Firebase Function checkGrammar for document ${documentId}`);
      const result = await checkGrammarCallable({ documentId, text });
      const grammarResult = result.data;
      
      console.log(`[AIService] Received ${grammarResult.errors.length} grammar errors from backend in ${grammarResult.latency}ms.`);
      return grammarResult.errors;

    } catch (error) {
      console.error("Error calling checkGrammar function: ", error);
      throw new Error("Failed to check grammar.");
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
