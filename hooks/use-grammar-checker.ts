import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { GrammarError } from '@/types/grammar';
import { debounce } from 'lodash';

const DEBOUNCE_DELAY = 2000; // ms - Phase 2: 2 seconds debounce
const MIN_TEXT_LENGTH = 10;

/**
 * Progress state for multi-chunk processing
 * @deprecated Removed in Phase 1 - Harper.js migration
 */
interface ChunkProgress {
  totalChunks: number;
  completedChunks: number;
  processingChunks: number;
  isProcessing: boolean;
}

/**
 * Enhanced grammar checker hook - Phase 1: Stub implementation
 * 
 * PHASE 1 STATUS: Legacy AI/Cloud Function grammar checking has been removed.
 * This hook now returns empty grammar errors and provides stub implementations
 * of all methods to maintain interface compatibility.
 * 
 * TODO (Phase 2): Integrate Harper.js for local grammar checking
 */
export function useGrammarChecker(
  documentId: string, 
  plainText: string,
  visibleRange?: { start: number; end: number },
  contentCoordinatorRef?: React.RefObject<any> // Phase 2: Add coordinator reference
) {
  // Phase 1: Return empty state - no grammar checking active
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress>({
    totalChunks: 0,
    completedChunks: 0,
    processingChunks: 0,
    isProcessing: false
  });

  console.log(`[useGrammarChecker] Phase 1: Stub implementation active for document ${documentId} - grammar checking disabled`);

  /**
   * Phase 1: Stub implementation - removes error from local state only
   */
  const removeError = useCallback((errorId: string) => {
    console.log(`[useGrammarChecker] Phase 1: Stub - removing error ${errorId}`);
    setErrors(prevErrors => prevErrors.filter(error => error.id !== errorId));
  }, []);

  /**
   * Phase 1: Stub implementation - same as removeError
   */
  const ignoreError = useCallback((errorId: string) => {
    console.log(`[useGrammarChecker] Phase 1: Stub - ignoring error ${errorId}`);
    removeError(errorId);
  }, [removeError]);

  /**
   * Phase 1: Stub implementation - no grammar checking performed
   */
  const checkGrammar = useMemo(() => debounce(async (currentText: string) => {
    console.log(`[useGrammarChecker] Phase 1: Stub - checkGrammar called with text length: ${currentText.length}`);
    
    if (currentText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Phase 1: Stub - text too short, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    console.log('[useGrammarChecker] Phase 1: Stub - no grammar checking performed, Harper.js integration coming in Phase 2');
    setIsChecking(false);
    setErrors([]); // Phase 1: Always return empty errors
  }, DEBOUNCE_DELAY), []);

  /**
   * Phase 1: Stub implementation - no immediate checking performed
   */
  const checkGrammarImmediately = useCallback((currentText: string) => {
    console.log(`[useGrammarChecker] Phase 1: Stub - checkGrammarImmediately called with text length: ${currentText.length}`);
    
    if (currentText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Phase 1: Stub - text too short, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    console.log('[useGrammarChecker] Phase 1: Stub - no immediate grammar checking performed');
    checkGrammar.cancel();
    checkGrammar(currentText);
  }, [checkGrammar]);

  /**
   * Phase 1: Stub implementation - no full document checking performed
   */
  const checkFullDocument = useCallback(async (fullText: string) => {
    console.log(`[useGrammarChecker] Phase 1: Stub - checkFullDocument called with ${fullText.length} characters`);
    
    if (fullText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Phase 1: Stub - full document text too short, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    console.log('[useGrammarChecker] Phase 1: Stub - no full document checking performed');
    setIsChecking(false);
    setErrors([]); // Phase 1: Always return empty errors
  }, []);

  // Phase 1: Clear errors when visible range changes (page change)
  useEffect(() => {
    console.log(`[useGrammarChecker] Phase 1: Stub - visible range changed, clearing errors`);
    setErrors([]); // Always clear errors in stub mode
  }, [visibleRange]);

  // Phase 1: Stub - no automatic grammar checking on text changes
  useEffect(() => {
    console.log(`[useGrammarChecker] Phase 1: Stub - text changed, no automatic checking performed`);
    if (plainText.length >= MIN_TEXT_LENGTH) {
      // Do nothing in stub mode
    } else {
      setErrors([]);
    }
  }, [plainText, checkGrammar, visibleRange]);

  // Cleanup function to cancel any pending debounced calls
  useEffect(() => {
    return () => {
      checkGrammar.cancel();
    };
  }, [checkGrammar]);

  console.log(`[useGrammarChecker] Phase 1: Stub - returning empty grammar state for document ${documentId}`);
  
  return { 
    errors, 
    isChecking, 
    chunkProgress, 
    removeError, 
    ignoreError, 
    checkGrammarImmediately, 
    checkFullDocument 
  };
} 