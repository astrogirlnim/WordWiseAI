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
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type {
  Document as DocumentType,
  DocumentAccess,
  FirestoreTimestamp,
} from '@/types/document'
import type { WritingGoals } from '@/types/writing-goals'
import { userService } from './user-service'

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
        sharedWithIds: [],
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

  static async getOwnedDocuments(ownerId: string): Promise<DocumentType[]> {
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

  static async getSharedDocuments(userId: string): Promise<DocumentType[]> {
    try {
      const q = query(
        collection(firestore, 'documents'),
        where('sharedWithIds', 'array-contains', userId),
      )
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as DocumentType),
      )
      documents.sort((a, b) => {
        const timeA = getMillis(a.updatedAt)
        const timeB = getMillis(b.updatedAt)
        return timeB - timeA
      })
      return documents
    } catch (error) {
      console.error('Error getting shared documents:', error)
      return []
    }
  }

  static async getPublicDocuments(): Promise<DocumentType[]> {
    try {
      const q = query(
        collection(firestore, 'documents'),
        where('isPublic', '==', true),
      )
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as DocumentType),
      )
      documents.sort((a, b) => {
        const timeA = getMillis(a.updatedAt)
        const timeB = getMillis(b.updatedAt)
        return timeB - timeA
      })
      return documents
    } catch (error) {
      console.error('Error getting public documents:', error)
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

  static async shareDocument(
    documentId: string,
    emails: string[],
    role: DocumentAccess['role'],
    sharedBy: string,
  ): Promise<void> {
    const docRef = doc(firestore, 'documents', documentId)
    const batch = writeBatch(firestore)

    for (const email of emails) {
      const userToShareWith = await userService.findUserByEmail(email)
      if (!userToShareWith) {
        throw new Error(`User with email ${email} not found.`)
      }

      const newAccess: DocumentAccess = {
        userId: userToShareWith.id,
        email: userToShareWith.email,
        role,
        addedAt: serverTimestamp(),
        addedBy: sharedBy,
      }

      batch.update(docRef, {
        sharedWith: arrayUnion(newAccess),
        sharedWithIds: arrayUnion(userToShareWith.id),
      })
    }

    await batch.commit()
  }

  static async updateUserRole(
    documentId: string,
    userId: string,
    newRole: DocumentAccess['role'],
  ): Promise<void> {
    const docRef = doc(firestore, 'documents', documentId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) throw new Error('Document not found')

    const document = docSnap.data() as DocumentType
    const sharedWith = document.sharedWith.map((access) => {
      if (access.userId === userId) {
        return { ...access, role: newRole }
      }
      return access
    })

    await updateDoc(docRef, { sharedWith })
  }

  static async removeUserAccess(
    documentId: string,
    userId: string,
  ): Promise<void> {
    const docRef = doc(firestore, 'documents', documentId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) throw new Error('Document not found')

    const document = docSnap.data() as DocumentType
    const accessToRemove = document.sharedWith.find(
      (access) => access.userId === userId,
    )

    if (accessToRemove) {
      await updateDoc(docRef, {
        sharedWith: arrayRemove(accessToRemove),
        sharedWithIds: arrayRemove(userId),
      })
    }
  }
}
