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

  console.log(`[useGrammarChecker] Phase 5: Harper.js integration active for document ${documentId}`);

  // Pre-warm Harper.js on first load
  useEffect(() => {
    console.log('[useGrammarChecker] Phase 5: Pre-warming useEffect triggered');
    console.log('[useGrammarChecker] Phase 5: Window available:', typeof window !== 'undefined');
    console.log('[useGrammarChecker] Phase 5: Initialization attempted:', initializationAttempted.current);
    
    // Ensure we're in the browser
    if (typeof window === 'undefined') {
      console.warn('[useGrammarChecker] Phase 5: Skipping Harper.js pre-warm - server side');
      return;
    }
    
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      console.log('[useGrammarChecker] Phase 5: Pre-warming Harper.js...');
      
      preWarmHarper()
        .then((success) => {
          console.log(`[useGrammarChecker] Phase 5: Harper.js pre-warm ${success ? 'successful' : 'failed'}`);
          setIsHarperReady(success);
          
          // If failed, try once more after a short delay
          if (!success) {
            console.log('[useGrammarChecker] Phase 5: Retrying Harper.js initialization in 1 second...');
            setTimeout(() => {
              preWarmHarper()
                .then((retrySuccess) => {
                  console.log(`[useGrammarChecker] Phase 5: Harper.js retry ${retrySuccess ? 'successful' : 'failed'}`);
                  setIsHarperReady(retrySuccess);
                })
                .catch((retryError) => {
                  console.error('[useGrammarChecker] Phase 5: Harper.js retry error:', retryError);
                  setIsHarperReady(false);
                });
            }, 1000);
          }
        })
        .catch((error) => {
          console.error('[useGrammarChecker] Phase 5: Harper.js pre-warm error:', error);
          setIsHarperReady(false);
        });
    } else {
      console.log('[useGrammarChecker] Phase 5: Harper.js initialization already attempted');
    }
  }, []);

  /**
   * Remove error from local state
   */
  const removeError = useCallback((errorId: string) => {
    console.log(`[useGrammarChecker] Phase 5: Removing grammar error ${errorId}`);
    setErrors(prevErrors => prevErrors.filter(error => error.id !== errorId));
  }, []);

  /**
   * Ignore error (same as remove for now, but could be extended for user preferences)
   */
  const ignoreError = useCallback((errorId: string) => {
    console.log(`[useGrammarChecker] Phase 5: Ignoring grammar error ${errorId}`);
    removeError(errorId);
  }, [removeError]);

  /**
   * Core grammar checking function using Harper.js
   */
  const performGrammarCheck = useCallback(async (textToCheck: string): Promise<GrammarError[]> => {
    console.log(`[useGrammarChecker] Phase 5: Performing Harper.js grammar check on ${textToCheck.length} characters`);
    console.log(`[useGrammarChecker] Phase 5: Text sent to Harper.js (first 200 chars):`, textToCheck.substring(0, 200));
    
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
      
      console.log(`[useGrammarChecker] Phase 5: \u2705 Harper.js check completed in ${duration}ms - Found ${grammarErrors.length} errors`);
      console.log(`[useGrammarChecker] Phase 5: Errors returned from Harper.js:`, grammarErrors);
      
      // Log error breakdown by type
      const errorTypes = grammarErrors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`[useGrammarChecker] Phase 5: Error breakdown:`, errorTypes);

      setChunkProgress({
        totalChunks: 1,
        completedChunks: 1,
        processingChunks: 0,
        isProcessing: false
      });

      return grammarErrors;
      
    } catch (error) {
      console.error('[useGrammarChecker] Phase 5: \u274c Harper.js grammar check failed:', error);
      
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

  // --- FIX: Use useRef for stable debounced function ---
  const performGrammarCheckRef = useRef(performGrammarCheck);
  useEffect(() => {
    performGrammarCheckRef.current = performGrammarCheck;
  }, [performGrammarCheck]);

  const checkGrammarRef = useRef<((currentText: string) => void) | null>(null);
  if (!checkGrammarRef.current) {
    checkGrammarRef.current = debounce(async (currentText: string) => {
      console.log(`[useGrammarChecker] Phase 5: Debounced grammar check triggered - Text length: ${currentText.length}`);
      if (currentText.length < MIN_TEXT_LENGTH) {
        console.log('[useGrammarChecker] Phase 5: Text too short, clearing errors');
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
        console.warn('[useGrammarChecker] Phase 5: Harper.js not initialized, skipping check');
        return;
      }
      const grammarErrors = await performGrammarCheckRef.current(currentText);
      setErrors(grammarErrors);
    }, DEBOUNCE_DELAY);
  }

  // --- FIX: Effect only depends on plainText and isHarperReady ---
  useEffect(() => {
    if (plainText.length >= MIN_TEXT_LENGTH && isHarperReady) {
      checkGrammarRef.current && checkGrammarRef.current(plainText);
    } else {
      setErrors([]);
    }
  }, [plainText, isHarperReady]);

  /**
   * Immediate grammar checking (cancels debounced check)
   */
  const checkGrammarImmediately = useCallback(async (currentText: string) => {
    console.log(`[useGrammarChecker] Phase 5: Immediate grammar check requested - Text length: ${currentText.length}`);
    
    if (checkGrammarRef.current && typeof (checkGrammarRef.current as any).cancel === 'function') {
      (checkGrammarRef.current as any).cancel();
    }
    
    // Check Harper.js status
    const harperStatus = getHarperStatus();
    if (!harperStatus.isInitialized && !harperStatus.isInitializing) {
      console.warn('[useGrammarChecker] Phase 5: Harper.js not initialized for immediate check');
      return;
    }

    const grammarErrors = await performGrammarCheck(currentText);
    setErrors(grammarErrors);
  }, [performGrammarCheck]);

  /**
   * Full document grammar checking
   */
  const checkFullDocument = useCallback(async (fullText: string) => {
    console.log(`[useGrammarChecker] Phase 5: Full document check requested - ${fullText.length} characters`);
    
    if (fullText.length < MIN_TEXT_LENGTH) {
      console.log('[useGrammarChecker] Phase 5: Full document text too short, clearing errors');
      setErrors([]);
      setChunkProgress({
        totalChunks: 0,
        completedChunks: 0,
        processingChunks: 0,
        isProcessing: false
      });
      return;
    }

    const harperStatus = getHarperStatus();
    if (!harperStatus.isInitialized && !harperStatus.isInitializing) {
      console.warn('[useGrammarChecker] Phase 5: Harper.js not initialized for full document check');
      return;
    }

    const grammarErrors = await performGrammarCheck(fullText);
    setErrors(grammarErrors);
  }, [performGrammarCheck]);

  // Clear errors when visible range changes (page navigation)
  useEffect(() => {
    console.log(`[useGrammarChecker] Phase 5: Visible range changed, maintaining existing errors`);
    // In Phase 5, we keep existing errors across page changes for better UX
    // The TipTap extension will handle visibility based on the range
  }, [visibleRange]);

  // Cleanup function to cancel any pending debounced calls
  useEffect(() => {
    return () => {
      console.log('[useGrammarChecker] Phase 5: Cleaning up debounced grammar checks');
      if (checkGrammarRef.current && typeof (checkGrammarRef.current as any).cancel === 'function') {
        (checkGrammarRef.current as any).cancel();
      }
    };
  }, []);

  // Log current state for debugging
  useEffect(() => {
    const harperStatus = getHarperStatus();
    console.log(`[useGrammarChecker] Phase 5: Current state - Document: ${documentId}, Errors: ${errors.length}, Checking: ${isChecking}, Harper Ready: ${isHarperReady}, Harper Status:`, harperStatus);
  }, [documentId, errors.length, isChecking, isHarperReady]);

  console.log(`[useGrammarChecker] Phase 5: Returning grammar state - ${errors.length} errors, checking: ${isChecking}, Harper ready: ${isHarperReady}`);
  
  return {
    errors,
    isChecking,
    isGrammarCheckReady: isHarperReady,
    chunkProgress,
    checkGrammar: checkGrammarRef.current,
    checkGrammarImmediately,
    removeError,
    ignoreError,
    applySuggestion: applySuggestionWithHarper,
    checkFullDocument,
    harperStatus: getHarperStatus(),
  };
} 