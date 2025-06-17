import { firestore } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import type { Comment } from '@/types/comment'

export function getComments(docId: string, onUpdate: (comments: Comment[]) => void) {
  const q = query(collection(firestore, 'comments'), where('docId', '==', docId))
  return onSnapshot(q, (querySnapshot) => {
    const comments: Comment[] = []
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() } as Comment)
    })
    onUpdate(comments)
  })
}

export async function addComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
  await addDoc(collection(firestore, 'comments'), {
    ...comment,
    createdAt: serverTimestamp(),
  })
}

export async function resolveComment(commentId: string) {
  const commentRef = doc(firestore, 'comments', commentId)
  await updateDoc(commentRef, {
    resolvedAt: serverTimestamp(),
  })
} 