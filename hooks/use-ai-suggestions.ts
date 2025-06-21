import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { SuggestionService } from '@/services/suggestion-service'
import { AIService } from '@/services/ai-service'
import type { AISuggestion, FunnelSuggestion } from '@/types/ai-features'
import type { WritingGoals } from '@/types/writing-goals'
import { useToast } from './use-toast'

interface UseAISuggestionsOptions {
  documentId: string | null
  autoSubscribe?: boolean
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
  generateFunnelSuggestions: (goals: WritingGoals, content: string) => Promise<void>
  suggestionCount: number
}

/**
 * Hook for managing AI suggestions with real-time subscriptions
 * @param options - Configuration options for the hook
 * @returns Object containing suggestions state and actions
 */
export function useAISuggestions({ 
  documentId, 
  autoSubscribe = true 
}: UseAISuggestionsOptions): UseAISuggestionsReturn {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingFunnelSuggestions, setGeneratingFunnelSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('[useAISuggestions] Hook initialized with documentId:', documentId, 'user:', user?.uid)

  // Real-time subscription to suggestions
  useEffect(() => {
    if (!documentId || !user?.uid || !autoSubscribe) {
      console.log('[useAISuggestions] Not subscribing - missing requirements:', {
        documentId: !!documentId,
        userId: !!user?.uid,
        autoSubscribe
      })
      setSuggestions([])
      setError(null)
      return
    }

    console.log('[useAISuggestions] Setting up real-time subscription for document:', documentId)
    setLoading(true)
    setError(null)

    // Subscribe to style suggestions
    const unsubscribeStyle = SuggestionService.subscribeToSuggestions(
      documentId,
      user.uid,
      (newStyleSuggestions) => {
        console.log('[useAISuggestions] Received style suggestions update:', newStyleSuggestions.length)
        setSuggestions(prev => {
          // Remove old style suggestions, keep funnel
          const funnel = prev.filter(s => s.type === 'headline' || s.type === 'subheadline' || s.type === 'cta' || s.type === 'outline')
          return [...funnel, ...newStyleSuggestions]
        })
        setLoading(false)
        setError(null)
      }
    )

    // Subscribe to funnel suggestions
    const unsubscribeFunnel = SuggestionService.subscribeToFunnelSuggestions ? SuggestionService.subscribeToFunnelSuggestions(
      documentId,
      user.uid,
      (newFunnelSuggestions) => {
        console.log('[useAISuggestions] Received funnel suggestions update:', newFunnelSuggestions.length)
        setSuggestions(prev => {
          // Remove old funnel suggestions, keep style
          const style = prev.filter(s => s.type !== 'headline' && s.type !== 'subheadline' && s.type !== 'cta' && s.type !== 'outline')
          return [...style, ...newFunnelSuggestions]
        })
        setLoading(false)
        setError(null)
      }
    ) : () => {};

    // Cleanup subscription on unmount or dependency change
    return () => {
      console.log('[useAISuggestions] Cleaning up subscriptions for document:', documentId)
      unsubscribeStyle()
      unsubscribeFunnel()
    }
  }, [documentId, user?.uid, autoSubscribe])

  /**
   * Apply a suggestion to the document
   */
  const applySuggestion = useCallback(async (suggestion: AISuggestion) => {
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
   * Generate funnel suggestions based on writing goals
   */
  const generateFunnelSuggestions = useCallback(async (goals: WritingGoals, content: string) => {
    if (!documentId || !user?.uid) {
      console.error('[useAISuggestions] Cannot generate funnel suggestions - missing documentId or userId')
      toast({
        title: 'Error',
        description: 'Missing document or user information.',
        variant: 'destructive',
      })
      return
    }
    console.log('[useAISuggestions] Generating funnel suggestions with goals:', goals, 'content length:', content.length)
    setGeneratingFunnelSuggestions(true)
    setError(null)

    try {
      const result = await AIService.generateFunnelSuggestions(documentId, goals, content)
      console.log('[useAISuggestions] Funnel suggestions generated:', result)
      toast({
        title: 'Funnel Suggestions Generated',
        description: `Added ${result?.suggestions?.length || 0} funnel suggestions.`,
      })
      // Real-time subscription will update suggestions automatically
    } catch (error) {
      console.error('[useAISuggestions] Error generating funnel suggestions:', error)
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
  }, [documentId, user?.uid, toast])

  // Separate suggestions by type
  const styleSuggestions = suggestions.filter(s => s.type !== 'headline' && s.type !== 'subheadline' && s.type !== 'cta' && s.type !== 'outline')
  const funnelSuggestions: FunnelSuggestion[] = suggestions
    .filter(s => s.type === 'headline' || s.type === 'subheadline' || s.type === 'cta' || s.type === 'outline')
    .map(s => ({
      id: s.id,
      documentId: s.documentId,
      userId: s.userId,
      type: s.type as 'headline' | 'subheadline' | 'cta' | 'outline',
      title: s.title,
      description: s.description,
      suggestedText: s.suggestedText,
      confidence: s.confidence,
      status: s.status,
      createdAt: s.createdAt,
      appliedAt: s.appliedAt
    }))
  
  // Wrapper functions to match expected signatures
  const applySuggestionWrapper = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      await applySuggestion(suggestion)
    }
  }, [suggestions, applySuggestion])

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

  const suggestionCount = suggestions.length
  const totalSuggestionsCount = suggestions.length
  const loadingStyleSuggestions = loading
  const loadingFunnelSuggestions = loading
  const refreshSuggestions = reloadSuggestions

  console.log('[useAISuggestions] Current state:', {
    suggestionCount,
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

  return {
    suggestions,
    styleSuggestions,
    funnelSuggestions,
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
    generateFunnelSuggestions,
    suggestionCount
  }
}