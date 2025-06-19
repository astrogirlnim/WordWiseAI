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
const PRIORITY_WORDS = 500;
const PRIORITY_CHARS = 4000;
const BACKGROUND_CHUNK_DELAY = 10000; // ms, more aggressive throttling

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
 * Enhanced grammar checker hook with chunked processing support
 * Implements intelligent text chunking for large documents with parallel processing
 * and prioritization for visible content.
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
   * Processes a single chunk with error handling and position mapping
   */
  const processChunk = useCallback(async (chunk: TextChunk, documentId: string): Promise<GrammarError[]> => {
    console.log(`[useGrammarChecker] Processing chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} (${chunk.text.length} chars)`);
    
    try {
      const chunkErrors = await AIService.checkGrammarChunk(documentId, chunk);
      
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

      console.log(`[useGrammarChecker] Chunk ${chunk.chunkIndex + 1} completed with ${mappedErrors.length} errors`);
      return mappedErrors;
         } catch (error: any) {
       console.error(`[useGrammarChecker] Error processing chunk ${chunk.chunkIndex + 1}:`, error);
       return [];
     }
  }, []);

  /**
   * Processes chunks in parallel with concurrency control
   */
  const processChunksInParallel = useCallback(async (chunks: TextChunk[], documentId: string): Promise<GrammarError[]> => {
    console.log(`[useGrammarChecker] Starting parallel processing of ${chunks.length} chunks (max ${MAX_CONCURRENT_CHUNKS} concurrent)`);
    
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
      
      const chunk = processingQueue.shift()!;
      
      // Update processing count
      setChunkProgress(prev => ({
        ...prev,
        processingChunks: prev.processingChunks + 1
      }));

      try {
        const chunkErrors = await processChunk(chunk, documentId);
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
           console.log(`[useGrammarChecker] Updated errors after chunk ${chunk.chunkIndex + 1}: ${finalErrors.length} total errors`);
           return finalErrors;
         });

      } catch (error) {
        console.error(`[useGrammarChecker] Error in processNext for chunk ${chunk.chunkIndex + 1}:`, error);
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
      activePromises.push(processNext());
    }

    // Process remaining chunks as others complete
    while (activePromises.length > 0) {
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

    // Wait for all remaining promises
    await Promise.all(activePromises);

    console.log(`[useGrammarChecker] Parallel processing completed. Total errors: ${allErrors.length}`);
    
         // Final deduplication across all chunks
     const deduplicatedSimpleErrors = textChunker.current.deduplicateOverlapErrors(
       allErrors.map(e => ({ start: e.start, end: e.end, error: e.error, id: e.id }))
     );
     // Map back to GrammarError objects
     const finalErrors = deduplicatedSimpleErrors.map(dedupError => {
       const originalError = allErrors.find(e => e.id === dedupError.id);
       return (originalError as GrammarError) || ({ ...dedupError, suggestions: [], explanation: '', type: 'grammar', severity: 'medium' } as GrammarError);
     });
     console.log(`[useGrammarChecker] Final deduplication resulted in ${finalErrors.length} errors`);

    // Update progress to completed
    setChunkProgress(prev => ({
      ...prev,
      isProcessing: false
    }));

    return finalErrors;
  }, [processChunk]);

  /**
   * Main grammar checking function with chunking logic
   */
  const checkGrammar = useCallback(async (currentText: string) => {
    console.log(`[useGrammarChecker] Starting grammar check for text length: ${currentText.length}`);
    
    if (currentText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Text too short, clearing errors');
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

    // Cancel any ongoing requests
    if (abortController.current) {
      console.log('[useGrammarChecker] Cancelling previous request');
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsChecking(true);
    lastRequestTime.current = now;
    
    try {
      if (currentText.length <= CHUNK_THRESHOLD) {
        console.log(`[useGrammarChecker] Text length (${currentText.length}) below chunk threshold, using single request`);
        const grammarErrors = await AIService.checkGrammar(documentId, currentText);
        const errorsWithTimestamp = grammarErrors.map(e => ({ ...e, shownAt: Date.now() }));
        setErrors(errorsWithTimestamp);
        setChunkProgress({
          totalChunks: 1,
          completedChunks: 1,
          processingChunks: 0,
          isProcessing: false
        });
      } else if (visibleRange) {
        // --- PAGINATION-AWARE CHUNKING ---
        console.log(`[useGrammarChecker] Pagination-aware chunking active. Visible range: ${visibleRange.start}-${visibleRange.end}`);
        
        const allChunks = textChunker.current.chunkText(currentText);

        const priorityChunks = allChunks.filter(chunk => {
            const { originalStart, originalEnd } = chunk;
            const { start, end } = visibleRange;
            // Check for overlap between chunk range and visible range
            return Math.max(originalStart, start) < Math.min(originalEnd, end);
        });

        const backgroundChunks = allChunks.filter(chunk => {
            const { originalStart, originalEnd } = chunk;
            const { start, end } = visibleRange;
            // No overlap
            return Math.max(originalStart, start) >= Math.min(originalEnd, end);
        });


        console.log(`[useGrammarChecker] Created ${priorityChunks.length} priority chunks and ${backgroundChunks.length} background chunks.`);
        
        // Immediately process priority chunks
        const priorityErrors = await processChunksInParallel(priorityChunks, documentId);
        setErrors(prevErrors => {
             const combined = [...prevErrors, ...priorityErrors];
             // Simple dedupe based on ID for now
             const uniqueErrors = Array.from(new Map(combined.map(e => [e.id, e])).values());
             return uniqueErrors;
        });
        
        // Process background chunks with a delay
        if (backgroundChunks.length > 0) {
            setTimeout(() => {
                console.log('[useGrammarChecker] Starting background check of non-visible chunks');
                processChunksInParallel(backgroundChunks, documentId).then(backgroundErrors => {
                    setErrors(prevErrors => {
                        const combined = [...prevErrors, ...backgroundErrors];
                        const uniqueErrors = Array.from(new Map(combined.map(e => [e.id, e])).values());
                        return uniqueErrors;
                    });
                });
            }, BACKGROUND_CHUNK_DELAY);
        }

      } else {
        // --- ORIGINAL PRIORITIZED CHUNKING LOGIC (if no visibleRange) ---
        console.log(`[useGrammarChecker] Text length (${currentText.length}) above chunk threshold, chunking...`);
        // This part is simplified, assuming pagination is the primary use case for large docs now.
        // A full implementation would retain the cursor-based prioritization here.
        const allChunks = textChunker.current.chunkText(currentText);
        const allErrors = await processChunksInParallel(allChunks, documentId);
        setErrors(allErrors);
      }
    } catch (error: any) {
      console.error('[useGrammarChecker] Failed to check grammar:', error);
      setChunkProgress(prev => ({
        ...prev,
        isProcessing: false
      }));
    } finally {
      setIsChecking(false);
    }
  }, [documentId, processChunksInParallel]);

  const debouncedCheck = useCallback(debounce(checkGrammar, DEBOUNCE_DELAY), [checkGrammar]);

  useEffect(() => {
    console.log(`[useGrammarChecker] Text changed for document ${documentId}, length: ${plainText?.length || 0}`);
    
    if (plainText) {
        debouncedCheck(plainText);
    } else {
        console.log('[useGrammarChecker] No text provided, clearing errors and cancelling checks');
        setErrors([]);
        setChunkProgress({
          totalChunks: 0,
          completedChunks: 0,
          processingChunks: 0,
          isProcessing: false
        });
        debouncedCheck.cancel();
    }
    
    return () => {
      console.log('[useGrammarChecker] Cleanup: cancelling debounced check');
      debouncedCheck.cancel();
    };
  }, [plainText, debouncedCheck]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useGrammarChecker] Unmounting: cancelling any active requests');
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return { 
    errors, 
    isChecking, 
    chunkProgress,
    removeError, 
    ignoreError, 
    checkGrammarImmediately: checkGrammar 
  };
} 