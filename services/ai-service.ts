import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import app, { auth } from '../lib/firebase';
import type { GrammarError } from '@/types/grammar';

const functions = getFunctions(app, 'us-central1');

const getCheckGrammarUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    // This needs to be the local function URL if using the emulator
    // Or your deployed function URL if testing against deployed functions
    return 'http://127.0.0.1:5001/wordwise-ai-mvp/us-central1/checkGrammar';
  }
  // This should be your production function URL
  return 'https://us-central1-wordwise-ai-mvp.cloudfunctions.net/checkGrammar';
}

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

  static async checkGrammar(documentId: string, text: string): Promise<GrammarError[]> {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found.");
      throw new Error("You must be logged in to check grammar.");
    }

    try {
      const token = await user.getIdToken();
      console.log(`[AIService] Checking grammar for document ${documentId}`);
      
      const response = await fetch(getCheckGrammarUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: { documentId, text } })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error from checkGrammar function:", errorData);
        throw new Error(errorData.error?.message || "Failed to check grammar.");
      }

      const result = await response.json();
      const grammarResult = result.data as GrammarCheckResult;
      console.log(`[AIService] Received ${grammarResult.errors.length} errors from backend in ${grammarResult.latency}ms.`);
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
