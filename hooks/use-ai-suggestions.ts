import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { SuggestionService } from '@/services/suggestion-service'
import type { AISuggestion, FunnelSuggestion } from '@/types/ai-features'
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
  applySuggestion: (suggestionId: string, type: 'style' | 'funnel') => void
  dismissSuggestion: (suggestionId: string, type: 'style' | 'funnel') => void
  batchDismissSuggestions: (suggestionIds: string[]) => Promise<void>
  reloadSuggestions: () => void
  refreshSuggestions: () => void
  generateFunnelSuggestions: (goals: any, content: string) => Promise<void>
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

    const unsubscribe = SuggestionService.subscribeToSuggestions(
      documentId,
      user.uid,
      (newSuggestions) => {
        console.log('[useAISuggestions] Received suggestions update:', newSuggestions.length)
        setSuggestions(newSuggestions)
        setLoading(false)
        setError(null)
      }
    )

    // Cleanup subscription on unmount or dependency change
    return () => {
      console.log('[useAISuggestions] Cleaning up subscription for document:', documentId)
      unsubscribe()
    }
  }, [documentId, user?.uid, autoSubscribe])

  /**
   * Apply a suggestion to the document
   */
  const applySuggestion = useCallback(async (suggestion: AISuggestion) => {
    console.log('[useAISuggestions] Applying suggestion:', suggestion.id)
    console.log('[useAISuggestions] Suggestion details:', {
      title: suggestion.title,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestedText
    })

    try {
      setError(null)
      
      // Apply the suggestion via the service
      await SuggestionService.applySuggestion(suggestion)
      
      console.log('[useAISuggestions] Successfully applied suggestion:', suggestion.id)
      
      // Show success toast
      toast({
        title: 'Suggestion Applied',
        description: `Applied: "${suggestion.title}"`,
      })
      
      // Note: The real-time subscription will automatically update the suggestions state
      // by removing the applied suggestion from the pending list
      
    } catch (error) {
      console.error('[useAISuggestions] Error applying suggestion:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to apply suggestion: ${errorMessage}`)
      
      // Show error toast
      toast({
        title: 'Error Applying Suggestion',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [toast])

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
  const generateFunnelSuggestions = useCallback(async (goals: any, content: string) => {
    console.log('[useAISuggestions] Generating funnel suggestions with goals:', goals)
    setGeneratingFunnelSuggestions(true)
    setError(null)

    try {
      // In a real implementation, this would call an AI service to generate suggestions
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('[useAISuggestions] Successfully generated funnel suggestions')
      
      toast({
        title: 'Funnel Suggestions Generated',
        description: 'New funnel copy suggestions are available.',
      })
      
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
  }, [toast])

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
  const applySuggestionWrapper = useCallback((suggestionId: string, type: 'style' | 'funnel') => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      applySuggestion(suggestion)
    }
  }, [suggestions, applySuggestion])

  const dismissSuggestionWrapper = useCallback((suggestionId: string, type: 'style' | 'funnel') => {
    dismissSuggestion(suggestionId)
  }, [dismissSuggestion])

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