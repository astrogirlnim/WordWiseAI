import { ref, push, set, get, onValue, off } from "firebase/database"
import { database } from "@/lib/firebase"
import { PostgresCache } from "@/lib/postgres"
import type { Document } from "@/types/document"
import type { WritingGoals } from "@/types/writing-goals"

export class DocumentService {
  static async createDocument(userId: string, title: string, writingGoals: WritingGoals): Promise<string> {
    try {
      const documentsRef = ref(database, `documents/${userId}`)
      const newDocRef = push(documentsRef)

      const document: Omit<Document, "id"> = {
        title,
        content: "",
        userId,
        writingGoals,
        lastSaved: Date.now(),
        wordCount: 0,
        characterCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await set(newDocRef, document)

      // Clear user's document cache
      await PostgresCache.delete(`documents:${userId}`)

      return newDocRef.key!
    } catch (error) {
      console.error("Error creating document:", error)
      throw new Error("Failed to create document")
    }
  }

  static async updateDocument(userId: string, documentId: string, updates: Partial<Document>): Promise<void> {
    try {
      const docRef = ref(database, `documents/${userId}/${documentId}`)
      const updateData = {
        ...updates,
        updatedAt: Date.now(),
        lastSaved: Date.now(),
      }

      await set(docRef, updateData)

      // Clear cache
      await PostgresCache.delete(`documents:${userId}`)
      await PostgresCache.delete(`document:${documentId}`)
    } catch (error) {
      console.error("Error updating document:", error)
      throw new Error("Failed to update document")
    }
  }

  static async getDocument(userId: string, documentId: string): Promise<Document | null> {
    try {
      // Try cache first
      const cacheKey = `document:${documentId}`
      const cached = await PostgresCache.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      const docRef = ref(database, `documents/${userId}/${documentId}`)
      const snapshot = await get(docRef)

      if (snapshot.exists()) {
        const document = { id: documentId, ...snapshot.val() } as Document

        // Cache for 5 minutes
        await PostgresCache.set(cacheKey, JSON.stringify(document), 300)

        return document
      }

      return null
    } catch (error) {
      console.error("Error getting document:", error)
      return null
    }
  }

  static async getUserDocuments(userId: string): Promise<Document[]> {
    try {
      // Try cache first
      const cacheKey = `documents:${userId}`
      const cached = await PostgresCache.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      const documentsRef = ref(database, `documents/${userId}`)
      const snapshot = await get(documentsRef)

      if (snapshot.exists()) {
        const documentsData = snapshot.val()
        const documents = Object.entries(documentsData).map(([id, data]) => ({
          id,
          ...data,
        })) as Document[]

        // Sort by updatedAt descending
        documents.sort((a, b) => b.updatedAt - a.updatedAt)

        // Cache for 2 minutes
        await PostgresCache.set(cacheKey, JSON.stringify(documents), 120)

        return documents
      }

      return []
    } catch (error) {
      console.error("Error getting user documents:", error)
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

    return () => off(docRef, "value", unsubscribe)
  }

  static async deleteDocument(userId: string, documentId: string): Promise<void> {
    try {
      const docRef = ref(database, `documents/${userId}/${documentId}`)
      await set(docRef, null)

      // Clear cache
      await PostgresCache.delete(`documents:${userId}`)
      await PostgresCache.delete(`document:${documentId}`)
    } catch (error) {
      console.error("Error deleting document:", error)
      throw new Error("Failed to delete document")
    }
  }
}
