import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { SuggestionService } from '@/services/suggestion-service'
import { AIService } from '@/services/ai-service'
import type { AISuggestion, FunnelSuggestion, SuggestionPositioning } from '@/types/ai-features'
import type { WritingGoals } from '@/types/writing-goals'
import { useToast } from './use-toast'
import { debounce } from 'lodash'

// Phase 2: Add debounce delay for AI suggestions
const AI_SUGGESTIONS_DEBOUNCE = 1000; // ms - Phase 2: 1 second debounce

interface UseAISuggestionsOptions {
  documentId: string | null
  autoSubscribe?: boolean
  contentCoordinatorRef?: React.RefObject<any> // Phase 2: Add coordinator reference
  currentContent?: string // Phase 1: Add current content for refresh functionality
}

interface UseAISuggestionsReturn {
  suggestions: AISuggestion[]
  styleSuggestions: AISuggestion[]
  funnelSuggestions: FunnelSuggestion[]
  totalSuggestionsCount: number
  loading: boolean
  loadingStyleSuggestions: boolean
  loadingFunnelSuggestions: boolean
  generatingFunnelSuggestions: boolean
  error: string | null
  applySuggestion: (suggestionId: string) => void
  dismissSuggestion: (suggestionId: string) => void
  batchDismissSuggestions: (suggestionIds: string[]) => Promise<void>
  reloadSuggestions: () => void
  refreshSuggestions: () => void
  refreshFunnelSuggestions: () => void
  generateFunnelSuggestions: (goals: WritingGoals, content: string, documentTitle?: string) => Promise<void>
  suggestionCount: number
}

/**
 * Hook for managing AI suggestions with real-time subscriptions
 * @param options - Configuration options for the hook
 * @returns Object containing suggestions state and actions
 */
export function useAISuggestions({ 
  documentId, 
  autoSubscribe = true,
  contentCoordinatorRef,
  currentContent = ''
}: UseAISuggestionsOptions): UseAISuggestionsReturn {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [styleSuggestions, setStyleSuggestions] = useState<AISuggestion[]>([])
  const [funnelSuggestions, setFunnelSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingFunnelSuggestions, setGeneratingFunnelSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestions: AISuggestion[] = useMemo(() => [...styleSuggestions, ...funnelSuggestions], [styleSuggestions, funnelSuggestions])

  console.log('[useAISuggestions] Phase 2: Hook initialized with documentId:', documentId, 'user:', user?.uid)

  /**
   * Check if user is currently typing using EditorContentCoordinator
   * Phase 2: Respect typing lock to prevent interference with user input
   */
  const isUserTyping = useCallback((): boolean => {
    if (!contentCoordinatorRef?.current) {
      console.log('[useAISuggestions] Phase 2: No coordinator available, assuming not typing');
      return false;
    }
    
    const state = contentCoordinatorRef.current.getState();
    const typing = state.isUserTyping || state.isProcessingUpdate;
    
    if (typing) {
      console.log('[useAISuggestions] Phase 2: User is typing or processing update, skipping AI suggestions');
    }
    
    return typing;
  }, [contentCoordinatorRef]);

  // Real-time subscription to suggestions
  useEffect(() => {
    if (!documentId || !user?.uid || !autoSubscribe) {
      console.log('[useAISuggestions] Not subscribing - missing requirements:', {
        documentId: !!documentId,
        userId: !!user?.uid,
        autoSubscribe
      })
      setStyleSuggestions([])
      setFunnelSuggestions([])
      setError(null)
      return
    }

    console.log('[useAISuggestions] Setting up real-time subscription for document:', documentId)
    setLoading(true)
    setError(null)

    // Subscribe to style suggestions
    const unsubscribeStyle = SuggestionService.subscribeToStyleSuggestions(
      documentId,
      user.uid,
      (newStyleSuggestions) => {
        console.log('[useAISuggestions] Received style suggestions update:', newStyleSuggestions.length)
        setStyleSuggestions(newStyleSuggestions)
        setLoading(false)
        setError(null)
      }
    )

    // Subscribe to funnel suggestions
    const unsubscribeFunnel = SuggestionService.subscribeToFunnelSuggestions(
      documentId,
      user.uid,
      (newFunnelSuggestions) => {
        console.log('[useAISuggestions] Received funnel suggestions update:', newFunnelSuggestions.length)
        setFunnelSuggestions(newFunnelSuggestions)
        setLoading(false)
        setError(null)
      }
    )

    // Cleanup subscription on unmount or dependency change
    return () => {
      console.log('[useAISuggestions] Cleaning up subscriptions for document:', documentId)
      unsubscribeStyle()
      unsubscribeFunnel()
    }
  }, [documentId, user?.uid, autoSubscribe])

  /**
   * Apply a suggestion to the document
   * Updated to handle both AISuggestion and FunnelSuggestion types
   */
  const applySuggestion = useCallback(async (suggestion: any) => {
    console.log('[useAISuggestions] applySuggestion called', suggestion);
    
    // Prevent duplicate applications
    if (suggestion.status === 'applied') {
      console.warn('[useAISuggestions] Suggestion already applied, skipping:', suggestion.id);
      toast({ 
        title: 'Suggestion Already Applied', 
        description: 'This suggestion has already been applied to the document.',
        variant: 'default'
      });
      return;
    }
    
    try {
      setError(null);
      
      // Dispatch event to document editor first
      if (typeof window !== 'undefined') {
        console.log('[useAISuggestions] Dispatching AI_SUGGESTION_APPLY event', suggestion);
        const event = new CustomEvent('AI_SUGGESTION_APPLY', { detail: suggestion });
        window.dispatchEvent(event);
        
        // Wait a moment for the editor to process the content change
        await new Promise(resolve => setTimeout(resolve, 150));
        console.log('[useAISuggestions] Event dispatched and processed');
      }
      
      // Apply the suggestion via the service (this updates Firestore status)
      console.log('[useAISuggestions] Calling SuggestionService.applySuggestion', suggestion);
      await SuggestionService.applySuggestion(suggestion);
      console.log('[useAISuggestions] SuggestionService.applySuggestion complete', suggestion);
      
      toast({ 
        title: 'Suggestion Applied', 
        description: `Applied: "${suggestion.title}"`,
        variant: 'default'
      });
      
    } catch (error) {
      console.error('[useAISuggestions] Error applying suggestion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to apply suggestion: ${errorMessage}`);
      toast({ 
        title: 'Error Applying Suggestion', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  }, [toast]);

  /**
   * Dismiss a suggestion
   */
  const dismissSuggestion = useCallback(async (suggestionId: string) => {
    if (!documentId) {
      console.error('[useAISuggestions] Cannot dismiss suggestion - no document ID')
      return
    }

    console.log('[useAISuggestions] Dismissing suggestion:', suggestionId)

    try {
      setError(null)
      
      // Dismiss the suggestion via the service
      await SuggestionService.dismissSuggestion(documentId, suggestionId)
      
      console.log('[useAISuggestions] Successfully dismissed suggestion:', suggestionId)
      
      // Show success toast
      toast({
        title: 'Suggestion Dismissed',
        description: 'The suggestion has been dismissed.',
      })
      
      // Note: The real-time subscription will automatically update the suggestions state
      // by removing the dismissed suggestion from the pending list
      
    } catch (error) {
      console.error('[useAISuggestions] Error dismissing suggestion:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to dismiss suggestion: ${errorMessage}`)
      
      // Show error toast
      toast({
        title: 'Error Dismissing Suggestion',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [documentId, toast])

  /**
   * Batch dismiss multiple suggestions
   */
  const batchDismissSuggestions = useCallback(async (suggestionIds: string[]) => {
    if (!documentId) {
      console.error('[useAISuggestions] Cannot batch dismiss suggestions - no document ID')
      return
    }

    if (suggestionIds.length === 0) {
      console.log('[useAISuggestions] No suggestions to batch dismiss')
      return
    }

    console.log('[useAISuggestions] Batch dismissing suggestions:', suggestionIds.length)

    try {
      setError(null)
      
      // Batch dismiss suggestions via the service
      await SuggestionService.batchDismissSuggestions(documentId, suggestionIds)
      
      console.log('[useAISuggestions] Successfully batch dismissed suggestions:', suggestionIds.length)
      
      // Show success toast
      toast({
        title: 'Suggestions Dismissed',
        description: `Dismissed ${suggestionIds.length} suggestions.`,
      })
      
    } catch (error) {
      console.error('[useAISuggestions] Error batch dismissing suggestions:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to batch dismiss suggestions: ${errorMessage}`)
      
      // Show error toast
      toast({
        title: 'Error Dismissing Suggestions',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [documentId, toast])

  /**
   * Manually reload suggestions (for error recovery)
   */
  const reloadSuggestions = useCallback(() => {
    console.log('[useAISuggestions] Manual reload requested for document:', documentId)
    
    if (!documentId || !user?.uid) {
      console.log('[useAISuggestions] Cannot reload - missing requirements')
      return
    }

    // Reset state and let useEffect handle the reload
    setLoading(true)
    setError(null)
    
    // The useEffect will handle resubscribing
  }, [documentId, user?.uid])

  /**
   * Phase 1: Refresh suggestions by clearing existing ones and regenerating new ones
   */
  const refreshSuggestionsWithClear = useCallback(async () => {
    console.log('[useAISuggestions] Phase 1: Refresh suggestions requested for document:', documentId)
    
    if (!documentId || !user?.uid) {
      console.log('[useAISuggestions] Phase 1: Cannot refresh - missing requirements')
      toast({
        title: 'Error',
        description: 'Missing document or user information.',
        variant: 'destructive',
      })
      return
    }

    console.log('[useAISuggestions] Phase 1: Starting suggestion refresh process')
    setLoading(true)
    setError(null)

    try {
      // Phase 1: Clear existing style suggestions
      console.log('[useAISuggestions] Phase 1: Clearing existing style suggestions')
      await SuggestionService.clearExistingSuggestions(documentId, user.uid, 'style')
      
      // Phase 1: Clear existing funnel suggestions
      console.log('[useAISuggestions] Phase 1: Clearing existing funnel suggestions')
      await SuggestionService.clearExistingSuggestions(documentId, user.uid, 'funnel')
      
      // Phase 1: Wait a moment for the clear operations to complete
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Phase 1: Generate new style suggestions with current document content
      console.log('[useAISuggestions] Phase 1: Generating new style suggestions with content length:', currentContent.length)
      console.log('[useAISuggestions] Phase 1: User authentication status:', {
        isAuthenticated: !!user,
        userId: user?.uid,
        userEmail: user?.email
      })
      
      if (currentContent.trim()) {
        await AIService.generateStyleSuggestions(documentId, currentContent)
        console.log('[useAISuggestions] Phase 1: Style suggestions generation triggered successfully')
      } else {
        console.log('[useAISuggestions] Phase 1: No content provided, skipping style suggestions generation')
      }
      
      // Phase 1: Show success feedback
      toast({
        title: 'Suggestions Refreshed',
        description: 'All suggestions have been cleared and new ones are being generated.',
      })
      
      console.log('[useAISuggestions] Phase 1: Suggestion refresh process completed successfully')
      
    } catch (error) {
      console.error('[useAISuggestions] Phase 1: Error refreshing suggestions:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to refresh suggestions: ${errorMessage}`)
      
      toast({
        title: 'Error Refreshing Suggestions',
        description: errorMessage,
        variant: 'destructive',
      })
         } finally {
      setLoading(false)
    }
  }, [documentId, user?.uid, currentContent, toast])

  /**
   * Internal function to generate funnel suggestions (non-debounced)
   * Phase 2: Separated internal logic from debounced wrapper
   */
  const generateFunnelSuggestionsInternal = useCallback(async (goals: WritingGoals, content: string, documentTitle?: string) => {
    if (!documentId || !user?.uid) {
      console.error('[useAISuggestions] Cannot generate funnel suggestions - missing documentId or userId')
      toast({
        title: 'Error',
        description: 'Missing document or user information.',
        variant: 'destructive',
      })
      return
    }

    // Phase 2: Check if user is currently typing - if so, skip generation
    if (isUserTyping()) {
      console.log('[useAISuggestions] Phase 2: User is typing, skipping funnel suggestions generation');
      return;
    }

    console.log('[useAISuggestions] Phase 2: Generating funnel suggestions with goals:', goals, 'content length:', content.length)
    setGeneratingFunnelSuggestions(true)
    setError(null)

    try {
      const result = await AIService.generateFunnelSuggestions(documentId, goals, content, documentTitle)
      console.log('[useAISuggestions] Phase 2: Funnel suggestions generated:', result)
      toast({
        title: 'Funnel Suggestions Generated',
        description: `Added ${result?.suggestions?.length || 0} funnel suggestions.`,
      })
      // Real-time subscription will update suggestions automatically
    } catch (error) {
      console.error('[useAISuggestions] Phase 2: Error generating funnel suggestions:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to generate funnel suggestions: ${errorMessage}`)
      toast({
        title: 'Error Generating Suggestions',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setGeneratingFunnelSuggestions(false)
    }
  }, [documentId, user?.uid, toast, isUserTyping])

  /**
   * Debounced funnel suggestions generation with typing lock check
   * Phase 2: Implement 1 second debounce and respect typing lock
   */
  const debouncedGenerateFunnelSuggestions = useMemo(() => 
    debounce((goals: WritingGoals, content: string, documentTitle?: string) => {
      console.log('[useAISuggestions] Phase 2: Starting debounced funnel suggestions generation');
      generateFunnelSuggestionsInternal(goals, content, documentTitle);
    }, AI_SUGGESTIONS_DEBOUNCE),
    [generateFunnelSuggestionsInternal]
  );

  /**
   * Public function to generate funnel suggestions based on writing goals
   * Phase 2: Now uses debounced version
   */
  const generateFunnelSuggestions = useCallback(async (goals: WritingGoals, content: string, documentTitle?: string) => {
    console.log('[useAISuggestions] Phase 2: Request to generate funnel suggestions (debounced)');
    debouncedGenerateFunnelSuggestions(goals, content, documentTitle);
  }, [debouncedGenerateFunnelSuggestions])

  /**
   * Refresh funnel suggestions by clearing existing ones and regenerating new ones
   */
  const refreshFunnelSuggestionsWithClear = useCallback(async () => {
    console.log('[useAISuggestions] Funnel Refresh: Requested for document:', documentId)

    if (!documentId || !user?.uid) {
      console.log('[useAISuggestions] Funnel Refresh: Cannot refresh - missing requirements')
      toast({
        title: 'Error',
        description: 'Missing document or user information.',
        variant: 'destructive',
      })
      return
    }

    console.log('[useAISuggestions] Funnel Refresh: Starting funnel suggestion refresh process')
    setLoading(true)
    setError(null)

    try {
      // Clear existing funnel suggestions only
      console.log('[useAISuggestions] Funnel Refresh: Clearing existing funnel suggestions')
      await SuggestionService.clearExistingSuggestions(documentId, user.uid, 'funnel')

      // Wait a moment for the clear operation to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Regenerate funnel suggestions using current writing goals and content
      if (typeof window !== 'undefined') {
        // Try to get writing goals and document title from global state if needed
        // For now, we assume the sidebar will pass them as props
      }
      // We'll need to expose a way to pass writingGoals, currentContent, and documentTitle
      // For now, just log a warning if not available
      console.log('[useAISuggestions] Funnel Refresh: You must call this with writingGoals, currentContent, and documentTitle from the sidebar.')
      // This function will be called from the sidebar with those arguments
      // So we do not call generateFunnelSuggestions here directly
      toast({
        title: 'Funnel Suggestions Cleared',
        description: 'Existing funnel suggestions have been cleared. Please regenerate new ones.',
      })
      console.log('[useAISuggestions] Funnel Refresh: Funnel suggestions cleared. Ready to regenerate.')
    } catch (error) {
      console.error('[useAISuggestions] Funnel Refresh: Error refreshing funnel suggestions:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to refresh funnel suggestions: ${errorMessage}`)
      toast({
        title: 'Error Refreshing Funnel Suggestions',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [documentId, user?.uid, toast])

  const totalSuggestionsCount = suggestions.length
  const loadingStyleSuggestions = loading
  const loadingFunnelSuggestions = loading
  const refreshSuggestions = refreshSuggestionsWithClear

  console.log('[useAISuggestions] Current state:', {
    suggestionCount: suggestions.length,
    totalSuggestionsCount,
    styleSuggestionsCount: styleSuggestions.length,
    funnelSuggestionsCount: funnelSuggestions.length,
    loading,
    loadingStyleSuggestions,
    loadingFunnelSuggestions,
    generatingFunnelSuggestions,
    error: !!error,
    documentId,
    userId: user?.uid
  })

  // Wrapper functions to match expected signatures
  const applySuggestionWrapper = useCallback(async (suggestionId: string) => {
    console.log('[useAISuggestions] applySuggestionWrapper called with ID:', suggestionId);
    
    // First check regular suggestions (style, grammar, etc.)
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      console.log('[useAISuggestions] Found suggestion in regular suggestions array:', suggestion.type);
      await applySuggestion(suggestion);
      return;
    }
    
    // Then check funnel suggestions (which have positioning data)
    const funnelSuggestion = funnelSuggestions.find(s => s.id === suggestionId);
    if (funnelSuggestion) {
      console.log('[useAISuggestions] Found suggestion in funnel suggestions array:', funnelSuggestion.type);
      console.log('[useAISuggestions] Funnel suggestion has positioning:', !!funnelSuggestion.positioning);
      
      // Convert FunnelSuggestion to compatible format with positioning data
      const suggestionWithPositioning = {
        id: funnelSuggestion.id,
        documentId: funnelSuggestion.documentId,
        userId: funnelSuggestion.userId,
        type: funnelSuggestion.type,
        title: funnelSuggestion.title,
        description: funnelSuggestion.description,
        originalText: funnelSuggestion.originalText,
        suggestedText: funnelSuggestion.suggestedText,
        position: funnelSuggestion.position,
        confidence: funnelSuggestion.confidence,
        status: funnelSuggestion.status,
        createdAt: funnelSuggestion.createdAt,
        appliedAt: funnelSuggestion.appliedAt,
        // CRITICAL: Preserve positioning data
        positioning: funnelSuggestion.positioning
      } as any; // Use any to bypass TypeScript for now
      
      console.log('[useAISuggestions] Applying funnel suggestion with positioning data:', suggestionWithPositioning.positioning);
      await applySuggestion(suggestionWithPositioning);
      return;
    }
    
    console.warn('[useAISuggestions] Suggestion not found in either array:', suggestionId);
  }, [suggestions, funnelSuggestions, applySuggestion]);

  const dismissSuggestionWrapper = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      // Pass the type so SuggestionService can use the correct collection
      await SuggestionService.dismissSuggestion(suggestion.documentId, suggestionId, suggestion.type)
    } else {
      // fallback for legacy
      await dismissSuggestion(suggestionId)
    }
  }, [suggestions, dismissSuggestion])

  return {
    suggestions,
    styleSuggestions,
    funnelSuggestions: funnelSuggestions as FunnelSuggestion[],
    totalSuggestionsCount,
    loading,
    loadingStyleSuggestions,
    loadingFunnelSuggestions,
    generatingFunnelSuggestions,
    error,
    applySuggestion: applySuggestionWrapper,
    dismissSuggestion: dismissSuggestionWrapper,
    batchDismissSuggestions,
    reloadSuggestions,
    refreshSuggestions,
    refreshFunnelSuggestions: refreshFunnelSuggestionsWithClear,
    generateFunnelSuggestions,
    suggestionCount: suggestions.length
  }
}