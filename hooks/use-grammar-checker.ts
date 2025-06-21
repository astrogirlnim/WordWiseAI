import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { GrammarError } from '@/types/grammar';
import { debounce } from 'lodash';
import { 
  checkGrammarWithHarper, 
  applySuggestionWithHarper, 
  preWarmHarper, 
  getHarperStatus 
} from '@/utils/harper-wrapper';

const DEBOUNCE_DELAY = 2000; // ms - 2 seconds debounce for real-time checking
const MIN_TEXT_LENGTH = 10;

/**
 * Progress state for processing feedback
 */
interface ChunkProgress {
  totalChunks: number;
  completedChunks: number;
  processingChunks: number;
  isProcessing: boolean;
}

/**
 * Enhanced grammar checker hook - Phase 3: Harper.js Integration
 * 
 * PHASE 3 STATUS: Harper.js is now fully integrated for local grammar checking.
 * This hook provides real-time grammar, spelling, and style checking using
 * Harper.js WebAssembly module for privacy-first, offline grammar checking.
 * 
 * Features:
 * - Local grammar checking with Harper.js (no network requests)
 * - Sub-100ms performance for responsive real-time checking
 * - Support for grammar, spelling, style, clarity, and punctuation errors
 * - Debounced checking to prevent excessive processing
 * - Compatible with existing TipTap decorations and UI
 * - Pre-warming support for reduced first-use latency
 */
export function useGrammarChecker(
  documentId: string, 
  plainText: string,
  visibleRange?: { start: number; end: number },
  contentCoordinatorRef?: React.RefObject<any>
) {
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress>({
    totalChunks: 1,
    completedChunks: 0,
    processingChunks: 0,
    isProcessing: false
  });

  // Track initialization state
  const [isHarperReady, setIsHarperReady] = useState(false);
  const initializationAttempted = useRef(false);

  console.log(`[useGrammarChecker] Phase 3: Harper.js integration active for document ${documentId}`);

  // Pre-warm Harper.js on first load
  useEffect(() => {
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      console.log('[useGrammarChecker] Phase 3: Pre-warming Harper.js...');
      
      preWarmHarper()
        .then((success) => {
          console.log(`[useGrammarChecker] Phase 3: Harper.js pre-warm ${success ? 'successful' : 'failed'}`);
          setIsHarperReady(success);
        })
        .catch((error) => {
          console.error('[useGrammarChecker] Phase 3: Harper.js pre-warm error:', error);
          setIsHarperReady(false);
        });
    }
  }, []);

  /**
   * Remove error from local state
   */
  const removeError = useCallback((errorId: string) => {
    console.log(`[useGrammarChecker] Phase 3: Removing grammar error ${errorId}`);
    setErrors(prevErrors => prevErrors.filter(error => error.id !== errorId));
  }, []);

  /**
   * Ignore error (same as remove for now, but could be extended for user preferences)
   */
  const ignoreError = useCallback((errorId: string) => {
    console.log(`[useGrammarChecker] Phase 3: Ignoring grammar error ${errorId}`);
    removeError(errorId);
  }, [removeError]);

  /**
   * Core grammar checking function using Harper.js
   */
  const performGrammarCheck = useCallback(async (textToCheck: string): Promise<GrammarError[]> => {
    console.log(`[useGrammarChecker] Phase 3: Performing Harper.js grammar check on ${textToCheck.length} characters`);
    
    try {
      setIsChecking(true);
      setChunkProgress({
        totalChunks: 1,
        completedChunks: 0,
        processingChunks: 1,
        isProcessing: true
      });

      const startTime = performance.now();
      
      // Use Harper.js to check grammar
      const grammarErrors = await checkGrammarWithHarper(textToCheck, {
        language: 'plaintext',
        minTextLength: MIN_TEXT_LENGTH
      });

      const duration = Math.round(performance.now() - startTime);
      
      console.log(`[useGrammarChecker] Phase 3: ✅ Harper.js check completed in ${duration}ms - Found ${grammarErrors.length} errors`);
      
      // Log error breakdown by type
      const errorTypes = grammarErrors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`[useGrammarChecker] Phase 3: Error breakdown:`, errorTypes);

      setChunkProgress({
        totalChunks: 1,
        completedChunks: 1,
        processingChunks: 0,
        isProcessing: false
      });

      return grammarErrors;
      
    } catch (error) {
      console.error('[useGrammarChecker] Phase 3: ❌ Harper.js grammar check failed:', error);
      
      setChunkProgress({
        totalChunks: 1,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      
      return [];
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Debounced grammar checking for real-time editing
   */
  const checkGrammar = useMemo(() => debounce(async (currentText: string) => {
    console.log(`[useGrammarChecker] Phase 3: Debounced grammar check triggered - Text length: ${currentText.length}`);
    
    if (currentText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Phase 3: Text too short, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    // Check Harper.js status
    const harperStatus = getHarperStatus();
    if (!harperStatus.isInitialized && !harperStatus.isInitializing) {
      console.warn('[useGrammarChecker] Phase 3: Harper.js not initialized, skipping check');
      return;
    }

    const grammarErrors = await performGrammarCheck(currentText);
    setErrors(grammarErrors);
  }, DEBOUNCE_DELAY), [performGrammarCheck]);

  /**
   * Immediate grammar checking (cancels debounced check)
   */
  const checkGrammarImmediately = useCallback(async (currentText: string) => {
    console.log(`[useGrammarChecker] Phase 3: Immediate grammar check requested - Text length: ${currentText.length}`);
    
    if (currentText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Phase 3: Text too short for immediate check, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    // Cancel any pending debounced checks
    checkGrammar.cancel();
    
    // Check Harper.js status
    const harperStatus = getHarperStatus();
    if (!harperStatus.isInitialized && !harperStatus.isInitializing) {
      console.warn('[useGrammarChecker] Phase 3: Harper.js not initialized for immediate check');
      return;
    }

    const grammarErrors = await performGrammarCheck(currentText);
    setErrors(grammarErrors);
  }, [checkGrammar, performGrammarCheck]);

  /**
   * Full document grammar checking
   */
  const checkFullDocument = useCallback(async (fullText: string) => {
    console.log(`[useGrammarChecker] Phase 3: Full document check requested - ${fullText.length} characters`);
    
    if (fullText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Phase 3: Full document text too short, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    // Check Harper.js status
    const harperStatus = getHarperStatus();
    if (!harperStatus.isInitialized && !harperStatus.isInitializing) {
      console.warn('[useGrammarChecker] Phase 3: Harper.js not initialized for full document check');
      return;
    }

    const grammarErrors = await performGrammarCheck(fullText);
    setErrors(grammarErrors);
  }, [performGrammarCheck]);

  // Clear errors when visible range changes (page navigation)
  useEffect(() => {
    console.log(`[useGrammarChecker] Phase 3: Visible range changed, maintaining existing errors`);
    // In Phase 3, we keep existing errors across page changes for better UX
    // The TipTap extension will handle visibility based on the range
  }, [visibleRange]);

  // Automatic grammar checking on text changes
  useEffect(() => {
    console.log(`[useGrammarChecker] Phase 3: Text changed (${plainText.length} chars), triggering debounced check`);
    
    if (plainText.length >= MIN_TEXT_LENGTH && isHarperReady) {
      checkGrammar(plainText);
    } else if (plainText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Phase 3: Text below minimum length, clearing errors');
      setErrors([]);
    }
  }, [plainText, checkGrammar, isHarperReady]);

  // Cleanup function to cancel any pending debounced calls
  useEffect(() => {
    return () => {
      console.log('[useGrammarChecker] Phase 3: Cleaning up debounced grammar checks');
      checkGrammar.cancel();
    };
  }, [checkGrammar]);

  // Log current state for debugging
  useEffect(() => {
    const harperStatus = getHarperStatus();
    console.log(`[useGrammarChecker] Phase 3: Current state - Document: ${documentId}, Errors: ${errors.length}, Checking: ${isChecking}, Harper Ready: ${isHarperReady}, Harper Status:`, harperStatus);
  }, [documentId, errors.length, isChecking, isHarperReady]);

  console.log(`[useGrammarChecker] Phase 3: Returning grammar state - ${errors.length} errors, checking: ${isChecking}, Harper ready: ${isHarperReady}`);
  
  return {
    errors,
    isChecking,
    chunkProgress,
    removeError,
    ignoreError,
    checkGrammar,
    checkGrammarImmediately,
    checkFullDocument,
    isHarperReady,
    harperStatus: getHarperStatus(),
  };
} 