'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Timestamp, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import { DocumentService } from '@/services/document-service'
import { VersionService } from '@/services/version-service'

import type { Document } from '@/types/document'

export function useDocuments() {
  const { user } = useAuth()
  
  // Separate owned and shared documents
  const [ownedDocuments, setOwnedDocuments] = useState<Document[]>([])
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track content for auto-save functionality
  const lastSavedContentRef = useRef<Record<string, string>>({})

  console.log('[useDocuments] Hook initialized for user:', user?.uid)

  const loadDocuments = useCallback(async () => {
    if (!user?.uid) {
      console.log('[useDocuments] No user available, skipping document load')
      return
    }

    console.log('[useDocuments] Loading all documents for user:', user.uid)
    setLoading(true)
    setError(null)

    try {
      const { owned, shared } = await DocumentService.getAllUserDocuments(user.uid)
      
      console.log('[useDocuments] Loaded documents:', {
        owned: owned.length,
        shared: shared.length
      })
      
      setOwnedDocuments(owned)
      setSharedDocuments(shared)
      
      // Initialize content tracking for all documents
      const allDocs = [...owned, ...shared]
      const contentTracker: Record<string, string> = {}
      allDocs.forEach(doc => {
        contentTracker[doc.id] = doc.content || ''
      })
      lastSavedContentRef.current = contentTracker
      
    } catch (err) {
      const errorMessage = 'Failed to load documents'
      console.error('[useDocuments] Error loading documents:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  // Load documents when user changes
  useEffect(() => {
    if (user?.uid) {
      loadDocuments()
    } else {
      // Clear documents when user logs out
      setOwnedDocuments([])
      setSharedDocuments([])
      setLoading(false)
      lastSavedContentRef.current = {}
    }
  }, [user?.uid, loadDocuments])

  const createDocument = useCallback(
    async (title: string) => {
      if (!user?.uid) {
        console.log('[useDocuments] No user available for document creation')
        return null
      }

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
            lastAnalyzedAt: now,
            suggestionCount: 0,
          },
          lastSaved: now,
          wordCount: 0,
          characterCount: 0,
          createdAt: now,
          updatedAt: now,
        }

        // Add to owned documents (since user created it)
                 setOwnedDocuments((prev: Document[]) => [newDoc, ...prev])

        // Initialize content tracking for new document
        lastSavedContentRef.current[documentId] = ''

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
    async (documentId: string, updates: Partial<Document>): Promise<boolean> => {
      if (!user?.uid) {
        console.log('[useDocuments] No user available for document update')
        return false
      }

      try {
        console.log('[useDocuments] Updating document:', documentId, 'with updates:', Object.keys(updates))
        
        await DocumentService.updateDocument(documentId, updates)

        // Update local state optimistically
                 const updateDocumentInState = (docs: Document[]) =>
           docs.map((doc: Document) =>
             doc.id === documentId ? { ...doc, ...updates, updatedAt: serverTimestamp() } : doc
           )

        // Check if it's an owned or shared document and update accordingly
                 setOwnedDocuments((prev: Document[]) => {
           const isOwned = prev.some((doc: Document) => doc.id === documentId)
           return isOwned ? updateDocumentInState(prev) : prev
         })

                 setSharedDocuments((prev: Document[]) => {
           const isShared = prev.some((doc: Document) => doc.id === documentId)
           return isShared ? updateDocumentInState(prev) : prev
         })

        // Update content tracking if content was updated
        if (updates.content !== undefined) {
          lastSavedContentRef.current[documentId] = updates.content
        }

        console.log('[useDocuments] Document updated successfully:', documentId)
        return true
      } catch (err) {
        setError('Failed to update document')
        console.error('Error updating document:', err)
        return false
      }
    },
    [user?.uid],
  )

  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!user?.uid) {
        console.log('[useDocuments] No user available for document deletion')
        return false
      }

      try {
        console.log('[useDocuments] Deleting document:', documentId)
        await DocumentService.deleteDocument(documentId)

        // Remove from local state
                 setOwnedDocuments((prev: Document[]) => prev.filter((doc: Document) => doc.id !== documentId))
         setSharedDocuments((prev: Document[]) => prev.filter((doc: Document) => doc.id !== documentId))

        // Clean up content tracking
        delete lastSavedContentRef.current[documentId]

        console.log('[useDocuments] Document deleted successfully:', documentId)
        return true
      } catch (err) {
        setError('Failed to delete document')
        console.error('Error deleting document:', err)
        return false
      }
    },
    [user?.uid],
  )

  const restoreDocumentVersion = useCallback(
    async (documentId: string, versionId: string) => {
      if (!user) {
        console.error('[restoreDocumentVersion] No authenticated user found')
        return
      }

      try {
        console.log('[restoreDocumentVersion] Starting version restore process')
        console.log('[restoreDocumentVersion] Document ID:', documentId)
        console.log('[restoreDocumentVersion] Version ID:', versionId)
        console.log('[restoreDocumentVersion] User:', user.uid, user.displayName)

        // Get current document for context
        const allDocs = [...ownedDocuments, ...sharedDocuments]
        const currentDocument = allDocs.find((d) => d.id === documentId)
        if (!currentDocument) {
          throw new Error(`Current document not found in local state: ${documentId}`)
        }

        console.log('[restoreDocumentVersion] Current document state:')
        console.log('[restoreDocumentVersion] - Title:', currentDocument.title)
        console.log('[restoreDocumentVersion] - Content length:', currentDocument.content.length)

        // Fetch the version to restore
        console.log('[restoreDocumentVersion] Fetching version to restore from Firestore...')
        const versionToRestore = await VersionService.getVersion(documentId, versionId)
        
        if (!versionToRestore) {
          throw new Error(`Version to restore not found: ${versionId}`)
        }

        console.log('[restoreDocumentVersion] Version to restore retrieved:')
        console.log('[restoreDocumentVersion] - Created at:', versionToRestore.createdAt)
        console.log('[restoreDocumentVersion] - Content length:', versionToRestore.content.length)

                 // Restore the version by updating the document
         const success = await updateDocument(documentId, {
           content: versionToRestore.content,
         })

        if (!success) {
          throw new Error('Failed to update document with restored content')
        }

        console.log('[restoreDocumentVersion] Version restore completed successfully')
      } catch (error) {
        console.error('[restoreDocumentVersion] Error:', error)
        throw error
      }
    },
    [user, ownedDocuments, sharedDocuments, updateDocument],
  )

  // Get all documents combined
  const allDocuments = [...ownedDocuments, ...sharedDocuments]

  // Check if content has been modified since last save
  const isContentModified = useCallback(
    (documentId: string, currentContent: string): boolean => {
      const lastSavedContent = lastSavedContentRef.current[documentId] || ''
      const isModified = currentContent !== lastSavedContent
      
      if (isModified) {
        console.log('[useDocuments] Content modified for document:', documentId, {
          currentLength: currentContent.length,
          lastSavedLength: lastSavedContent.length,
        })
      }
      
      return isModified
    },
    [],
  )

  // Get user's permission level for a document
  const getUserPermission = useCallback(
    (document: Document): 'owner' | 'editor' | 'commenter' | 'viewer' | null => {
      if (!user?.uid) return null
      
      if (document.ownerId === user.uid) {
        return 'owner'
      }
      
      const sharedAccess = document.sharedWith.find(access => access.userId === user.uid)
      return sharedAccess?.role || null
    },
    [user?.uid]
  )

  // Check if user can edit a document
  const canEdit = useCallback(
    (document: Document): boolean => {
      if (!user?.uid) return false
      return DocumentService.canUserEditDocument(document, user.uid)
    },
    [user?.uid]
  )

  // Check if user can comment on a document
  const canComment = useCallback(
    (document: Document): boolean => {
      if (!user?.uid) return false
      return DocumentService.canUserCommentOnDocument(document, user.uid)
    },
    [user?.uid]
  )

  // Reload documents (useful after sharing changes)
  const reloadDocuments = useCallback(() => {
    console.log('[useDocuments] Manually reloading documents')
    return loadDocuments()
  }, [loadDocuments])

  return {
    // Document lists
    documents: allDocuments, // Combined for backward compatibility
    ownedDocuments,
    sharedDocuments,
    
    // State
    loading,
    error,
    
    // Actions
    createDocument,
    updateDocument,
    deleteDocument,
    restoreDocumentVersion,
    reloadDocuments,
    
    // Content tracking
    isContentModified,
    
    // Permission helpers
    getUserPermission,
    canEdit,
    canComment,
  }
}
