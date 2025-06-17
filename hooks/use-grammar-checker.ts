import { useState, useEffect, useCallback, useRef } from 'react';
import { AIService } from '@/services/ai-service';
import type { GrammarError } from '@/types/grammar';
import { debounce } from 'lodash';

const DEBOUNCE_DELAY = 500; // ms
const MIN_TEXT_LENGTH = 10;
const THROTTLE_INTERVAL = 2000; // 30 req/min -> 1 req every 2s

export function useGrammarChecker(documentId: string, plainText: string) {
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const lastRequestTime = useRef<number>(0);

  const removeError = useCallback((errorId: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== errorId));
  }, []);

  const ignoreError = useCallback((errorId: string) => {
    // For now, ignoring is the same as removing.
    // This could be extended to add to a persistent ignore list.
    removeError(errorId);
  }, [removeError]);

  const checkGrammar = useCallback(async (currentText: string) => {
    if (currentText.length < MIN_TEXT_LENGTH) {
      setErrors([]);
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime.current < THROTTLE_INTERVAL) {
      console.log('[useGrammarChecker] Throttled request');
      return;
    }

    setIsChecking(true);
    lastRequestTime.current = now;
    
    try {
      console.log(`[useGrammarChecker] Sending text to backend. Length: ${currentText.length}`);
      const grammarErrors = await AIService.checkGrammar(documentId, currentText);
      const errorsWithTimestamp = grammarErrors.map(e => ({ ...e, shownAt: Date.now() }));
      setErrors(errorsWithTimestamp);
      console.log(`[useGrammarChecker] Received ${errorsWithTimestamp.length} errors.`);
    } catch (error) {
      console.error('[useGrammarChecker] Failed to check grammar:', error);
      // Optionally, set an error state to show in the UI
    } finally {
      setIsChecking(false);
    }
  }, [documentId]);

  const debouncedCheck = useCallback(debounce(checkGrammar, DEBOUNCE_DELAY), [checkGrammar]);

  useEffect(() => {
    if (plainText) {
        debouncedCheck(plainText);
    } else {
        setErrors([]);
        debouncedCheck.cancel();
    }
    
    return () => {
      debouncedCheck.cancel();
    };
  }, [plainText, debouncedCheck]);

  return { errors, isChecking, removeError, ignoreError, checkGrammarImmediately: checkGrammar };
} 