import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';

const functions = getFunctions(app);

// Define the callable functions
const generateSuggestionsCallable = httpsCallable<{ text: string }, { suggestion: string }>(functions, 'generateSuggestions');
const checkGrammarAndSpellingCallable = httpsCallable<{ text: string }, { errors: GrammarError[], latency: number }>(functions, 'checkGrammarAndSpelling');

export interface GrammarError {
  type: 'grammar' | 'spelling';
  message: string;
  start: number;
  end: number;
  suggestions: string[];
}

export class AIService {
  static async generateSuggestion(text: string): Promise<string> {
    try {
      const result = await generateSuggestionsCallable({ text });
      return result.data.suggestion;
    } catch (error) {
      console.error("Error calling generateSuggestions function: ", error);
      throw new Error("Failed to generate suggestions.");
    }
  }

  static async checkGrammarAndSpelling(text: string): Promise<{ errors: GrammarError[], latency: number }> {
    try {
      console.log('[AIService] Checking grammar and spelling for text length:', text.length);
      const startTime = Date.now();
      const result = await checkGrammarAndSpellingCallable({ text });
      const endTime = Date.now();
      const clientLatency = endTime - startTime;
      
      console.log('[AIService] Grammar check completed', { 
        serverLatency: result.data.latency, 
        clientLatency,
        errorsFound: result.data.errors.length 
      });
      
      // Log latency for monitoring
      if (result.data.latency > 2000) {
        console.warn('[AIService] Grammar check latency exceeded 2s threshold:', result.data.latency);
      }
      
      return result.data;
    } catch (error) {
      console.error("Error calling checkGrammarAndSpelling function: ", error);
      throw new Error("Failed to check grammar and spelling.");
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
