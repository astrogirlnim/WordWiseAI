import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';
import type { GrammarError } from '@/types/grammar';
import type { WritingGoals } from '@/types/writing-goals';
import type { TextChunk } from '@/utils/text-chunker';

const functions = getFunctions(app, 'us-central1');

interface GrammarCheckResult {
  errors: GrammarError[];
  latency: number;
}

/**
 * Result from chunk-based grammar checking
 */
interface ChunkGrammarCheckResult {
  errors: GrammarError[];
  latency: number;
  chunkId: string;
  chunkIndex: number;
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

  /**
   * Checks grammar for a specific text chunk with metadata
   * Used for chunked processing of large documents
   */
  static async checkGrammarChunk(documentId: string, chunk: TextChunk): Promise<GrammarError[]> {
    console.log(`[AIService] Checking grammar for chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} of document ${documentId}, text length: ${chunk.text.length}`);
    
    const checkGrammarCallable = httpsCallable<
      { 
        documentId: string; 
        text: string;
        chunkMetadata: {
          chunkId: string;
          chunkIndex: number;
          totalChunks: number;
          originalStart: number;
          originalEnd: number;
        }
      }, 
      ChunkGrammarCheckResult
    >(functions, 'checkGrammar');

    try {
      console.log(`[AIService] Calling Firebase Function checkGrammar for chunk ${chunk.chunkId}`);
      const result = await checkGrammarCallable({ 
        documentId, 
        text: chunk.text,
        chunkMetadata: {
          chunkId: chunk.chunkId,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          originalStart: chunk.originalStart,
          originalEnd: chunk.originalEnd
        }
      });
      const grammarResult = result.data;
      
      console.log(`[AIService] Received ${grammarResult.errors.length} grammar errors from chunk ${chunk.chunkId} in ${grammarResult.latency}ms.`);
      return grammarResult.errors;

    } catch (error) {
      console.error(`Error calling checkGrammar function for chunk ${chunk.chunkId}: `, error);
      throw new Error(`Failed to check grammar for chunk ${chunk.chunkId}.`);
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
