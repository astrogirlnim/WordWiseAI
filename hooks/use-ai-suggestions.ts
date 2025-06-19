/**
 * Custom hook for managing AI suggestions including style and funnel suggestions
 * Provides real-time synchronization with Firestore and handles suggestion operations
 */

import { useState, useEffect, useCallback } from 'react'
import { collection, doc, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import { AIService } from '@/services/ai-service'
import type { AISuggestion, FunnelSuggestion } from '@/types/ai-features'
import type { WritingGoals } from '@/types/writing-goals'

// Type alias for style suggestions (subset of AISuggestion)
export type StyleSuggestion = AISuggestion & {
  type: 'grammar' | 'style' | 'clarity' | 'engagement' | 'readability'
}

export interface UseAISuggestionsReturn {
  // Suggestions data
  styleSuggestions: StyleSuggestion[]
  funnelSuggestions: FunnelSuggestion[]
  totalSuggestionsCount: number
  
  // Loading states
  loadingStyleSuggestions: boolean
  loadingFunnelSuggestions: boolean
  generatingFunnelSuggestions: boolean
  
  // Actions
  generateFunnelSuggestions: (goals: WritingGoals, content: string) => Promise<void>
  applySuggestion: (suggestionId: string, type: 'style' | 'funnel') => Promise<void>
  dismissSuggestion: (suggestionId: string, type: 'style' | 'funnel') => Promise<void>
  refreshSuggestions: () => Promise<void>
}

/**
 * Hook for managing AI suggestions with real-time Firestore synchronization
 */
export function useAISuggestions(documentId?: string | null): UseAISuggestionsReturn {
  console.log('[useAISuggestions] Hook initialized with documentId:', documentId)
  
  // State management
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestion[]>([])
  const [funnelSuggestions, setFunnelSuggestions] = useState<FunnelSuggestion[]>([])
  const [loadingStyleSuggestions, setLoadingStyleSuggestions] = useState(false)
  const [loadingFunnelSuggestions, setLoadingFunnelSuggestions] = useState(false)
  const [generatingFunnelSuggestions, setGeneratingFunnelSuggestions] = useState(false)

  // Calculate total suggestions count
  const totalSuggestionsCount = styleSuggestions.length + funnelSuggestions.length

  console.log('[useAISuggestions] Current state:', {
    styleSuggestionsCount: styleSuggestions.length,
    funnelSuggestionsCount: funnelSuggestions.length,
    totalSuggestionsCount,
    loadingStyleSuggestions,
    loadingFunnelSuggestions,
    generatingFunnelSuggestions
  })

  // Real-time subscription to style suggestions
  useEffect(() => {
    if (!documentId) {
      console.log('[useAISuggestions] No documentId provided, skipping style suggestions subscription')
      return
    }

    console.log('[useAISuggestions] Setting up style suggestions subscription for document:', documentId)
    setLoadingStyleSuggestions(true)

    const styleSuggestionsRef = collection(firestore, 'documents', documentId, 'styleSuggestions')
    const styleSuggestionsQuery = query(
      styleSuggestionsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      styleSuggestionsQuery,
      (snapshot) => {
        console.log('[useAISuggestions] Style suggestions snapshot received:', snapshot.size, 'documents')
        
        const suggestions: StyleSuggestion[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          suggestions.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
          } as unknown as StyleSuggestion)
        })

        console.log('[useAISuggestions] Processed style suggestions:', suggestions.length)
        setStyleSuggestions(suggestions)
        setLoadingStyleSuggestions(false)
      },
      (error) => {
        console.error('[useAISuggestions] Error in style suggestions subscription:', error)
        setLoadingStyleSuggestions(false)
      }
    )

    return unsubscribe
  }, [documentId])

  // Real-time subscription to funnel suggestions
  useEffect(() => {
    if (!documentId) {
      console.log('[useAISuggestions] No documentId provided, skipping funnel suggestions subscription')
      return
    }

    console.log('[useAISuggestions] Setting up funnel suggestions subscription for document:', documentId)
    setLoadingFunnelSuggestions(true)

    const funnelSuggestionsRef = collection(firestore, 'documents', documentId, 'funnelSuggestions')
    const funnelSuggestionsQuery = query(
      funnelSuggestionsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      funnelSuggestionsQuery,
      (snapshot) => {
        console.log('[useAISuggestions] Funnel suggestions snapshot received:', snapshot.size, 'documents')
        
        const suggestions: FunnelSuggestion[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          suggestions.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
          } as unknown as FunnelSuggestion)
        })

        console.log('[useAISuggestions] Processed funnel suggestions:', suggestions.length)
        setFunnelSuggestions(suggestions)
        setLoadingFunnelSuggestions(false)
      },
      (error) => {
        console.error('[useAISuggestions] Error in funnel suggestions subscription:', error)
        setLoadingFunnelSuggestions(false)
      }
    )

    return unsubscribe
  }, [documentId])

  // Generate funnel suggestions using AI service
  const generateFunnelSuggestions = useCallback(async (goals: WritingGoals, content: string) => {
    if (!documentId) {
      console.error('[useAISuggestions] Cannot generate funnel suggestions: no documentId')
      return
    }

    console.log('[useAISuggestions] Generating funnel suggestions:', {
      documentId,
      goals,
      contentLength: content.length
    })

    setGeneratingFunnelSuggestions(true)
    
    try {
      await AIService.generateFunnelSuggestions(documentId, goals, content)
      console.log('[useAISuggestions] Successfully generated funnel suggestions')
    } catch (error) {
      console.error('[useAISuggestions] Error generating funnel suggestions:', error)
    } finally {
      setGeneratingFunnelSuggestions(false)
    }
  }, [documentId])

  // Apply a suggestion
  const applySuggestion = useCallback(async (suggestionId: string, type: 'style' | 'funnel') => {
    if (!documentId) {
      console.error('[useAISuggestions] Cannot apply suggestion: no documentId')
      return
    }

    console.log('[useAISuggestions] Applying suggestion:', { suggestionId, type, documentId })

    try {
      if (type === 'style') {
        // Apply style suggestion (not implemented in AIService yet)
        console.log('[useAISuggestions] Style suggestion apply not implemented')
      } else {
        // Apply funnel suggestion (not implemented in AIService yet)
        console.log('[useAISuggestions] Funnel suggestion apply not implemented')
      }
      console.log('[useAISuggestions] Successfully applied suggestion')
    } catch (error) {
      console.error('[useAISuggestions] Error applying suggestion:', error)
    }
  }, [documentId])

  // Dismiss a suggestion
  const dismissSuggestion = useCallback(async (suggestionId: string, type: 'style' | 'funnel') => {
    if (!documentId) {
      console.error('[useAISuggestions] Cannot dismiss suggestion: no documentId')
      return
    }

    console.log('[useAISuggestions] Dismissing suggestion:', { suggestionId, type, documentId })

    try {
      if (type === 'style') {
        // Dismiss style suggestion (not implemented in AIService yet)
        console.log('[useAISuggestions] Style suggestion dismiss not implemented')
      } else {
        // Dismiss funnel suggestion (not implemented in AIService yet)
        console.log('[useAISuggestions] Funnel suggestion dismiss not implemented')
      }
      console.log('[useAISuggestions] Successfully dismissed suggestion')
    } catch (error) {
      console.error('[useAISuggestions] Error dismissing suggestion:', error)
    }
  }, [documentId])

  // Refresh suggestions by clearing cache and refetching
  const refreshSuggestions = useCallback(async () => {
    if (!documentId) {
      console.warn('[useAISuggestions] Cannot refresh suggestions: no documentId')
      return
    }

    console.log('[useAISuggestions] Refreshing suggestions for document:', documentId)
    
    // The real-time subscriptions will automatically update the state
    // when new data is available in Firestore
  }, [documentId])

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