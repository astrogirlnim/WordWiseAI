import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type { AISuggestion } from '@/types/ai-features'


export class SuggestionService {
  /**
   * Subscribe to AI suggestions for a specific document
   * @param documentId - The document ID to fetch suggestions for
   * @param userId - The user ID for security filtering
   * @param onUpdate - Callback function to handle suggestions updates
   * @returns Unsubscribe function
   */
  static subscribeToSuggestions(
    documentId: string,
    userId: string,
    onUpdate: (suggestions: AISuggestion[]) => void
  ): () => void {
    console.log('[SuggestionService] Setting up subscription for document:', documentId, 'user:', userId)
    
    const suggestionsRef = collection(firestore, `documents/${documentId}/styleSuggestions`)
    const q = query(
      suggestionsRef,
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        console.log('[SuggestionService] Received suggestions update. Count:', snapshot.size)
        
        const suggestions: AISuggestion[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log('[SuggestionService] Processing suggestion:', doc.id, data)
          
          // Convert Firestore timestamp to number for consistency
          const suggestion: AISuggestion = {
            id: doc.id,
            documentId: data.documentId || documentId,
            userId: data.userId || userId,
            type: data.type || 'style',
            title: data.title || 'Untitled Suggestion',
            description: data.description || '',
            originalText: data.originalText || '',
            suggestedText: data.suggestedText || '',
            position: data.position || { start: 0, end: 0 },
            confidence: data.confidence || 90,
            status: data.status || 'pending',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
            appliedAt: data.appliedAt instanceof Timestamp ? data.appliedAt.toMillis() : undefined
          }
          
          suggestions.push(suggestion)
        })
        
        console.log('[SuggestionService] Processed suggestions:', suggestions.length)
        onUpdate(suggestions)
      },
      (error: FirestoreError) => {
        console.error('[SuggestionService] Error subscribing to suggestions:', error)
        // Still call onUpdate with empty array to handle errors gracefully
        onUpdate([])
      }
    )
  }

  /**
   * Apply a suggestion to a document
   * @param suggestion - The suggestion to apply
   * @returns Promise that resolves when the suggestion is marked as applied
   */
  static async applySuggestion(suggestion: AISuggestion): Promise<void> {
    console.log('[SuggestionService] Applying suggestion:', suggestion.id)
    console.log('[SuggestionService] Suggestion details:', {
      title: suggestion.title,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestedText,
      position: suggestion.position
    })

    // Determine the correct collection based on suggestion type
    const funnelTypes = ['headline', 'subheadline', 'cta', 'outline']
    const collectionName = funnelTypes.includes(suggestion.type) ? 'funnelSuggestions' : 'styleSuggestions'

    try {
      const suggestionRef = doc(firestore, `documents/${suggestion.documentId}/${collectionName}`, suggestion.id)
      await updateDoc(suggestionRef, {
        status: 'applied',
        appliedAt: serverTimestamp()
      })
      console.log('[SuggestionService] Successfully applied suggestion:', suggestion.id)
    } catch (error) {
      console.error('[SuggestionService] Error applying suggestion:', error)
      throw new Error(`Failed to apply suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Dismiss a suggestion
   * @param documentId - The document ID
   * @param suggestionId - The suggestion ID to dismiss
   * @param suggestionType - The suggestion type (optional, for correct collection)
   * @returns Promise that resolves when the suggestion is marked as dismissed
   */
  static async dismissSuggestion(documentId: string, suggestionId: string, suggestionType?: string): Promise<void> {
    console.log('[SuggestionService] Dismissing suggestion:', suggestionId, 'for document:', documentId)

    // Determine the correct collection based on suggestion type
    const funnelTypes = ['headline', 'subheadline', 'cta', 'outline']
    const collectionName = funnelTypes.includes(suggestionType || '') ? 'funnelSuggestions' : 'styleSuggestions'

    try {
      const suggestionRef = doc(firestore, `documents/${documentId}/${collectionName}`, suggestionId)
      await updateDoc(suggestionRef, {
        status: 'dismissed',
        appliedAt: serverTimestamp() // Track when it was dismissed
      })
      console.log('[SuggestionService] Successfully dismissed suggestion:', suggestionId)
    } catch (error) {
      console.error('[SuggestionService] Error dismissing suggestion:', error)
      throw new Error(`Failed to dismiss suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all suggestions for a document (for debugging/admin purposes)
   * @param documentId - The document ID
   * @param userId - The user ID for security filtering
   * @returns Promise that resolves to an array of suggestions
   */
  static async getAllSuggestions(documentId: string, userId: string): Promise<AISuggestion[]> {
    console.log('[SuggestionService] Getting all suggestions for document:', documentId, 'user:', userId)

    try {
      const suggestionsRef = collection(firestore, `documents/${documentId}/styleSuggestions`)
      const q = query(
        suggestionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const suggestions: AISuggestion[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        const suggestion: AISuggestion = {
          id: doc.id,
          documentId: data.documentId || documentId,
          userId: data.userId || userId,
          type: data.type || 'style',
          title: data.title || 'Untitled Suggestion',
          description: data.description || '',
          originalText: data.originalText || '',
          suggestedText: data.suggestedText || '',
          position: data.position || { start: 0, end: 0 },
          confidence: data.confidence || 90,
          status: data.status || 'pending',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
          appliedAt: data.appliedAt instanceof Timestamp ? data.appliedAt.toMillis() : undefined
        }
        suggestions.push(suggestion)
      })
      
      console.log('[SuggestionService] Retrieved all suggestions:', suggestions.length)
      return suggestions
    } catch (error) {
      console.error('[SuggestionService] Error getting all suggestions:', error)
      throw new Error(`Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Batch dismiss multiple suggestions
   * @param documentId - The document ID
   * @param suggestionIds - Array of suggestion IDs to dismiss
   * @returns Promise that resolves when all suggestions are dismissed
   */
  static async batchDismissSuggestions(documentId: string, suggestionIds: string[]): Promise<void> {
    console.log('[SuggestionService] Batch dismissing suggestions:', suggestionIds.length, 'for document:', documentId)

    if (suggestionIds.length === 0) {
      console.log('[SuggestionService] No suggestions to dismiss')
      return
    }

    try {
      const batch = writeBatch(firestore)
      
      suggestionIds.forEach((suggestionId) => {
        const suggestionRef = doc(firestore, `documents/${documentId}/styleSuggestions`, suggestionId)
        batch.update(suggestionRef, {
          status: 'dismissed',
          appliedAt: serverTimestamp()
        })
      })
      
      await batch.commit()
      console.log('[SuggestionService] Successfully batch dismissed suggestions:', suggestionIds.length)
    } catch (error) {
      console.error('[SuggestionService] Error batch dismissing suggestions:', error)
      throw new Error(`Failed to batch dismiss suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }



  /**
   * Subscribe to funnel suggestions for a specific document
   * @param documentId - The document ID to fetch funnel suggestions for
   * @param userId - The user ID for security filtering
   * @param onUpdate - Callback function to handle funnel suggestions updates
   * @returns Unsubscribe function
   */
  static subscribeToFunnelSuggestions(
    documentId: string,
    userId: string,
    onUpdate: (suggestions: AISuggestion[]) => void
  ): () => void {
    console.log('[SuggestionService] Setting up funnel subscription for document:', documentId, 'user:', userId)
    const suggestionsRef = collection(firestore, `documents/${documentId}/funnelSuggestions`)
    const q = query(
      suggestionsRef,
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        console.log('[SuggestionService] Received funnel suggestions update. Count:', snapshot.size)
        const suggestions: AISuggestion[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          const suggestion: AISuggestion = {
            id: doc.id,
            documentId: data.documentId || documentId,
            userId: data.userId || userId,
            type: data.type || 'headline',
            title: data.title || 'Untitled Suggestion',
            description: data.description || '',
            originalText: data.originalText || '',
            suggestedText: data.suggestedText || '',
            position: data.position || { start: 0, end: 0 },
            confidence: data.confidence || 90,
            status: data.status || 'pending',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
            appliedAt: data.appliedAt instanceof Timestamp ? data.appliedAt.toMillis() : undefined
          }
          suggestions.push(suggestion)
        })
        console.log('[SuggestionService] Processed funnel suggestions:', suggestions.length)
        onUpdate(suggestions)
      },
      (error: FirestoreError) => {
        console.error('[SuggestionService] Error subscribing to funnel suggestions:', error)
        onUpdate([])
      }
    )
  }
}