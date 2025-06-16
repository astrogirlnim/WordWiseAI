"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { DocumentService } from "@/services/document-service"
import type { Document } from "@/types/document"

export function useDocuments() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const userDocuments = await DocumentService.getUserDocuments(user.uid)
      setDocuments(userDocuments)
      setError(null)
    } catch (err) {
      setError("Failed to load documents")
      console.error("Error loading documents:", err)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  const createDocument = useCallback(
    async (title: string) => {
      if (!user?.uid) return null

      try {
        const documentId = await DocumentService.createDocument(user.uid, title)
        await loadDocuments() // Refresh the list
        return documentId
      } catch (err) {
        setError("Failed to create document")
        console.error("Error creating document:", err)
        return null
      }
    },
    [user?.uid, loadDocuments],
  )

  const updateDocument = useCallback(
    async (documentId: string, updates: Partial<Document>) => {
      if (!user?.uid) return

      try {
        await DocumentService.updateDocument(user.uid, documentId, updates)
        // Update local state
        setDocuments((prev) => prev.map((doc) => (doc.id === documentId ? { ...doc, ...updates } : doc)))
      } catch (err) {
        setError("Failed to update document")
        console.error("Error updating document:", err)
      }
    },
    [user?.uid],
  )

  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!user?.uid) return

      try {
        await DocumentService.deleteDocument(user.uid, documentId)
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      } catch (err) {
        setError("Failed to delete document")
        console.error("Error deleting document:", err)
      }
    },
    [user?.uid],
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
