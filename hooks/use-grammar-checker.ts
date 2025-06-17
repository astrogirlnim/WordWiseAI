import { useState, useEffect, useCallback, useRef } from 'react';
import { AIService } from '@/services/ai-service';
import type { GrammarError } from '@/types/grammar';
import { debounce } from 'lodash';

const DEBOUNCE_DELAY = 500; // ms
const MIN_TEXT_LENGTH = 10;
const THROTTLE_INTERVAL = 2000; // 30 req/min -> 1 req every 2s

export function useGrammarChecker(documentId: string, text: string) {
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const lastRequestTime = useRef<number>(0);

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
      setErrors(grammarErrors);
      console.log(`[useGrammarChecker] Received ${grammarErrors.length} errors.`);
    } catch (error) {
      console.error('[useGrammarChecker] Failed to check grammar:', error);
      // Optionally, set an error state to show in the UI
    } finally {
      setIsChecking(false);
    }
  }, [documentId]);

  const debouncedCheck = useCallback(debounce(checkGrammar, DEBOUNCE_DELAY), [checkGrammar]);

  useEffect(() => {
    // We don't want to use the debounced check if the text is empty
    if (text) {
        debouncedCheck(text);
    } else {
        setErrors([]);
        debouncedCheck.cancel();
    }
    
    // Cleanup on unmount
    return () => {
      debouncedCheck.cancel();
    };
  }, [text, debouncedCheck]);

  return { errors, isChecking };
} 