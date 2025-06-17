'use client'

import { useRef, useEffect, useCallback } from 'react'
import { AIService, type GrammarError } from '@/services/ai-service'

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      console.log('[useDebouncedCallback] Debounced function called with args:', args.length)
      
      // Store the latest arguments
      lastArgsRef.current = args
      
      if (timeoutRef.current) {
        console.log('[useDebouncedCallback] Clearing existing timeout')
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        console.log('[useDebouncedCallback] Executing debounced callback after', delay, 'ms delay')
        // Use the latest arguments stored
        if (lastArgsRef.current) {
          callbackRef.current(...lastArgsRef.current)
          lastArgsRef.current = null
        }
        timeoutRef.current = null
      }, delay)
    },
    [delay],
  ) as T
}

// Hook for auto-save functionality with content change tracking
export function useAutoSave<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 2000,
  options: {
    compareArgs?: (prev: Parameters<T>, current: Parameters<T>) => boolean
  } = {}
): T {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)
  const lastExecutedArgsRef = useRef<Parameters<T> | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const defaultCompareArgs = useCallback((prev: Parameters<T>, current: Parameters<T>) => {
    // Default comparison: check if arguments are deeply equal
    if (prev.length !== current.length) return false
    
    for (let i = 0; i < prev.length; i++) {
      if (prev[i] !== current[i]) {
        // For string arguments, trim and compare to ignore whitespace-only changes
        if (typeof prev[i] === 'string' && typeof current[i] === 'string') {
          if (prev[i].trim() !== current[i].trim()) {
            return false
          }
        } else {
          return false
        }
      }
    }
    return true
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      console.log('[useAutoSave] Auto-save function called')
      
      // Check if arguments have actually changed
      const compareArgs = options.compareArgs || defaultCompareArgs
      
      if (lastExecutedArgsRef.current && compareArgs(lastExecutedArgsRef.current, args)) {
        console.log('[useAutoSave] Arguments unchanged, skipping auto-save')
        return
      }
      
      // Store the latest arguments
      lastArgsRef.current = args
      
      if (timeoutRef.current) {
        console.log('[useAutoSave] Clearing existing auto-save timeout')
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        console.log('[useAutoSave] Executing auto-save callback after', delay, 'ms delay')
        // Use the latest arguments stored
        if (lastArgsRef.current) {
          callbackRef.current(...lastArgsRef.current)
          lastExecutedArgsRef.current = [...lastArgsRef.current] as Parameters<T>
          lastArgsRef.current = null
        }
        timeoutRef.current = null
      }, delay)
    },
    [delay, options.compareArgs, defaultCompareArgs],
  ) as T
}

// Hook for real-time grammar checking with 300ms debounce
export function useGrammarCheck(
  onGrammarErrors: (errors: GrammarError[]) => void,
  onLatency?: (latency: number) => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTextRef = useRef<string>('')
  const isCheckingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const checkGrammar = useCallback(
    (text: string) => {
      // Skip if text hasn't changed or is too short
      if (text === lastTextRef.current || text.trim().length < 10) {
        return
      }

      lastTextRef.current = text

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(async () => {
        if (isCheckingRef.current) {
          console.log('[useGrammarCheck] Previous check still in progress, skipping')
          return
        }

        try {
          isCheckingRef.current = true
          console.log('[useGrammarCheck] Starting grammar check for text length:', text.length)
          
          const result = await AIService.checkGrammarAndSpelling(text)
          
          console.log('[useGrammarCheck] Grammar check completed', {
            errorsFound: result.errors.length,
            latency: result.latency
          })
          
          onGrammarErrors(result.errors)
          if (onLatency) {
            onLatency(result.latency)
          }
        } catch (error) {
          console.error('[useGrammarCheck] Grammar check failed:', error)
          onGrammarErrors([])
        } finally {
          isCheckingRef.current = false
        }
      }, 300) // 300ms debounce as required
    },
    [onGrammarErrors, onLatency]
  )

  return checkGrammar
}
