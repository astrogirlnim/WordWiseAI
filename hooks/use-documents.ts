'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Timestamp } from 'firebase/firestore'
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

        // Optimistically create a local representation of the document
        const now = Timestamp.now()
        const newDoc: Document = {
          id: documentId,
          title,
          content: '',
          ownerId: user.uid,
          orgId: '',
          status: 'draft',
          analysisSummary: {
            overallScore: 0,
            brandAlignmentScore: 0,
            lastAnalyzedAt: now, // This will be replaced on next load
            suggestionCount: 0,
          },
          lastSaved: now,
          wordCount: 0,
          characterCount: 0,
          createdAt: now,
          updatedAt: now,
        }

        // Add to local state
        setDocuments((prev) => [newDoc, ...prev])

        // Initialize content tracking for new document
        lastSavedContentRef.current[documentId] = ''

        // No longer reloading all documents here to prevent race conditions
        // await loadDocuments()

        return documentId
      } catch (err) {
        setError('Failed to create document')
        console.error('Error creating document:', err)
        return null
      }
    },
    [user?.uid],
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
        console.log('[updateDocument] Starting document update for', documentId, 'with updates:', Object.keys(updates))
        
        // Handle version creation for content updates BEFORE updating the document
        if (updates.content && user) {
          console.log('[updateDocument] Content update detected, processing version creation...')
          
          const newContent = updates.content.trim()
          let currentContent = lastSavedContentRef.current[documentId] || ''
          
          // Fallback: if we don't have tracked content, get it from current document state
          if (!currentContent) {
            const currentDocument = documents.find(doc => doc.id === documentId)
            if (currentDocument && currentDocument.content) {
              currentContent = currentDocument.content
              console.log('[updateDocument] Using current document content as fallback, length:', currentContent.length)
            }
          }
          
          const currentContentTrimmed = currentContent.trim()
          
          console.log('[updateDocument] Content comparison - Current length:', currentContentTrimmed.length, 'New length:', newContent.length)
          console.log('[updateDocument] Current content preview:', JSON.stringify(currentContentTrimmed.substring(0, 50)))
          console.log('[updateDocument] New content preview:', JSON.stringify(newContent.substring(0, 50)))
          
          // Only create version if content actually changed and we have meaningful previous content
          const hasContentChanged = newContent !== currentContentTrimmed
          const hasPreviousContent = currentContentTrimmed.length > 0
          const hasNewContent = newContent.length > 0
          
          console.log('[updateDocument] Version creation criteria - Changed:', hasContentChanged, 'Has previous:', hasPreviousContent, 'Has new:', hasNewContent)
          
          if (hasContentChanged && hasPreviousContent && hasNewContent) {
            console.log('[updateDocument] Creating version with PREVIOUS content before document update')
            
            try {
              // Create version with the CURRENT (previous) content before updating
              const versionId = await VersionService.createVersion(documentId, currentContentTrimmed, {
                id: user.uid,
                name: user.displayName || 'Unknown User',
              })
              console.log('[updateDocument] Version created successfully with ID:', versionId)
              console.log('[updateDocument] Version contains previous content of length:', currentContentTrimmed.length)
            } catch (versionError) {
              console.error('[updateDocument] Failed to create version with previous content:', versionError)
              // Don't block the document update if version creation fails
            }
          } else if (!hasContentChanged) {
            console.log('[updateDocument] Content unchanged, skipping version creation')
          } else if (!hasPreviousContent) {
            console.log('[updateDocument] No previous content to version (likely new document), skipping version creation')
          } else if (!hasNewContent) {
            console.log('[updateDocument] New content is empty, skipping version creation')
          }
        }

        // Now update the document in Firestore
        console.log('[updateDocument] Updating document in Firestore...')
        await DocumentService.updateDocument(documentId, updates)
        console.log('[updateDocument] Document updated successfully in Firestore')

        // Update content tracking after successful document update
        if (updates.content) {
          console.log('[updateDocument] Updating lastSavedContentRef tracking')
          lastSavedContentRef.current[documentId] = updates.content
          console.log('[updateDocument] Updated tracking for document', documentId, 'with content length:', updates.content.length)
        }

        // Update local state
        console.log('[updateDocument] Updating local document state...')
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === documentId ? { ...doc, ...updates } : doc,
          ),
        )
        console.log('[updateDocument] Local state updated successfully')

      } catch (err) {
        setError('Failed to update document')
        console.error('[updateDocument] Error updating document:', err)
      } finally {
        pendingSavesRef.current.delete(documentId)
        console.log('[updateDocument] Completed update process for document', documentId)
      }
    },
    [user, documents],
  )

  const restoreDocumentVersion = useCallback(
    async (documentId: string, versionId: string) => {
      if (!user) {
        console.error('[restoreDocumentVersion] No authenticated user found')
        return
      }

      // Prevent concurrent operations on the same document
      if (pendingSavesRef.current.has(documentId)) {
        console.log('[restoreDocumentVersion] Document operation already in progress for', documentId, 'skipping restore...')
        return
      }

      try {
        console.log('[restoreDocumentVersion] Starting version restore process')
        console.log('[restoreDocumentVersion] Document ID:', documentId)
        console.log('[restoreDocumentVersion] Version ID:', versionId)
        console.log('[restoreDocumentVersion] User:', user.uid, user.displayName)

        // Get the current document state for comparison and metadata preservation
        const currentDocument = documents.find((d) => d.id === documentId)
        if (!currentDocument) {
          throw new Error(`Current document not found in local state: ${documentId}`)
        }

        console.log('[restoreDocumentVersion] Current document state:')
        console.log('[restoreDocumentVersion] - Title:', currentDocument.title)
        console.log('[restoreDocumentVersion] - Content length:', currentDocument.content.length)
        console.log('[restoreDocumentVersion] - Last saved:', currentDocument.lastSaved)
        console.log('[restoreDocumentVersion] - Current content preview:', JSON.stringify(currentDocument.content.substring(0, 100)))

        // Fetch the version to restore
        console.log('[restoreDocumentVersion] Fetching version to restore from Firestore...')
        const versionToRestore = await VersionService.getVersion(documentId, versionId)
        
        if (!versionToRestore) {
          throw new Error(`Version to restore not found: ${versionId}`)
        }

        console.log('[restoreDocumentVersion] Version to restore retrieved:')
        console.log('[restoreDocumentVersion] - Version ID:', versionToRestore.id)
        console.log('[restoreDocumentVersion] - Author:', versionToRestore.authorName)
        console.log('[restoreDocumentVersion] - Created at:', versionToRestore.createdAt)
        console.log('[restoreDocumentVersion] - Content length:', versionToRestore.content.length)
        console.log('[restoreDocumentVersion] - Version content preview:', JSON.stringify(versionToRestore.content.substring(0, 100)))

        // Check if the content is actually different from current
        const currentContentTrimmed = currentDocument.content.trim()
        const versionContentTrimmed = versionToRestore.content.trim()
        const hasContentDifference = currentContentTrimmed !== versionContentTrimmed

        console.log('[restoreDocumentVersion] Content comparison:')
        console.log('[restoreDocumentVersion] - Current content length:', currentContentTrimmed.length)
        console.log('[restoreDocumentVersion] - Version content length:', versionContentTrimmed.length)
        console.log('[restoreDocumentVersion] - Content differs:', hasContentDifference)

        if (!hasContentDifference) {
          console.log('[restoreDocumentVersion] Version content is identical to current content, no restore needed')
          return
        }

        // CRITICAL: Update lastSavedContentRef BEFORE calling updateDocument to prevent unwanted version creation
        // This ensures that when updateDocument runs, it sees the restored content as the "last saved" content
        console.log('[restoreDocumentVersion] Updating lastSavedContentRef to prevent version creation during restore...')
        const previousTrackedContent = lastSavedContentRef.current[documentId]
        lastSavedContentRef.current[documentId] = versionToRestore.content
        console.log('[restoreDocumentVersion] - Previous tracked content length:', (previousTrackedContent || '').length)
        console.log('[restoreDocumentVersion] - New tracked content length:', versionToRestore.content.length)

        // Restore the document content while preserving metadata
        console.log('[restoreDocumentVersion] Calling updateDocument with restored content...')
        await updateDocument(documentId, {
          content: versionToRestore.content,
          // Preserve current document metadata
          title: currentDocument.title,
          status: currentDocument.status,
          // Update timestamps to reflect the restore operation
          updatedAt: Timestamp.now(),
          lastSaved: Timestamp.now(),
        })

        console.log('[restoreDocumentVersion] Document successfully restored from version', versionId)
        console.log('[restoreDocumentVersion] Restored content length:', versionToRestore.content.length)

      } catch (err) {
        console.error('[restoreDocumentVersion] Error during version restore:', err)
        console.error('[restoreDocumentVersion] - Document ID:', documentId)
        console.error('[restoreDocumentVersion] - Version ID:', versionId)
        console.error('[restoreDocumentVersion] - Error details:', err instanceof Error ? err.message : String(err))
        
        // Restore the previous lastSavedContentRef state if the restore failed
        const currentDocument = documents.find((d) => d.id === documentId)
        if (currentDocument) {
          lastSavedContentRef.current[documentId] = currentDocument.content
          console.log('[restoreDocumentVersion] Restored lastSavedContentRef to current document content after error')
        }
        
        setError('Failed to restore document version')
        throw err // Re-throw for the calling component to handle
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
