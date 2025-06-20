/**
 * @fileoverview Service for managing comments in Firestore.
 * Provides functions for creating, reading, updating, and deleting comments.
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
  deleteField,
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import type { Comment } from '@/types/comment'
import { getAuth } from 'firebase/auth'

/**
 * Safely converts a Firestore timestamp to milliseconds
 */
function getTimestampMillis(timestamp: any): number {
  if (!timestamp) return Date.now()
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis()
  }
  if (typeof timestamp === 'number') {
    return timestamp
  }
  // For FieldValue.serverTimestamp() during real-time updates
  return Date.now()
}

/**
 * Creates a query for the comments subcollection of a document.
 * @param documentId The ID of the document.
 * @returns A query for the comments subcollection.
 */
const commentsCollection = (documentId: string) =>
  collection(firestore, `documents/${documentId}/comments`)

/**
 * Subscribes to the comments of a document and calls a callback with the comments.
 * @param documentId The ID of the document.
 * @param callback The function to call with the comments.
 * @returns An unsubscribe function.
 */
function subscribeToComments(
  documentId: string,
  callback: (comments: Comment[]) => void,
): () => void {
  console.log(`[CommentService] Subscribing to comments for doc: ${documentId}`)
  const q = query(commentsCollection(documentId), orderBy('createdAt', 'asc'))

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const comments = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: getTimestampMillis(data.createdAt),
          updatedAt: getTimestampMillis(data.updatedAt),
          resolvedAt: data.resolvedAt ? getTimestampMillis(data.resolvedAt) : undefined,
        } as Comment
      })
      console.log(`[CommentService] Fetched ${comments.length} comments.`)
      callback(comments)
    },
    (error) => {
      console.error('[CommentService] Error fetching comments:', error)
    },
  )
  return unsubscribe
}

/**
 * Adds a new comment to a document.
 * @param documentId The ID of the document.
 * @param commentData The data for the new comment.
 * @returns The ID of the newly created comment.
 */
async function addComment(
  documentId: string,
  commentData: Pick<Comment, 'content' | 'anchorStart' | 'anchorEnd' | 'anchoredText'>,
): Promise<string | null> {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    console.error('[CommentService] User not authenticated to add comment.')
    return null
  }

  console.log(`[CommentService] Adding comment to doc: ${documentId}`)
  try {
    const docRef = await addDoc(commentsCollection(documentId), {
      ...commentData,
      docId: documentId,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorEmail: user.email || '',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log(`[CommentService] Comment added with ID: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    console.error('[CommentService] Error adding comment:', error)
    return null
  }
}

/**
 * Updates an existing comment.
 * @param documentId The ID of the document.
 * @param commentId The ID of the comment to update.
 * @param updates The partial data to update the comment with.
 */
async function updateComment(
  documentId: string,
  commentId: string,
  updates: Partial<Comment>,
): Promise<void> {
  console.log(`[CommentService] Updating comment ${commentId} in doc: ${documentId}`)
  try {
    const commentRef = doc(firestore, `documents/${documentId}/comments/${commentId}`)
    await updateDoc(commentRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    console.log(`[CommentService] Comment ${commentId} updated.`)
  } catch (error) {
    console.error(`[CommentService] Error updating comment ${commentId}:`, error)
  }
}

/**
 * Deletes a comment.
 * @param documentId The ID of the document.
 * @param commentId The ID of the comment to delete.
 */
async function deleteComment(documentId: string, commentId: string): Promise<void> {
  console.log(`[CommentService] Deleting comment ${commentId} from doc: ${documentId}`)
  try {
    const commentRef = doc(firestore, `documents/${documentId}/comments/${commentId}`)
    await deleteDoc(commentRef)
    console.log(`[CommentService] Comment ${commentId} deleted successfully. Highlights should update automatically.`)
  } catch (error) {
    console.error(`[CommentService] Error deleting comment ${commentId}:`, error)
    // Log the specific error for debugging
    if (error instanceof Error) {
      console.error(`[CommentService] Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw error // Re-throw to let the UI handle it
  }
}

/**
 * Resolves a comment thread.
 * @param documentId The ID of the document.
 * @param commentId The ID of the comment to resolve.
 */
async function resolveComment(documentId: string, commentId: string): Promise<void> {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    console.error('[CommentService] User not authenticated to resolve comment.')
    return
  }
  
  return updateComment(documentId, commentId, {
    status: 'resolved',
    resolvedAt: Date.now(),
    resolvedBy: user.uid,
  })
}

/**
 * Reactivates a resolved comment thread.
 * @param documentId The ID of the document.
 * @param commentId The ID of the comment to reactivate.
 */
async function reactivateComment(documentId: string, commentId: string): Promise<void> {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    console.error('[CommentService] User not authenticated to reactivate comment.')
    return
  }

  console.log(`[CommentService] Reactivating comment ${commentId} in doc: ${documentId}`)
  try {
    const commentRef = doc(firestore, `documents/${documentId}/comments/${commentId}`)
    await updateDoc(commentRef, {
      status: 'active',
      resolvedAt: deleteField(),
      resolvedBy: deleteField(),
      updatedAt: serverTimestamp(),
    })
    console.log(`[CommentService] Comment ${commentId} reactivated.`)
  } catch (error) {
    console.error(`[CommentService] Error reactivating comment ${commentId}:`, error)
  }
}


export const CommentService = {
  subscribeToComments,
  addComment,
  updateComment,
  deleteComment,
  resolveComment,
  reactivateComment,
} 