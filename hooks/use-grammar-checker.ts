import { useState, useEffect, useCallback, useRef } from 'react';
import { AIService } from '@/services/ai-service';
import type { GrammarError } from '@/types/grammar';
import { TextChunker, type TextChunk } from '@/utils/text-chunker';
import { debounce } from 'lodash';

const DEBOUNCE_DELAY = 500; // ms
const MIN_TEXT_LENGTH = 10;
const THROTTLE_INTERVAL = 2000; // 30 req/min -> 1 req every 2s
const MAX_CONCURRENT_CHUNKS = 2; // Lowered for backend safety
const CHUNK_THRESHOLD = 5000; // Increased to match new chunk size

/**
 * Progress state for multi-chunk processing
 */
interface ChunkProgress {
  totalChunks: number;
  completedChunks: number;
  processingChunks: number;
  isProcessing: boolean;
}

/**
 * Enhanced grammar checker hook with pagination-scoped processing
 * Phase 6.1: Only processes visible page text to avoid rate limiting and improve performance
 */
export function useGrammarChecker(
  documentId: string, 
  plainText: string,
  visibleRange?: { start: number; end: number }
) {
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress>({
    totalChunks: 0,
    completedChunks: 0,
    processingChunks: 0,
    isProcessing: false
  });
  const lastRequestTime = useRef<number>(0);
  const textChunker = useRef(new TextChunker());
  const abortController = useRef<AbortController | null>(null);
  const activeProcessingSession = useRef<string | null>(null); // Phase 6.1: Track active session

  console.log(`[useGrammarChecker] Hook initialized for document ${documentId}`);

  const removeError = useCallback((errorId: string) => {
    console.log(`[useGrammarChecker] Removing error ${errorId}`);
    setErrors(prevErrors => prevErrors.filter(error => error.id !== errorId));
  }, []);

  const ignoreError = useCallback((errorId: string) => {
    // For now, ignoring is the same as removing.
    // This could be extended to add to a persistent ignore list.
    console.log(`[useGrammarChecker] Ignoring error ${errorId}`);
    removeError(errorId);
  }, [removeError]);

  /**
   * Phase 6.1: Extract visible page text only
   */
  const getVisiblePageText = useCallback((fullText: string, range?: { start: number; end: number }): string => {
    if (!range) {
      console.log(`[useGrammarChecker] No visible range provided, using full text (${fullText.length} chars)`);
      return fullText;
    }
    
    const visibleText = fullText.substring(range.start, range.end);
    console.log(`[useGrammarChecker] Extracted visible page text: ${visibleText.length} chars from range ${range.start}-${range.end}`);
    return visibleText;
  }, []);

  /**
   * Processes a single chunk with error handling and position mapping
   */
  const processChunk = useCallback(async (chunk: TextChunk, documentId: string, sessionId: string): Promise<GrammarError[]> => {
    console.log(`[useGrammarChecker] Processing chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} (${chunk.text.length} chars) for session ${sessionId}`);
    
    // Phase 6.1: Check if this session is still active
    if (activeProcessingSession.current !== sessionId) {
      console.log(`[useGrammarChecker] Session ${sessionId} cancelled, skipping chunk ${chunk.chunkIndex + 1}`);
      return [];
    }
    
    try {
      const chunkErrors = await AIService.checkGrammarChunk(documentId, chunk);
      
      // Phase 6.1: Check again after async operation
      if (activeProcessingSession.current !== sessionId) {
        console.log(`[useGrammarChecker] Session ${sessionId} cancelled after API call, discarding chunk ${chunk.chunkIndex + 1} results`);
        return [];
      }
      
      // Map chunk errors to original document positions
      const mappedErrors = chunkErrors.map(error => {
        const originalPosition = textChunker.current.mapErrorToOriginalPosition(
          { start: error.start, end: error.end },
          chunk
        );
        
        console.log(`[useGrammarChecker] Mapped error from chunk position ${error.start}-${error.end} to document position ${originalPosition.start}-${originalPosition.end}`);
        
        return {
          ...error,
          start: originalPosition.start,
          end: originalPosition.end,
          shownAt: Date.now()
        };
      });

      console.log(`[useGrammarChecker] Chunk ${chunk.chunkIndex + 1} completed with ${mappedErrors.length} errors for session ${sessionId}`);
      return mappedErrors;
    } catch (error: any) {
      console.error(`[useGrammarChecker] Error processing chunk ${chunk.chunkIndex + 1} for session ${sessionId}:`, error);
      return [];
    }
  }, []);

  /**
   * Processes chunks in parallel with concurrency control
   * Phase 6.1: Added session tracking for cancellation
   */
  const processChunksInParallel = useCallback(async (chunks: TextChunk[], documentId: string, sessionId: string): Promise<GrammarError[]> => {
    console.log(`[useGrammarChecker] Starting parallel processing of ${chunks.length} chunks (max ${MAX_CONCURRENT_CHUNKS} concurrent) for session ${sessionId}`);
    
    const allErrors: GrammarError[] = [];
    const processingQueue = [...chunks];
    const activePromises: Promise<void>[] = [];

    // Update progress state
    setChunkProgress({
      totalChunks: chunks.length,
      completedChunks: 0,
      processingChunks: 0,
      isProcessing: true
    });

    /**
     * Processes the next chunk in the queue
     */
    const processNext = async (): Promise<void> => {
      if (processingQueue.length === 0) return;
      
      // Phase 6.1: Check if session is still active
      if (activeProcessingSession.current !== sessionId) {
        console.log(`[useGrammarChecker] Session ${sessionId} cancelled, stopping processNext`);
        return;
      }
      
      const chunk = processingQueue.shift()!;
      
      // Update processing count
      setChunkProgress(prev => ({
        ...prev,
        processingChunks: prev.processingChunks + 1
      }));

      try {
        const chunkErrors = await processChunk(chunk, documentId, sessionId);
        
        // Phase 6.1: Only add errors if session is still active
        if (activeProcessingSession.current === sessionId) {
          allErrors.push(...chunkErrors);

          // Update streaming errors as chunks complete
          setErrors(prevErrors => {
            const combinedErrors = [...prevErrors, ...chunkErrors];
            const deduplicatedErrors = textChunker.current.deduplicateOverlapErrors(
              combinedErrors.map(e => ({ start: e.start, end: e.end, error: e.error, id: e.id }))
            );
            // Map back to GrammarError objects
            const finalErrors = deduplicatedErrors.map(dedupError => {
              const originalError = combinedErrors.find(e => e.id === dedupError.id);
              return (originalError as GrammarError) || ({ ...dedupError, suggestions: [], explanation: '', type: 'grammar', severity: 'medium' } as GrammarError);
            });
            console.log(`[useGrammarChecker] Updated errors after chunk ${chunk.chunkIndex + 1} (session ${sessionId}): ${finalErrors.length} total errors`);
            return finalErrors;
          });
        }

      } catch (error) {
        console.error(`[useGrammarChecker] Error in processNext for chunk ${chunk.chunkIndex + 1} (session ${sessionId}):`, error);
      } finally {
        // Update progress
        setChunkProgress(prev => ({
          ...prev,
          completedChunks: prev.completedChunks + 1,
          processingChunks: prev.processingChunks - 1
        }));
      }
    };

    // Start initial concurrent requests
    for (let i = 0; i < Math.min(MAX_CONCURRENT_CHUNKS, chunks.length); i++) {
        const promise = processNext();
        if (promise) {
            activePromises.push(promise);
        }
    }

    // Process remaining chunks as others complete
    while (activePromises.length > 0 && activeProcessingSession.current === sessionId) {
      await Promise.race(activePromises);
      
      // Remove completed promises and start new ones
      const completedIndex = activePromises.findIndex(p => 
        p.then !== undefined // Simple check for completed promise
      );
      
      if (completedIndex !== -1) {
        activePromises.splice(completedIndex, 1);
      }
      
      // Add new chunk if available
      if (processingQueue.length > 0) {
        activePromises.push(processNext());
      }
    }

    // Wait for all remaining promises if session is still active
    if (activeProcessingSession.current === sessionId) {
      await Promise.all(activePromises);
    }

    console.log(`[useGrammarChecker] Parallel processing completed for session ${sessionId}. Total errors: ${allErrors.length}`);
    
    // Final deduplication across all chunks
    const deduplicatedSimpleErrors = textChunker.current.deduplicateOverlapErrors(
      allErrors.map(e => ({ start: e.start, end: e.end, error: e.error, id: e.id }))
    );
    // Map back to GrammarError objects
    const finalErrors = deduplicatedSimpleErrors.map(dedupError => {
      const originalError = allErrors.find(e => e.id === dedupError.id);
      return (originalError as GrammarError) || ({ ...dedupError, suggestions: [], explanation: '', type: 'grammar', severity: 'medium' } as GrammarError);
    });
    console.log(`[useGrammarChecker] Final deduplication resulted in ${finalErrors.length} errors for session ${sessionId}`);

    // Update progress to completed
    setChunkProgress(prev => ({
      ...prev,
      isProcessing: false
    }));

    return finalErrors;
  }, [processChunk]);

  /**
   * Main grammar checking function with pagination-scoped processing
   * Phase 6.1: Only processes visible page text, no background processing
   */
  const checkGrammar = useCallback(debounce(async (currentText: string) => {
    console.log(`[useGrammarChecker] Starting grammar check for text length: ${currentText.length}`);
    
    // Phase 6.1: Extract only visible page text
    const visiblePageText = getVisiblePageText(currentText, visibleRange);
    
    if (visiblePageText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Visible page text too short, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime.current < THROTTLE_INTERVAL) {
      console.log('[useGrammarChecker] Request throttled');
      return;
    }

    // Phase 6.1: Cancel any ongoing processing session
    const sessionId = `${documentId}-${Date.now()}`;
    console.log(`[useGrammarChecker] Starting new processing session: ${sessionId}`);
    activeProcessingSession.current = sessionId;
    
    // Cancel any ongoing requests
    if (abortController.current) {
      console.log('[useGrammarChecker] Cancelling previous request');
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsChecking(true);
    lastRequestTime.current = now;
    
    try {
      if (visiblePageText.length <= CHUNK_THRESHOLD) {
        console.log(`[useGrammarChecker] Visible page text length (${visiblePageText.length}) below chunk threshold, using single request`);
        const grammarErrors = await AIService.checkGrammar(documentId, visiblePageText);
        
        // Phase 6.1: Check if session is still active before setting errors
        if (activeProcessingSession.current === sessionId) {
          // Phase 6.1: Adjust error positions to account for visible range offset
          const adjustedErrors = grammarErrors.map(error => ({
            ...error,
            start: error.start + (visibleRange?.start || 0),
            end: error.end + (visibleRange?.start || 0),
            shownAt: Date.now()
          }));
          
          setErrors(adjustedErrors);
          setChunkProgress({
            totalChunks: 1,
            completedChunks: 1,
            processingChunks: 0,
            isProcessing: false
          });
          console.log(`[useGrammarChecker] Single request completed for session ${sessionId} with ${adjustedErrors.length} errors`);
        } else {
          console.log(`[useGrammarChecker] Single request completed but session ${sessionId} was cancelled, discarding results`);
        }
      } else {
        // Phase 6.1: Chunk only the visible page text
        console.log(`[useGrammarChecker] Visible page text length (${visiblePageText.length}) above chunk threshold, chunking visible page only`);
        const visibleChunks = textChunker.current.chunkText(visiblePageText);
        
        // Phase 6.1: Adjust chunk positions to account for visible range offset
        const adjustedChunks = visibleChunks.map(chunk => ({
          ...chunk,
          originalStart: chunk.originalStart + (visibleRange?.start || 0),
          originalEnd: chunk.originalEnd + (visibleRange?.start || 0)
        }));
        
        console.log(`[useGrammarChecker] Created ${adjustedChunks.length} chunks for visible page (session ${sessionId})`);
        
        const allErrors = await processChunksInParallel(adjustedChunks, documentId, sessionId);
        
        // Phase 6.1: Only set errors if session is still active
        if (activeProcessingSession.current === sessionId) {
          setErrors(allErrors);
          console.log(`[useGrammarChecker] Chunked processing completed for session ${sessionId} with ${allErrors.length} total errors`);
        } else {
          console.log(`[useGrammarChecker] Chunked processing completed but session ${sessionId} was cancelled, discarding results`);
        }
      }
    } catch (error: any) {
      console.error(`[useGrammarChecker] Failed to check grammar for session ${sessionId}:`, error);
      setChunkProgress(prev => ({
        ...prev,
        isProcessing: false
      }));
    } finally {
      setIsChecking(false);
    }
  }, DEBOUNCE_DELAY), [documentId, visibleRange, processChunksInParallel, getVisiblePageText]);

  /**
   * Triggers an immediate grammar check, bypassing the debounce
   * Phase 6.1: Only processes visible page text
   */
  const checkGrammarImmediately = useCallback((currentText: string) => {
    const visiblePageText = getVisiblePageText(currentText, visibleRange);
    console.log(`[useGrammarChecker] Starting immediate grammar check for visible page text length: ${visiblePageText.length}`);
    
    if (visiblePageText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Visible page text too short, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    checkGrammar.cancel();
    checkGrammar(currentText);
  }, [checkGrammar, getVisiblePageText, visibleRange]);

  // Phase 6.1: Cancel processing when visible range changes (page change)
  useEffect(() => {
    if (activeProcessingSession.current) {
      console.log(`[useGrammarChecker] Visible range changed, cancelling active session: ${activeProcessingSession.current}`);
      activeProcessingSession.current = null;
      setErrors([]); // Clear errors when page changes
    }
  }, [visibleRange]);

  // Effect to automatically check grammar when plainText changes
  useEffect(() => {
    const visiblePageText = getVisiblePageText(plainText, visibleRange);
    if (visiblePageText.length >= MIN_TEXT_LENGTH) {
      checkGrammar(plainText);
    } else {
      setErrors([]);
    }
  }, [plainText, checkGrammar, getVisiblePageText, visibleRange]);

  // Cleanup function to cancel any pending debounced calls
  useEffect(() => {
    return () => {
      checkGrammar.cancel();
      activeProcessingSession.current = null;
    };
  }, [checkGrammar]);

  return { errors, isChecking, chunkProgress, removeError, ignoreError, checkGrammarImmediately };
} 