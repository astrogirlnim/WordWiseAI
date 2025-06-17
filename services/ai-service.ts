import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';

const functions = getFunctions(app);

// Define the callable function
const generateSuggestionsCallable = httpsCallable<{ text: string }, { suggestion: string }>(functions, 'generateSuggestions');

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

  static async getHealthCheck() {
    // This would typically call the healthCheck endpoint, 
    // but direct client-to-function HTTP calls are more complex to set up securely.
    // For now, we will assume the health check is done by other means (e.g. uptime monitoring services)
    console.log("Health check for AI service is done via external monitoring.");
    return { status: "ok" };
  }
}
