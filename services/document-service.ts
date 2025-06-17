import { firestore } from '@/lib/firebase'
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  orderBy,
  getDoc,
  deleteDoc,
  where,
} from 'firebase/firestore'
import type { Document, DocumentVersion } from '@/types/document'

export class DocumentService {
  static async createDocument(
    userId: string,
    document: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, 'documents'), {
        ...document,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating document:', error)
      throw new Error('Failed to create document')
    }
  }

  static async getDocument(documentId: string): Promise<Document | null> {
    try {
      const docRef = doc(firestore, 'documents', documentId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Document
      }
      return null
    } catch (error) {
      console.error('Error getting document:', error)
      throw new Error('Failed to get document')
    }
  }

  static getDocuments(userId: string, callback: (documents: Document[]) => void) {
    const q = query(
      collection(firestore, 'documents'),
      where('ownerId', '==', userId),
    )
    return onSnapshot(q, (querySnapshot) => {
      const documents: Document[] = []
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() } as Document)
      })
      callback(documents)
    })
  }

  static async updateDocument(
    documentId: string,
    updates: Partial<Document>,
  ): Promise<void> {
    try {
      const docRef = doc(firestore, 'documents', documentId)
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() })
    } catch (error) {
      console.error('Error updating document:', error)
      throw new Error('Failed to update document')
    }
  }

  static async deleteDocument(documentId: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, 'documents', documentId))
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
  }

  static async getDocumentVersions(docId: string): Promise<DocumentVersion[]> {
    const versionsRef = collection(firestore, 'documents', docId, 'versions')
    const q = query(versionsRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    const versions: DocumentVersion[] = []
    querySnapshot.forEach((doc) => {
      versions.push({ id: doc.id, ...doc.data() } as DocumentVersion)
    })
    return versions
  }
}
