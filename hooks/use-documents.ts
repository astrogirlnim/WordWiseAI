'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Timestamp, query, where } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import { DocumentService } from '@/services/document-service'
import { VersionService } from '@/services/version-service'
import { AuditService, AuditEvent } from '@/services/audit-service'
import type { Document } from '@/types/document'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDoc,
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import { userService } from '@/services/user-service'

export function useDocuments() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [ownedDocuments, setOwnedDocuments] = useState<Document[]>([])
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([])
  const [publicDocuments, setPublicDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Track last saved content for each document to prevent duplicate versions
  const lastSavedContentRef = useRef<Record<string, string>>({})
  // Track pending saves to prevent race conditions
  const pendingSavesRef = useRef<Set<string>>(new Set())

  // Subscribe to user's documents
  useEffect(() => {
    // Skip if Firebase is not initialized (during build)
    if (!firestore) {
      console.log('[useDocuments] Firestore not initialized, skipping document subscriptions')
      setLoading(false)
      return
    }

    if (!user?.uid) {
      console.log('[useDocuments] No user available, clearing documents')
      setOwnedDocuments([])
      setSharedDocuments([])
      setPublicDocuments([])
      setLoading(false)
      return
    }

    console.log('[useDocuments] Setting up document subscriptions for user:', user.uid)
    setLoading(true)

    const documentsRef = collection(firestore, 'documents')

    // Listener for owned documents
    const ownedQuery = query(documentsRef, where('ownerId', '==', user.uid))
    const unsubscribeOwned = onSnapshot(
      ownedQuery,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Document),
        )
        setOwnedDocuments(docs)
        setLoading(false)
      },
      (error) => {
        console.error('[useDocuments] Error fetching owned documents:', error)
        setError('Failed to fetch your documents.')
        setLoading(false)
      },
    )

    // Listener for shared documents
    const sharedQuery = query(
      documentsRef,
      where('sharedWithIds', 'array-contains', user.uid),
    )
    const unsubscribeShared = onSnapshot(
      sharedQuery,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Document),
        )
        setSharedDocuments(docs)
      },
      (error) => {
        console.error('[useDocuments] Error fetching shared documents:', error)
      },
    )

    // Listener for public documents
    const publicQuery = query(documentsRef, where('isPublic', '==', true))
    const unsubscribePublic = onSnapshot(
      publicQuery,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Document),
        )
        setPublicDocuments(docs)
      },
      (error) => {
        console.error('[useDocuments] Error fetching public documents:', error)
      },
    )

    return () => {
      unsubscribeOwned()
      unsubscribeShared()
      unsubscribePublic()
    }
  }, [user?.uid])

  useEffect(() => {
    const allDocs = new Map<string, Document>()

    ownedDocuments.forEach((doc) => allDocs.set(doc.id, doc))
    sharedDocuments.forEach((doc) => allDocs.set(doc.id, doc))
    publicDocuments.forEach((doc) => allDocs.set(doc.id, doc))

    const getMillis = (timestamp: any): number => {
      if (timestamp instanceof Timestamp) return timestamp.toMillis()
      if (typeof timestamp === 'number') return timestamp
      return 0
    }

    const sortedDocuments = Array.from(allDocs.values()).sort((a, b) => {
      const timeA = getMillis(a.updatedAt)
      const timeB = getMillis(b.updatedAt)
      return timeB - timeA
    })

    setDocuments(sortedDocuments)
    
    // Initialize lastSavedContent tracking
    sortedDocuments.forEach((doc) => {
        if (!lastSavedContentRef.current[doc.id]) {
            lastSavedContentRef.current[doc.id] = doc.content
        }
    })

  }, [ownedDocuments, sharedDocuments, publicDocuments])

  const createDocument = useCallback(
    async (title: string): Promise<string | null> => {
      if (!firestore) {
        console.error('[useDocuments.createDocument] Firestore not initialized')
        return null
      }

      if (!user?.uid) {
        console.error('[useDocuments.createDocument] No user available')
        return null
      }

      console.log('[useDocuments.createDocument] Creating document with title:', title)

      try {
        // Get user profile for author name
        const userProfile = await userService.getUserProfile(user.uid)
        const authorName = userProfile?.name || user.displayName || user.email || 'Unknown User'
        
        console.log('[useDocuments.createDocument] Author name resolved to:', authorName)

        const documentsRef = collection(firestore, 'documents')
        const docData = {
          title: title.trim() || 'Untitled Document',
          content: '',
          ownerId: user.uid,
          orgId: userProfile?.orgId || '',
          status: 'draft' as const,
          sharedWith: [],
          sharedWithIds: [],
          isPublic: false,
          publicViewMode: 'disabled' as const,
          lastEditedBy: user.uid,
          lastEditedAt: serverTimestamp(),
          workflowState: {
            currentStatus: 'draft' as const,
            submittedForReview: false,
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

        console.log('[useDocuments.createDocument] Creating document with data:', {
          ...docData,
          ownerId: user.uid,
          authorName
        })

        const docRef = await addDoc(documentsRef, docData)
        console.log('[useDocuments.createDocument] Document created with ID:', docRef.id)

        // Create initial version for the new document
        console.log('[useDocuments.createDocument] Creating initial version...')
        const versionId = await VersionService.createVersion(
          docRef.id,
          '', // empty content for new document
          user.uid,
          authorName,
          title.trim() || 'Untitled Document'
        )

        if (versionId) {
          console.log('[useDocuments.createDocument] Initial version created with ID:', versionId)
        } else {
          console.warn('[useDocuments.createDocument] Failed to create initial version')
        }

        return docRef.id
      } catch (error) {
        console.error('[useDocuments.createDocument] Error creating document:', error)
        return null
      }
    },
    [user],
  )

  const updateDocument = useCallback(
    async (
      documentId: string,
      updates: Partial<Document>,
    ): Promise<void> => {
      if (!firestore) {
        console.error('[useDocuments.updateDocument] Firestore not initialized')
        return
      }

      if (!user?.uid) {
        console.error('[useDocuments.updateDocument] No user available')
        return
      }

      console.log('[useDocuments.updateDocument] Updating document:', documentId)
      console.log('[useDocuments.updateDocument] Updates:', {
        ...updates,
        content: updates.content ? `${updates.content.length} chars` : 'no content'
      })

      try {
        // Get user profile for author name
        const userProfile = await userService.getUserProfile(user.uid)
        const authorName = userProfile?.name || user.displayName || user.email || 'Unknown User'
        
        console.log('[useDocuments.updateDocument] Author name resolved to:', authorName)

        const docRef = doc(firestore, 'documents', documentId)
        
        // Prepare update data with collaboration metadata
        const updateData = {
          ...updates,
          lastEditedBy: user.uid,
          lastEditedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSaved: serverTimestamp(),
        }

        console.log('[useDocuments.updateDocument] Updating document with collaboration metadata')
        await updateDoc(docRef, updateData)

        // Create a new version if content was updated
        if (updates.content !== undefined) {
          console.log('[useDocuments.updateDocument] Content updated, creating new version...')
          
          const versionId = await VersionService.createVersion(
            documentId,
            updates.content,
            user.uid,
            authorName,
            updates.title
          )

          if (versionId) {
            console.log('[useDocuments.updateDocument] New version created with ID:', versionId, 'by author:', authorName)
          } else {
            console.warn('[useDocuments.updateDocument] Failed to create version for content update')
          }
        } else {
          console.log('[useDocuments.updateDocument] No content changes, skipping version creation')
        }

        console.log('[useDocuments.updateDocument] Document update completed successfully')
      } catch (error) {
        console.error('[useDocuments.updateDocument] Error updating document:', error)
        console.error('[useDocuments.updateDocument] Document ID:', documentId)
        console.error('[useDocuments.updateDocument] Updates:', updates)
        throw error
      }
    },
    [user],
  )

  const deleteDocument = useCallback(
    async (documentId: string): Promise<void> => {
      if (!user?.uid) {
        console.error('[useDocuments.deleteDocument] No user available')
        return
      }

      console.log('[useDocuments.deleteDocument] Deleting document:', documentId)

      try {
        await DocumentService.deleteDocument(documentId)
        console.log('[useDocuments.deleteDocument] Document deleted')
      } catch (error) {
        console.error('[useDocuments.deleteDocument] Error deleting document:', error)
      }
    },
    [user?.uid],
  )

  const restoreDocumentVersion = useCallback(
    async (documentId: string, versionId: string): Promise<void> => {
      if (!firestore) {
        console.error('[useDocuments.restoreDocumentVersion] Firestore not initialized')
        return
      }

      if (!user?.uid) {
        console.error('[useDocuments.restoreDocumentVersion] No user available')
        return
      }

      console.log('[useDocuments.restoreDocumentVersion] Restoring document:', documentId, 'to version:', versionId)

      try {
        // Get user profile for author name
        const userProfile = await userService.getUserProfile(user.uid)
        const authorName = userProfile?.name || user.displayName || user.email || 'Unknown User'

        // Get the version to restore
        const versions = await VersionService.getVersions(documentId)
        const targetVersion = versions.find((v) => v.id === versionId)

        if (!targetVersion) {
          console.error('[useDocuments.restoreDocumentVersion] Version not found:', versionId)
          throw new Error('Version not found')
        }

        console.log('[useDocuments.restoreDocumentVersion] Found target version by:', targetVersion.authorName)
        console.log('[useDocuments.restoreDocumentVersion] Content length:', targetVersion.content.length)

        // Update the document with the version content
        const docRef = doc(firestore, 'documents', documentId)
        const restoreData = {
          content: targetVersion.content,
          title: targetVersion.title || 'Untitled Document',
          lastEditedBy: user.uid,
          lastEditedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSaved: serverTimestamp(),
          wordCount: targetVersion.content.trim().split(/\s+/).filter(Boolean).length,
          characterCount: targetVersion.content.length,
        }

        console.log('[useDocuments.restoreDocumentVersion] Restoring document content...')
        await updateDoc(docRef, restoreData)

        // Create a new version to track the restore action
        console.log('[useDocuments.restoreDocumentVersion] Creating restore version...')
        const newVersionId = await VersionService.createVersion(
          documentId,
          targetVersion.content,
          user.uid,
          `${authorName} (restored from ${targetVersion.authorName})`,
          targetVersion.title
        )

        if (newVersionId) {
          console.log('[useDocuments.restoreDocumentVersion] Restore version created with ID:', newVersionId)
        } else {
          console.warn('[useDocuments.restoreDocumentVersion] Failed to create restore version')
        }

        console.log('[useDocuments.restoreDocumentVersion] Document restore completed successfully')
      } catch (error) {
        console.error('[useDocuments.restoreDocumentVersion] Error restoring version:', error)
        throw error
      }
    },
    [user],
  )

  const saveDocument = useCallback(
    async (documentId: string, content: string, title: string): Promise<void> => {
      if (!user?.uid) {
        console.error('[useDocuments.saveDocument] No user available')
        return
      }

      console.log(
        `[useDocuments.saveDocument] Checking content and title changes for document: ${documentId}`
      )

      const existingDoc = documents.find((doc) => doc.id === documentId)
      if (!existingDoc) {
        console.error('[useDocuments.saveDocument] Document not found:', documentId)
        return
      }

      const contentHasChanged = existingDoc.content !== content
      const isTitleChange = existingDoc.title !== title

      if (!contentHasChanged && !isTitleChange) {
        console.log(
          '[useDocuments.saveDocument] No content or title change, skipping save for document:',
          documentId
        )
        return
      }

      console.log(
        `[useDocuments.saveDocument] Content for doc ${documentId} has changed, proceeding with save.`
      )
      pendingSavesRef.current.add(documentId)

      try {
        await updateDocument(documentId, {
          content,
          title,
          lastEditedBy: user.uid,
          lastEditedAt: serverTimestamp(),
        })

        // Update last saved content after successful save
        lastSavedContentRef.current[documentId] = content
        console.log(
          `[useDocuments.saveDocument] Successfully saved document ${documentId}`
        )
      } catch (error) {
        console.error(
          `[useDocuments.saveDocument] Error saving document ${documentId}:`,
          error
        )
      } finally {
        pendingSavesRef.current.delete(documentId)
      }
    }, [user, updateDocument, documents])

  return {
    documents,
    ownedDocuments,
    sharedDocuments,
    publicDocuments,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    restoreDocumentVersion,
    saveDocument,
  }
}
