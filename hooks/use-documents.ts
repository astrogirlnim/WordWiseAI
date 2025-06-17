'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { DocumentService } from '@/services/document-service'
import { VersionService } from '@/services/version-service'
import { AuditService, AuditEvent } from '@/services/audit-service'
import type { Document } from '@/types/document'

export function useDocuments() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Track last saved content for each document to prevent duplicate versions
  const lastSavedContentRef = useRef<Record<string, string>>({})
  // Track pending saves to prevent race conditions
  const pendingSavesRef = useRef<Set<string>>(new Set())

  const loadDocuments = useCallback(async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const userDocuments = await DocumentService.getUserDocuments(user.uid)
      setDocuments(userDocuments)
      
      // Initialize lastSavedContent tracking
      userDocuments.forEach((doc) => {
        lastSavedContentRef.current[doc.id] = doc.content
      })
      
      setError(null)
      console.log('[useDocuments] Loaded', userDocuments.length, 'documents')
    } catch (err) {
      setError('Failed to load documents')
      console.error('Error loading documents:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  const createDocument = useCallback(
    async (title: string) => {
      if (!user?.uid) return null

      try {
        console.log('[useDocuments] Creating new document:', title)
        const documentId = await DocumentService.createDocument(user.uid, title)
        console.log('[useDocuments] Document created with ID:', documentId)
        
        // Initialize content tracking for new document
        lastSavedContentRef.current[documentId] = ''
        
        await loadDocuments() // Refresh the list
        return documentId
      } catch (err) {
        setError('Failed to create document')
        console.error('Error creating document:', err)
        return null
      }
    },
    [user?.uid, loadDocuments],
  )

  const updateDocument = useCallback(
    async (documentId: string, updates: Partial<Document>) => {
      if (!user?.uid) return

      // Prevent concurrent saves for the same document
      if (pendingSavesRef.current.has(documentId)) {
        console.log('[updateDocument] Save already in progress for', documentId, 'skipping...')
        return
      }

      try {
        pendingSavesRef.current.add(documentId)
        console.log('[updateDocument] Updating document', documentId, 'with updates:', Object.keys(updates))
        
        await DocumentService.updateDocument(documentId, updates)
        console.log('[updateDocument] Document updated successfully')

        // Handle version creation for content updates
        if (updates.content && user) {
          const lastSavedContent = lastSavedContentRef.current[documentId] || ''
          const newContent = updates.content.trim()
          const lastContentTrimmed = lastSavedContent.trim()
          
          console.log('[updateDocument] Content comparison - Last saved length:', lastContentTrimmed.length, 'New length:', newContent.length)
          
          // Only create version if content actually changed (ignoring whitespace-only changes)
          if (newContent !== lastContentTrimmed && newContent.length > 0) {
            console.log('[updateDocument] Content changed significantly, creating version for', documentId)
            
            try {
              const versionId = await VersionService.createVersion(documentId, updates.content, {
                id: user.uid,
                name: user.displayName || 'Unknown User',
              })
              console.log('[updateDocument] Version created:', versionId)
              // Update last saved content only after successful version creation
              lastSavedContentRef.current[documentId] = updates.content
            } catch (versionError) {
              console.error('[updateDocument] Failed to create version:', versionError)
              // Don't block the document update if version creation fails
            }
          } else {
            console.log('[updateDocument] Content unchanged or empty, skipping version creation for', documentId)
          }
        }

        // Update local state
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === documentId ? { ...doc, ...updates } : doc,
          ),
        )
      } catch (err) {
        setError('Failed to update document')
        console.error('Error updating document:', err)
      } finally {
        pendingSavesRef.current.delete(documentId)
      }
    },
    [user],
  )

  const restoreDocumentVersion = useCallback(
    async (documentId: string, versionId: string) => {
      if (!user) return

      try {
        console.log('[restoreDocumentVersion] Restoring version', versionId, 'for document', documentId)
        
        const versionToRestore = await VersionService.getVersion(
          documentId,
          versionId,
        )
        if (!versionToRestore) {
          throw new Error('Version to restore not found')
        }

        const currentDocument = documents.find((d) => d.id === documentId)
        console.log('[restoreDocumentVersion] Current document found:', !!currentDocument)

        // Update the document with restored content
        // Note: This will NOT create a new version because we update lastSavedContent first
        lastSavedContentRef.current[documentId] = versionToRestore.content
        
        await updateDocument(documentId, {
          content: versionToRestore.content,
          // Keep other fields like title from the current document
          title: currentDocument?.title || 'Untitled Document',
        })
        
        console.log('[restoreDocumentVersion] Version restored successfully')
      } catch (err) {
        setError('Failed to restore document version')
        console.error('Error restoring document version:', err)
      }
    },
    [user, documents, updateDocument],
  )

  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!user?.uid) return

      try {
        console.log('[deleteDocument] Deleting document:', documentId)
        await DocumentService.deleteDocument(documentId)

        // Log the delete event
        await AuditService.logEvent(AuditEvent.DOCUMENT_DELETE, user.uid, {
          documentId,
        })
        
        // Clean up tracking
        delete lastSavedContentRef.current[documentId]
        pendingSavesRef.current.delete(documentId)
        
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
        console.log('[deleteDocument] Document deleted successfully')
      } catch (err) {
        setError('Failed to delete document')
        console.error('Error deleting document:', err)
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
    restoreDocumentVersion,
    refreshDocuments: loadDocuments,
  }
}
