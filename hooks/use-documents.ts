"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { DocumentService } from "@/services/document-service"
import type { Document } from "@/types/document"
import type { WritingGoals } from "@/types/writing-goals"

export function useDocuments() {
  const { user } = useUser()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const userDocuments = await DocumentService.getUserDocuments(user.id)
      setDocuments(userDocuments)
      setError(null)
    } catch (err) {
      setError("Failed to load documents")
      console.error("Error loading documents:", err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const createDocument = useCallback(
    async (title: string, writingGoals: WritingGoals) => {
      if (!user?.id) return null

      try {
        const documentId = await DocumentService.createDocument(user.id, title, writingGoals)
        await loadDocuments() // Refresh the list
        return documentId
      } catch (err) {
        setError("Failed to create document")
        console.error("Error creating document:", err)
        return null
      }
    },
    [user?.id, loadDocuments],
  )

  const updateDocument = useCallback(
    async (documentId: string, updates: Partial<Document>) => {
      if (!user?.id) return

      try {
        await DocumentService.updateDocument(user.id, documentId, updates)
        // Update local state
        setDocuments((prev) => prev.map((doc) => (doc.id === documentId ? { ...doc, ...updates } : doc)))
      } catch (err) {
        setError("Failed to update document")
        console.error("Error updating document:", err)
      }
    },
    [user?.id],
  )

  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!user?.id) return

      try {
        await DocumentService.deleteDocument(user.id, documentId)
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      } catch (err) {
        setError("Failed to delete document")
        console.error("Error deleting document:", err)
      }
    },
    [user?.id],
  )

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    refreshDocuments: loadDocuments,
  }
}
