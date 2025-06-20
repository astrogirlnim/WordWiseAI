/**
 * @fileoverview Custom hook for managing comments associated with a document.
 * Provides state and functions for interacting with the CommentService.
 */

import { useState, useEffect, useCallback } from 'react'
import { CommentService } from '@/services/comment-service'
import type { Comment } from '@/types/comment'

/**
 * A custom hook to manage comments for a specific document.
 * @param documentId The ID of the document to fetch comments for.
 * @returns An object containing the comments, loading state, and action functions.
 */
export function useComments(documentId: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!documentId) {
      setComments([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = CommentService.subscribeToComments(
      documentId,
      (newComments) => {
        setComments(newComments)
        setLoading(false)
      },
      // (err) => { // This part was not in the service, but good practice
      //   setError(err)
      //   setLoading(false)
      // }
    )

    return () => unsubscribe()
  }, [documentId])

  const addComment = useCallback(
    async (commentData: Pick<Comment, 'content' | 'anchorStart' | 'anchorEnd' | 'anchoredText'>) => {
      if (!documentId) {
        console.error('[useComments] No documentId provided to addComment.')
        return
      }
      try {
        await CommentService.addComment(documentId, commentData)
      } catch (e) {
        console.error('[useComments] Error adding comment:', e)
        setError(e as Error)
      }
    },
    [documentId],
  )

  const updateComment = useCallback(
    async (commentId: string, updates: Partial<Comment>) => {
      if (!documentId) {
        console.error('[useComments] No documentId provided to updateComment.')
        return
      }
      try {
        await CommentService.updateComment(documentId, commentId, updates)
      } catch (e) {
        console.error('[useComments] Error updating comment:', e)
        setError(e as Error)
      }
    },
    [documentId],
  )

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!documentId) {
        console.error('[useComments] No documentId provided to deleteComment.')
        return
      }
      try {
        await CommentService.deleteComment(documentId, commentId)
      } catch (e) {
        console.error('[useComments] Error deleting comment:', e)
        setError(e as Error)
      }
    },
    [documentId],
  )
  
  const resolveComment = useCallback(
    async (commentId: string) => {
      if (!documentId) {
        console.error('[useComments] No documentId provided to resolveComment.')
        return
      }
      try {
        await CommentService.resolveComment(documentId, commentId)
      } catch (e) {
        console.error('[useComments] Error resolving comment:', e)
        setError(e as Error)
      }
    },
    [documentId],
  )

  const reactivateComment = useCallback(
    async (commentId: string) => {
      if (!documentId) {
        console.error('[useComments] No documentId provided to reactivateComment.')
        return
      }
      try {
        await CommentService.reactivateComment(documentId, commentId)
      } catch (e) {
        console.error('[useComments] Error reactivating comment:', e)
        setError(e as Error)
      }
    },
    [documentId],
  )

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    reactivateComment,
  }
} 