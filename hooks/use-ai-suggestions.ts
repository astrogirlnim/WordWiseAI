import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  where,
  Timestamp 
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import type { AISuggestion, FunnelSuggestion } from '@/types/ai-features'
import { AIService } from '@/services/ai-service'
import type { WritingGoals } from '@/types/writing-goals'

export interface UseAISuggestionsReturn {
  // Style suggestions
  styleSuggestions: AISuggestion[]
  // Funnel suggestions
  funnelSuggestions: FunnelSuggestion[]
  // Combined suggestions count
  totalSuggestionsCount: number
  // Loading states
  loadingStyleSuggestions: boolean
  loadingFunnelSuggestions: boolean
  generatingFunnelSuggestions: boolean
  // Actions
  generateFunnelSuggestions: (goals: WritingGoals, currentDraft?: string) => Promise<void>
  applySuggestion: (suggestionId: string, type: 'style' | 'funnel') => Promise<void>
  dismissSuggestion: (suggestionId: string, type: 'style' | 'funnel') => Promise<void>
  // Refresh data
  refreshSuggestions: () => void
}

export function useAISuggestions(documentId: string | null): UseAISuggestionsReturn {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State for different types of suggestions
  const [styleSuggestions, setStyleSuggestions] = useState<AISuggestion[]>([])
  const [funnelSuggestions, setFunnelSuggestions] = useState<FunnelSuggestion[]>([])
  
  // Loading states
  const [loadingStyleSuggestions, setLoadingStyleSuggestions] = useState(false)
  const [loadingFunnelSuggestions, setLoadingFunnelSuggestions] = useState(false)
  const [generatingFunnelSuggestions, setGeneratingFunnelSuggestions] = useState(false)

  console.log('[useAISuggestions] Hook initialized', { 
    documentId, 
    userId: user?.uid,
    styleSuggestionsCount: styleSuggestions.length,
    funnelSuggestionsCount: funnelSuggestions.length
  })

  // Subscribe to style suggestions
  useEffect(() => {
    if (!documentId || !user?.uid) {
      console.log('[useAISuggestions] No document or user, clearing style suggestions')
      setStyleSuggestions([])
      return
    }

    console.log('[useAISuggestions] Setting up style suggestions subscription for document:', documentId)
    setLoadingStyleSuggestions(true)

    const styleSuggestionsRef = collection(firestore, `documents/${documentId}/styleSuggestions`)
    const q = query(
      styleSuggestionsRef,
      where('userId', '==', user.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('[useAISuggestions] Style suggestions snapshot received, docs:', snapshot.docs.length)
        const suggestions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AISuggestion[]
        
        setStyleSuggestions(suggestions)
        setLoadingStyleSuggestions(false)
        console.log('[useAISuggestions] Updated style suggestions:', suggestions.length)
      },
      (error) => {
        console.error('[useAISuggestions] Error in style suggestions subscription:', error)
        setLoadingStyleSuggestions(false)
        toast({
          title: 'Error Loading Suggestions',
          description: 'Failed to load style suggestions. Please refresh the page.',
          variant: 'destructive'
        })
      }
    )

    return unsubscribe
  }, [documentId, user?.uid, toast])

  // Subscribe to funnel suggestions
  useEffect(() => {
    if (!documentId || !user?.uid) {
      console.log('[useAISuggestions] No document or user, clearing funnel suggestions')
      setFunnelSuggestions([])
      return
    }

    console.log('[useAISuggestions] Setting up funnel suggestions subscription for document:', documentId)
    setLoadingFunnelSuggestions(true)

    const funnelSuggestionsRef = collection(firestore, `documents/${documentId}/funnelSuggestions`)
    const q = query(
      funnelSuggestionsRef,
      where('userId', '==', user.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('[useAISuggestions] Funnel suggestions snapshot received, docs:', snapshot.docs.length)
        const suggestions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FunnelSuggestion[]
        
        setFunnelSuggestions(suggestions)
        setLoadingFunnelSuggestions(false)
        console.log('[useAISuggestions] Updated funnel suggestions:', suggestions.length)
      },
      (error) => {
        console.error('[useAISuggestions] Error in funnel suggestions subscription:', error)
        setLoadingFunnelSuggestions(false)
        toast({
          title: 'Error Loading Funnel Suggestions',
          description: 'Failed to load funnel suggestions. Please refresh the page.',
          variant: 'destructive'
        })
      }
    )

    return unsubscribe
  }, [documentId, user?.uid, toast])

  // Generate funnel suggestions
  const generateFunnelSuggestions = useCallback(async (goals: WritingGoals, currentDraft: string = '') => {
    if (!documentId || !user?.uid) {
      console.error('[useAISuggestions] Cannot generate funnel suggestions: missing document or user')
      return
    }

    console.log('[useAISuggestions] Generating funnel suggestions...', { documentId, goals })
    setGeneratingFunnelSuggestions(true)

    try {
      const response = await AIService.generateFunnelSuggestions(documentId, goals, currentDraft)
      console.log('[useAISuggestions] Funnel suggestions generated successfully:', response.suggestions.length)
      
      toast({
        title: 'Funnel Suggestions Generated',
        description: `Generated ${response.suggestions.length} funnel copy suggestions based on your goals.`
      })
    } catch (error) {
      console.error('[useAISuggestions] Error generating funnel suggestions:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate funnel suggestions. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setGeneratingFunnelSuggestions(false)
    }
  }, [documentId, user?.uid, toast])

  // Apply a suggestion
  const applySuggestion = useCallback(async (suggestionId: string, type: 'style' | 'funnel') => {
    if (!documentId) {
      console.error('[useAISuggestions] Cannot apply suggestion: missing document')
      return
    }

    console.log('[useAISuggestions] Applying suggestion:', suggestionId, 'type:', type)

    try {
      const collectionName = type === 'style' ? 'styleSuggestions' : 'funnelSuggestions'
      const suggestionRef = doc(firestore, `documents/${documentId}/${collectionName}/${suggestionId}`)
      
      await updateDoc(suggestionRef, {
        status: 'applied',
        appliedAt: Timestamp.now()
      })

      console.log('[useAISuggestions] Suggestion applied successfully:', suggestionId)
      
      toast({
        title: 'Suggestion Applied',
        description: 'The suggestion has been applied to your document.'
      })
    } catch (error) {
      console.error('[useAISuggestions] Error applying suggestion:', error)
      toast({
        title: 'Apply Failed',
        description: 'Failed to apply the suggestion. Please try again.',
        variant: 'destructive'
      })
    }
  }, [documentId, toast])

  // Dismiss a suggestion
  const dismissSuggestion = useCallback(async (suggestionId: string, type: 'style' | 'funnel') => {
    if (!documentId) {
      console.error('[useAISuggestions] Cannot dismiss suggestion: missing document')
      return
    }

    console.log('[useAISuggestions] Dismissing suggestion:', suggestionId, 'type:', type)

    try {
      const collectionName = type === 'style' ? 'styleSuggestions' : 'funnelSuggestions'
      const suggestionRef = doc(firestore, `documents/${documentId}/${collectionName}/${suggestionId}`)
      
      await updateDoc(suggestionRef, {
        status: 'dismissed'
      })

      console.log('[useAISuggestions] Suggestion dismissed successfully:', suggestionId)
    } catch (error) {
      console.error('[useAISuggestions] Error dismissing suggestion:', error)
      toast({
        title: 'Dismiss Failed',
        description: 'Failed to dismiss the suggestion. Please try again.',
        variant: 'destructive'
      })
    }
  }, [documentId, toast])

  // Refresh suggestions
  const refreshSuggestions = useCallback(() => {
    console.log('[useAISuggestions] Refreshing suggestions manually')
    // The real-time subscriptions will automatically refresh data
    // This is mainly for manual trigger if needed
  }, [])

  // Calculate total suggestions count
  const totalSuggestionsCount = styleSuggestions.length + funnelSuggestions.length

  return {
    styleSuggestions,
    funnelSuggestions,
    totalSuggestionsCount,
    loadingStyleSuggestions,
    loadingFunnelSuggestions,
    generatingFunnelSuggestions,
    generateFunnelSuggestions,
    applySuggestion,
    dismissSuggestion,
    refreshSuggestions
  }
}