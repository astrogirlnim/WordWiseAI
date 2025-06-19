import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type {
  Document as DocumentType,
  FirestoreTimestamp,
} from '@/types/document'
import type { WritingGoals } from '@/types/writing-goals'

const getMillis = (timestamp: FirestoreTimestamp | undefined): number => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis()
  }
  if (typeof timestamp === 'number') {
    return timestamp
  }
  return 0 // Or handle as an error, depending on requirements
}

export class DocumentService {
  static async createDocument(
    ownerId: string,
    title: string,
  ): Promise<string> {
    try {
      const docData: Omit<DocumentType, 'id'> = {
        title,
        content: '',
        ownerId,
        orgId: '', // Default empty for MVP
        status: 'draft',
        sharedWith: [],
        isPublic: false,
        publicViewMode: 'view',
        workflowState: {
          currentStatus: 'draft',
          submittedForReview: false,
          reviewedBy: [],
        },
        analysisSummary: {
          overallScore: 0,
          brandAlignmentScore: 0,
          lastAnalyzedAt: serverTimestamp(),
          suggestionCount: 0,
        },
        lastSaved: serverTimestamp(),
        wordCount: 0,
        characterCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(firestore, 'documents'), docData)
      return docRef.id
    } catch (error) {
      console.error('Error creating document:', error)
      throw new Error('Failed to create document')
    }
  }

  static async updateDocument(
    documentId: string,
    updates: Partial<DocumentType>,
  ): Promise<void> {
    try {
      const docRef = doc(firestore, 'documents', documentId)
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastSaved: serverTimestamp(),
      }
      await updateDoc(docRef, updateData)
    } catch (error) {
      console.error('Error updating document:', error)
      throw new Error('Failed to update document')
    }
  }

  static async getDocument(documentId: string): Promise<DocumentType | null> {
    try {
      const docRef = doc(firestore, 'documents', documentId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as DocumentType
      }

      return null
    } catch (error) {
      console.error('Error getting document:', error)
      return null
    }
  }

  static async getUserDocuments(ownerId: string): Promise<DocumentType[]> {
    try {
      const q = query(
        collection(firestore, 'documents'),
        where('ownerId', '==', ownerId),
      )
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as DocumentType),
      )
      // Sort by updatedAt descending
      documents.sort((a, b) => {
        const timeA = getMillis(a.updatedAt)
        const timeB = getMillis(b.updatedAt)
        return timeB - timeA
      })
      return documents
    } catch (error) {
      console.error('Error getting user documents:', error)
      return []
    }
  }

  static subscribeToDocument(
    documentId: string,
    callback: (document: DocumentType | null) => void,
  ): () => void {
    const docRef = doc(firestore, 'documents', documentId)
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as DocumentType)
      } else {
        callback(null)
      }
    })
    return unsubscribe
  }

  static async deleteDocument(documentId: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'documents', documentId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
  }
}
