import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import type { Comment } from '@/types/comment'

export class CommentService {
  /**
   * Add a new comment to a document
   * @param documentId - The document ID
   * @param comment - Comment data without id and timestamps
   * @returns Promise with the created comment ID
   */
  static async addComment(
    documentId: string, 
    commentData: Omit<Comment, 'id' | 'createdAt'>
  ): Promise<string> {
    console.log('[CommentService] Adding comment to document:', documentId, commentData)
    
    try {
      const commentsRef = collection(firestore, `documents/${documentId}/comments`)
      const docRef = await addDoc(commentsRef, {
        ...commentData,
        createdAt: serverTimestamp()
      })
      
      console.log('[CommentService] Comment added successfully with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('[CommentService] Error adding comment:', error)
      throw new Error('Failed to add comment')
    }
  }

  /**
   * Update an existing comment
   * @param documentId - The document ID
   * @param commentId - The comment ID to update
   * @param updates - Partial comment data to update
   */
  static async updateComment(
    documentId: string, 
    commentId: string, 
    updates: Partial<Omit<Comment, 'id' | 'docId' | 'createdAt'>>
  ): Promise<void> {
    console.log('[CommentService] Updating comment:', commentId, updates)
    
    try {
      const commentRef = doc(firestore, `documents/${documentId}/comments/${commentId}`)
      await updateDoc(commentRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
      
      console.log('[CommentService] Comment updated successfully:', commentId)
    } catch (error) {
      console.error('[CommentService] Error updating comment:', error)
      throw new Error('Failed to update comment')
    }
  }

  /**
   * Resolve a comment
   * @param documentId - The document ID
   * @param commentId - The comment ID to resolve
   * @param resolvedBy - User ID who resolved the comment
   */
  static async resolveComment(
    documentId: string, 
    commentId: string, 
    resolvedBy: string
  ): Promise<void> {
    console.log('[CommentService] Resolving comment:', commentId, 'by user:', resolvedBy)
    
    try {
      const commentRef = doc(firestore, `documents/${documentId}/comments/${commentId}`)
      await updateDoc(commentRef, {
        resolvedAt: serverTimestamp(),
        resolvedBy,
        status: 'resolved'
      })
      
      console.log('[CommentService] Comment resolved successfully:', commentId)
    } catch (error) {
      console.error('[CommentService] Error resolving comment:', error)
      throw new Error('Failed to resolve comment')
    }
  }

  /**
   * Unresolve a comment
   * @param documentId - The document ID
   * @param commentId - The comment ID to unresolve
   */
  static async unresolveComment(
    documentId: string, 
    commentId: string
  ): Promise<void> {
    console.log('[CommentService] Unresolving comment:', commentId)
    
    try {
      const commentRef = doc(firestore, `documents/${documentId}/comments/${commentId}`)
      await updateDoc(commentRef, {
        resolvedAt: null,
        resolvedBy: null,
        status: 'active'
      })
      
      console.log('[CommentService] Comment unresolved successfully:', commentId)
    } catch (error) {
      console.error('[CommentService] Error unresolving comment:', error)
      throw new Error('Failed to unresolve comment')
    }
  }

  /**
   * Delete a comment
   * @param documentId - The document ID
   * @param commentId - The comment ID to delete
   */
  static async deleteComment(
    documentId: string, 
    commentId: string
  ): Promise<void> {
    console.log('[CommentService] Deleting comment:', commentId)
    
    try {
      const commentRef = doc(firestore, `documents/${documentId}/comments/${commentId}`)
      await deleteDoc(commentRef)
      
      console.log('[CommentService] Comment deleted successfully:', commentId)
    } catch (error) {
      console.error('[CommentService] Error deleting comment:', error)
      throw new Error('Failed to delete comment')
    }
  }

  /**
   * Subscribe to comments for a document
   * @param documentId - The document ID
   * @param callback - Callback function to receive comment updates
   * @param options - Optional filters (resolved, authorId, etc.)
   * @returns Unsubscribe function
   */
  static subscribeToComments(
    documentId: string,
    callback: (comments: Comment[]) => void,
    options: {
      includeResolved?: boolean
      authorId?: string
    } = {}
  ): () => void {
    console.log('[CommentService] Subscribing to comments for document:', documentId, options)
    
    const commentsRef = collection(firestore, `documents/${documentId}/comments`)
    let q = query(commentsRef, orderBy('createdAt', 'desc'))

    // Filter by author if specified
    if (options.authorId) {
      q = query(q, where('authorId', '==', options.authorId))
    }

    // Filter by resolution status if specified
    if (!options.includeResolved) {
      q = query(q, where('status', '!=', 'resolved'))
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('[CommentService] Comments snapshot received, docs:', snapshot.docs.length)
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to numbers for consistency
          createdAt: doc.data().createdAt?.toMillis() || Date.now(),
          resolvedAt: doc.data().resolvedAt?.toMillis() || undefined
        })) as Comment[]
        
        callback(comments)
        console.log('[CommentService] Comments updated:', comments.length)
      },
      (error) => {
        console.error('[CommentService] Error in comments subscription:', error)
        callback([]) // Return empty array on error
      }
    )

    return unsubscribe
  }

  /**
   * Get comments for a specific text range
   * @param documentId - The document ID
   * @param start - Start position of text range
   * @param end - End position of text range
   */
  static subscribeToCommentsInRange(
    documentId: string,
    start: number,
    end: number,
    callback: (comments: Comment[]) => void
  ): () => void {
    console.log('[CommentService] Subscribing to comments in range:', { documentId, start, end })
    
    const commentsRef = collection(firestore, `documents/${documentId}/comments`)
    const q = query(
      commentsRef,
      where('anchorStart', '>=', start),
      where('anchorEnd', '<=', end),
      orderBy('anchorStart', 'asc')
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('[CommentService] Range comments snapshot received, docs:', snapshot.docs.length)
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toMillis() || Date.now(),
          resolvedAt: doc.data().resolvedAt?.toMillis() || undefined
        })) as Comment[]
        
        callback(comments)
        console.log('[CommentService] Range comments updated:', comments.length)
      },
      (error) => {
        console.error('[CommentService] Error in range comments subscription:', error)
        callback([])
      }
    )

    return unsubscribe
  }

  /**
   * Get comment statistics for a document
   * @param documentId - The document ID
   * @param callback - Callback to receive stats
   * @returns Unsubscribe function
   */
  static subscribeToCommentStats(
    documentId: string,
    callback: (stats: { total: number; resolved: number; active: number }) => void
  ): () => void {
    console.log('[CommentService] Subscribing to comment stats for document:', documentId)
    
    const commentsRef = collection(firestore, `documents/${documentId}/comments`)
    const q = query(commentsRef)

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const total = snapshot.docs.length
        const resolved = snapshot.docs.filter(doc => doc.data().status === 'resolved').length
        const active = total - resolved
        
        const stats = { total, resolved, active }
        console.log('[CommentService] Comment stats updated:', stats)
        callback(stats)
      },
      (error) => {
        console.error('[CommentService] Error in comment stats subscription:', error)
        callback({ total: 0, resolved: 0, active: 0 })
      }
    )

    return unsubscribe
  }
}