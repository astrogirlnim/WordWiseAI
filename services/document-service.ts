import { ref, push, set, get, onValue, off } from 'firebase/database'
import { database } from '@/lib/firebase'
import type { Document } from '@/types/document'
import type { WritingGoals } from '@/types/writing-goals'

export class DocumentService {
  static async createDocument(userId: string, title: string): Promise<string> {
    try {
      const documentsRef = ref(database, `documents/${userId}`)
      const newDocRef = push(documentsRef)

      const document: Omit<Document, 'id'> = {
        title,
        content: '',
        userId,
        orgId: '', // Default empty for MVP
        status: 'draft',
        analysisSummary: {
          overallScore: 0,
          brandAlignmentScore: 0,
          lastAnalyzedAt: 0,
          suggestionCount: 0,
        },
        lastSaved: Date.now(),
        wordCount: 0,
        characterCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await set(newDocRef, document)
      return newDocRef.key!
    } catch (error) {
      console.error('Error creating document:', error)
      throw new Error('Failed to create document')
    }
  }

  static async updateDocument(
    userId: string,
    documentId: string,
    updates: Partial<Document>,
  ): Promise<void> {
    try {
      const docRef = ref(database, `documents/${userId}/${documentId}`)
      const updateData = {
        ...updates,
        updatedAt: Date.now(),
        lastSaved: Date.now(),
      }

      await set(docRef, updateData)
    } catch (error) {
      console.error('Error updating document:', error)
      throw new Error('Failed to update document')
    }
  }

  static async getDocument(
    userId: string,
    documentId: string,
  ): Promise<Document | null> {
    try {
      const docRef = ref(database, `documents/${userId}/${documentId}`)
      const snapshot = await get(docRef)

      if (snapshot.exists()) {
        const document = { id: documentId, ...snapshot.val() } as Document
        return document
      }

      return null
    } catch (error) {
      console.error('Error getting document:', error)
      return null
    }
  }

  static async getUserDocuments(userId: string): Promise<Document[]> {
    try {
      const documentsRef = ref(database, `documents/${userId}`)
      const snapshot = await get(documentsRef)

      if (snapshot.exists()) {
        const documentsData = snapshot.val()
        const documents = Object.entries(documentsData).map(([id, data]) => ({
          id,
          ...(data as any),
        })) as Document[]

        // Sort by updatedAt descending
        documents.sort((a, b) => b.updatedAt - a.updatedAt)
        return documents
      }

      return []
    } catch (error) {
      console.error('Error getting user documents:', error)
      return []
    }
  }

  static subscribeToDocument(
    userId: string,
    documentId: string,
    callback: (document: Document | null) => void,
  ): () => void {
    const docRef = ref(database, `documents/${userId}/${documentId}`)

    const unsubscribe = onValue(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const document = { id: documentId, ...snapshot.val() } as Document
        callback(document)
      } else {
        callback(null)
      }
    })

    return () => off(docRef, 'value', unsubscribe)
  }

  static async deleteDocument(
    userId: string,
    documentId: string,
  ): Promise<void> {
    try {
      const docRef = ref(database, `documents/${userId}/${documentId}`)
      await set(docRef, null)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
  }
}
