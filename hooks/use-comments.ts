import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { CommentService } from '@/services/comment-service'
import type { Comment, CommentStats } from '@/types/comment'

export interface UseCommentsReturn {
  // Comments data
  comments: Comment[]
  commentStats: CommentStats
  // Loading states
  loading: boolean
  addingComment: boolean
  // Actions
  addComment: (content: string, anchorStart: number, anchorEnd: number, anchoredText?: string) => Promise<void>
  updateComment: (commentId: string, content: string) => Promise<void>
  resolveComment: (commentId: string) => Promise<void>
  unresolveComment: (commentId: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  // Filtering
  showResolved: boolean
  setShowResolved: (show: boolean) => void
  // Utility
  getCommentsInRange: (start: number, end: number) => Comment[]
}

export function useComments(documentId: string | null): UseCommentsReturn {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State
  const [comments, setComments] = useState<Comment[]>([])
  const [commentStats, setCommentStats] = useState<CommentStats>({
    total: 0,
    active: 0,
    resolved: 0,
    byAuthor: {}
  })
  const [loading, setLoading] = useState(false)
  const [addingComment, setAddingComment] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  console.log('[useComments] Hook initialized', {
    documentId,
    userId: user?.uid,
    commentsCount: comments.length,
    showResolved
  })

  // Subscribe to comments
  useEffect(() => {
    if (!documentId) {
      console.log('[useComments] No document ID, clearing comments')
      setComments([])
      setCommentStats({ total: 0, active: 0, resolved: 0, byAuthor: {} })
      return
    }

    console.log('[useComments] Setting up comments subscription for document:', documentId)
    setLoading(true)

    const unsubscribe = CommentService.subscribeToComments(
      documentId,
      (updatedComments) => {
        console.log('[useComments] Comments updated:', updatedComments.length)
        setComments(updatedComments)
        setLoading(false)
      },
      { includeResolved: showResolved }
    )

    return unsubscribe
  }, [documentId, showResolved])

  // Subscribe to comment stats
  useEffect(() => {
    if (!documentId) return

    console.log('[useComments] Setting up comment stats subscription')
    const unsubscribe = CommentService.subscribeToCommentStats(
      documentId,
      (stats) => {
        console.log('[useComments] Comment stats updated:', stats)
        // Calculate stats by author
        const byAuthor: Record<string, number> = {}
        comments.forEach(comment => {
          byAuthor[comment.authorId] = (byAuthor[comment.authorId] || 0) + 1
        })
        
        setCommentStats({
          ...stats,
          byAuthor
        })
      }
    )

    return unsubscribe
  }, [documentId, comments])

  // Add a new comment
  const addComment = useCallback(async (
    content: string, 
    anchorStart: number, 
    anchorEnd: number, 
    anchoredText: string = ''
  ) => {
    if (!documentId || !user?.uid) {
      console.error('[useComments] Cannot add comment: missing document or user')
      return
    }

    console.log('[useComments] Adding comment:', { content, anchorStart, anchorEnd })
    setAddingComment(true)

    try {
      const commentId = await CommentService.addComment(documentId, {
        docId: documentId,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous User',
        authorEmail: user.email || '',
        content,
        anchorStart,
        anchorEnd,
        anchoredText,
        status: 'active'
      })

      console.log('[useComments] Comment added successfully:', commentId)
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added to the document.'
      })
    } catch (error) {
      console.error('[useComments] Error adding comment:', error)
      toast({
        title: 'Error Adding Comment',
        description: 'Failed to add your comment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setAddingComment(false)
    }
  }, [documentId, user, toast])

  // Update a comment
  const updateComment = useCallback(async (commentId: string, content: string) => {
    if (!documentId) {
      console.error('[useComments] Cannot update comment: missing document')
      return
    }

    console.log('[useComments] Updating comment:', commentId)

    try {
      await CommentService.updateComment(documentId, commentId, {
        content,
        isEdited: true,
        editedAt: Date.now()
      })

      console.log('[useComments] Comment updated successfully:', commentId)
      toast({
        title: 'Comment Updated',
        description: 'Your comment has been updated.'
      })
    } catch (error) {
      console.error('[useComments] Error updating comment:', error)
      toast({
        title: 'Error Updating Comment',
        description: 'Failed to update your comment. Please try again.',
        variant: 'destructive'
      })
    }
  }, [documentId, toast])

  // Resolve a comment
  const resolveComment = useCallback(async (commentId: string) => {
    if (!documentId || !user?.uid) {
      console.error('[useComments] Cannot resolve comment: missing document or user')
      return
    }

    console.log('[useComments] Resolving comment:', commentId)

    try {
      await CommentService.resolveComment(documentId, commentId, user.uid)
      
      console.log('[useComments] Comment resolved successfully:', commentId)
      toast({
        title: 'Comment Resolved',
        description: 'The comment has been marked as resolved.'
      })
    } catch (error) {
      console.error('[useComments] Error resolving comment:', error)
      toast({
        title: 'Error Resolving Comment',
        description: 'Failed to resolve the comment. Please try again.',
        variant: 'destructive'
      })
    }
  }, [documentId, user, toast])

  // Unresolve a comment
  const unresolveComment = useCallback(async (commentId: string) => {
    if (!documentId) {
      console.error('[useComments] Cannot unresolve comment: missing document')
      return
    }

    console.log('[useComments] Unresolving comment:', commentId)

    try {
      await CommentService.unresolveComment(documentId, commentId)
      
      console.log('[useComments] Comment unresolved successfully:', commentId)
      toast({
        title: 'Comment Reopened',
        description: 'The comment has been reopened for discussion.'
      })
    } catch (error) {
      console.error('[useComments] Error unresolving comment:', error)
      toast({
        title: 'Error Reopening Comment',
        description: 'Failed to reopen the comment. Please try again.',
        variant: 'destructive'
      })
    }
  }, [documentId, toast])

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    if (!documentId) {
      console.error('[useComments] Cannot delete comment: missing document')
      return
    }

    console.log('[useComments] Deleting comment:', commentId)

    try {
      await CommentService.deleteComment(documentId, commentId)
      
      console.log('[useComments] Comment deleted successfully:', commentId)
      toast({
        title: 'Comment Deleted',
        description: 'The comment has been permanently deleted.'
      })
    } catch (error) {
      console.error('[useComments] Error deleting comment:', error)
      toast({
        title: 'Error Deleting Comment',
        description: 'Failed to delete the comment. Please try again.',
        variant: 'destructive'
      })
    }
  }, [documentId, toast])

  // Get comments in a specific range
  const getCommentsInRange = useCallback((start: number, end: number) => {
    return comments.filter(comment => 
      comment.anchorStart >= start && comment.anchorEnd <= end
    )
  }, [comments])

  return {
    comments,
    commentStats,
    loading,
    addingComment,
    addComment,
    updateComment,
    resolveComment,
    unresolveComment,
    deleteComment,
    showResolved,
    setShowResolved,
    getCommentsInRange
  }
}