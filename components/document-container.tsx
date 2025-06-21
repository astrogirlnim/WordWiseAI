'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'
// import { DocumentEditor } from './document-editor' - Will be dynamically imported
import { AISidebar } from './ai-sidebar'
import { NavigationBar } from './navigation-bar'
import { WritingGoalsModal } from './writing-goals-modal'
import { useDocuments } from '@/hooks/use-documents'
import { useToast } from '@/hooks/use-toast'
import { defaultWritingGoals } from '@/utils/writing-goals-data'
import type { WritingGoals } from '@/types/writing-goals'
import { VersionHistorySidebar } from './version-history-sidebar'
import type { AutoSaveStatus } from '@/types/document'
import { DistractionFreeToggle } from './distraction-free-toggle'
import { VersionDiffViewer } from './version-diff-viewer'
import { useDocumentVersions } from '@/hooks/use-document-versions'
import { AuditService, AuditEvent } from '@/services/audit-service'


const DocumentEditor = dynamic(() => import('./document-editor').then(mod => mod.DocumentEditor), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
})

export function DocumentContainer() {
  const { user } = useAuth()
  const {
    // Document lists
    documents,
    ownedDocuments,
    sharedDocuments,
    
    // State
    loading,
    
    // Actions
    createDocument,
    updateDocument,
    deleteDocument,
    restoreDocumentVersion,
    reloadDocuments,
    
    // Permission helpers
    canEdit,
    canComment,
    getUserPermission,
  } = useDocuments()
  
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const { versions, loading: versionsLoading, error: versionsError, reloadVersions, deleteVersion } = useDocumentVersions(activeDocumentId || null)
  const { toast } = useToast()

  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true)
  const [writingGoals, setWritingGoals] =
    useState<WritingGoals>(defaultWritingGoals)
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const [showGoalsOnNewDocument, setShowGoalsOnNewDocument] = useState(true)
  const [isCreatingNewDocument, setIsCreatingNewDocument] = useState(false)
  const [newDocumentTitle, setNewDocumentTitle] = useState('Untitled Document')
  const [isDistractionFree, setIsDistractionFree] = useState(false)
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)
  const [diffContent, setDiffContent] = useState<{
    oldContent: string
    newContent: string
  } | null>(null)
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>({
    status: 'saved'
  })
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null)

  console.log('[DocumentContainer] Rendered with:', {
    totalDocs: documents.length,
    ownedDocs: ownedDocuments.length,
    sharedDocs: sharedDocuments.length,
    activeDocumentId,
    user: user?.uid
  })

  // Set active document when documents load
  useEffect(() => {
    if (documents.length > 0 && !activeDocumentId) {
      setActiveDocumentId(documents[0].id)
      console.log('[DocumentContainer] Auto-selected first document:', documents[0].id)
    }
  }, [documents, activeDocumentId])

  // Check for document ID in URL query params (for shared links)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const documentIdParam = urlParams.get('documentId')
    const refreshParam = urlParams.get('refresh')
    
    if (documentIdParam && documents.length > 0) {
      const targetDocument = documents.find(doc => doc.id === documentIdParam)
      if (targetDocument) {
        console.log('[DocumentContainer] Loading document from URL:', documentIdParam)
        setActiveDocumentId(documentIdParam)
        // Clear the URL parameters
        window.history.replaceState({}, '', window.location.pathname)
      } else if (refreshParam) {
        // If document not found but refresh param present, force reload documents
        console.log('[DocumentContainer] Document not found, forcing reload for shared document:', documentIdParam)
        reloadDocuments().then(() => {
          // After reload, try to find the document again
          const reloadedDocument = documents.find(doc => doc.id === documentIdParam)
          if (reloadedDocument) {
            console.log('[DocumentContainer] Found document after reload:', documentIdParam)
            setActiveDocumentId(documentIdParam)
          } else {
            console.warn('[DocumentContainer] Document still not found after reload:', documentIdParam)
          }
          // Clear URL parameters
          window.history.replaceState({}, '', window.location.pathname)
        })
      }
    }
  }, [documents, reloadDocuments])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDistractionFree) {
        setIsDistractionFree(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDistractionFree])

  const handleDocumentSelect = useCallback(
    (documentId: string) => {
      console.log('[DocumentContainer] Document selected:', documentId)
      setActiveDocumentId(documentId)
    },
    [],
  )

  const handleToggleVersionHistory = useCallback(() => {
    setIsVersionHistoryOpen((prev) => !prev)
  }, [])

  const handleRestoreVersion = useCallback(
    async (versionId: string) => {
      if (!activeDocumentId || !restoreDocumentVersion) {
        console.error('[handleRestoreVersion] Missing required dependencies:', {
          activeDocumentId: !!activeDocumentId,
          restoreDocumentVersion: !!restoreDocumentVersion
        })
        return
      }

      console.log('[handleRestoreVersion] Starting version restore process')
      console.log('[handleRestoreVersion] Document ID:', activeDocumentId)
      console.log('[handleRestoreVersion] Version ID:', versionId)

      try {
        // Set restoring state
        setRestoringVersionId(versionId)
        setSaveStatus({ status: 'saving' })
        console.log('[handleRestoreVersion] Set restoring state for version:', versionId)

        // Get current document for context in success message
        const currentDocument = documents.find(d => d.id === activeDocumentId)
        const documentTitle = currentDocument?.title || 'Document'

        console.log('[handleRestoreVersion] Current document title:', documentTitle)
        console.log('[handleRestoreVersion] Calling restoreDocumentVersion...')

        // Perform the restore operation
        await restoreDocumentVersion(activeDocumentId, versionId)
        
        console.log('[handleRestoreVersion] Version restore completed successfully')

        // Reload version history to reflect any changes
        console.log('[handleRestoreVersion] Reloading version history...')
        await reloadVersions()
        console.log('[handleRestoreVersion] Version history reloaded')

        // Update UI state
        setSaveStatus({ status: 'saved' })
        setRestoringVersionId(null)
        console.log('[handleRestoreVersion] Cleared restoring state')

        // Close version history sidebar
        setIsVersionHistoryOpen(false)
        console.log('[handleRestoreVersion] Closed version history sidebar')

        // Show success toast
        toast({
          title: 'Version Restored',
          description: `Successfully restored "${documentTitle}" to a previous version.`,
        })
        console.log('[handleRestoreVersion] Success toast displayed')

      } catch (error) {
        console.error('[handleRestoreVersion] Error during restore:', error)
        
        // Clear restoring state
        setRestoringVersionId(null)
        setSaveStatus({ status: 'saved' })
        
        toast({
          title: 'Error Restoring Version',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        })
      }
    },
    [activeDocumentId, documents, restoreDocumentVersion, reloadVersions, toast],
  )

  const handleViewVersion = useCallback(
    (versionId: string) => {
      console.log('[DocumentContainer] View version requested:', versionId)
      
      if (!activeDocumentId) {
        console.error('[handleViewVersion] No active document')
        return
      }

      const currentDocument = documents.find(d => d.id === activeDocumentId)
             const versionToView = versions.find((v: any) => v.id === versionId)
      
      if (!currentDocument || !versionToView) {
        console.error('[handleViewVersion] Document or version not found')
        return
      }

      setDiffContent({
        oldContent: versionToView.content,
        newContent: currentDocument.content,
      })
    },
    [activeDocumentId, documents, versions],
  )

  const handleNewDocument = useCallback(async () => {
    if (!user?.uid) {
      console.log('[DocumentContainer] No user available for new document creation')
      return
    }

    console.log('[DocumentContainer] Starting new document creation flow')
    
    if (showGoalsOnNewDocument) {
      // Set up new document creation state and open modal to collect title + goals
      console.log('[DocumentContainer] Opening goals modal for new document title and goals')
      setIsCreatingNewDocument(true)
      setNewDocumentTitle('Untitled Document')
      setIsGoalsModalOpen(true)
    } else {
      // Create document directly without modal (user has disabled goals on new document)
      console.log('[DocumentContainer] Creating document directly without goals modal')
      const newDocId = await createDocument('Untitled Document')
      if (newDocId) {
        setActiveDocumentId(newDocId)
        console.log('[DocumentContainer] New document created with ID:', newDocId)
      }
    }
  }, [user?.uid, createDocument, showGoalsOnNewDocument])

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      if (!deleteDocument) {
        console.log('[DocumentContainer] Delete function not available')
        return
      }

      const docToDelete = documents.find((d) => d.id === documentId)
      if (!docToDelete) {
        console.log('[DocumentContainer] Document to delete not found:', documentId)
        return
      }

      // Check if user can delete (only owners can delete)
      if (docToDelete.ownerId !== user?.uid) {
        toast({
          title: 'Cannot Delete Document',
          description: 'Only the document owner can delete it.',
          variant: 'destructive',
        })
        return
      }

      try {
        console.log('[DocumentContainer] Deleting document:', documentId)
        await deleteDocument(documentId)

        if (activeDocumentId === documentId) {
          const remainingDocs = documents.filter((d) => d.id !== documentId)
          setActiveDocumentId(remainingDocs.length > 0 ? remainingDocs[0].id : null)
          console.log('[DocumentContainer] Active document was deleted, switched to:', remainingDocs[0]?.id || 'none')
        }

        toast({
          title: 'Document Deleted',
          description: `"${docToDelete.title}" has been permanently deleted.`,
        })
      } catch (error) {
        console.error('Failed to delete document:', error)
        toast({
          title: 'Error Deleting Document',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [deleteDocument, documents, activeDocumentId, toast, user?.uid],
  )

  const handleSaveWritingGoals = useCallback(
    async (goals: WritingGoals, title?: string) => {
      console.log('[DocumentContainer] Saving writing goals:', goals, 'title:', title)
      setWritingGoals(goals)
      
      if (isCreatingNewDocument && title) {
        // Create new document with the provided title
        console.log('[DocumentContainer] Creating new document with title:', title)
        const newDocId = await createDocument(title)
        if (newDocId) {
          setActiveDocumentId(newDocId)
          console.log('[DocumentContainer] New document created with ID:', newDocId)
          
          // Reset new document creation state
          setIsCreatingNewDocument(false)
          setNewDocumentTitle('Untitled Document')
        }
      }
      
      setIsGoalsModalOpen(false)
    },
    [isCreatingNewDocument, createDocument]
  )

  const handleSave = useCallback(
    async (content: string, title: string) => {
      if (!activeDocumentId || !updateDocument) {
        console.log('[DocumentContainer] Cannot save - missing activeDocumentId or updateDocument')
        return
      }

      console.log('[DocumentContainer] Saving document:', activeDocumentId)
      setSaveStatus({ status: 'saving' })

      try {
        const success = await updateDocument(activeDocumentId, { content, title })
        
        if (success) {
          setSaveStatus({ status: 'saved' })
          console.log('[DocumentContainer] Document saved successfully')
        } else {
          setSaveStatus({ status: 'error' })
          console.error('[DocumentContainer] Document save failed')
        }
      } catch (error) {
        console.error('[DocumentContainer] Save error:', error)
        setSaveStatus({ status: 'error' })
      }
    },
    [activeDocumentId, updateDocument]
  )

  const handleUserAction = useCallback((action: string) => {
    console.log('[DocumentContainer] User action:', action)
  }, [])

  const handleAISidebarToggle = useCallback(() => {
    setIsAISidebarOpen((prev: boolean) => !prev)
  }, [])

  const handleWritingGoalsClick = useCallback(() => {
    setIsGoalsModalOpen(true)
  }, [])

  const handleDistractionFreeToggle = useCallback(() => {
    setIsDistractionFree((prev: boolean) => !prev)
  }, [])

  const handleDeleteVersion = useCallback(
    async (versionId: string) => {
      if (!activeDocumentId || !deleteVersion || !user?.uid) return

      try {
        await deleteVersion(versionId)

        // Optional audit log
        await AuditService.logEvent(AuditEvent.VERSION_DELETE, user.uid, {
          documentId: activeDocumentId,
          versionId,
        })

        toast({
          title: 'Version Deleted',
          description: 'The selected version has been permanently removed.',
        })
      } catch (error) {
        console.error('Failed to delete version:', error)
        toast({
          title: 'Error Deleting Version',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [activeDocumentId, deleteVersion, toast, user?.uid],
  )

  // Get the active document and user's permission level
  const activeDocument = useMemo(() => {
    return documents.find(doc => doc.id === activeDocumentId) || null
  }, [documents, activeDocumentId])

  const userPermission = useMemo(() => {
    return activeDocument ? getUserPermission(activeDocument) : null
  }, [activeDocument, getUserPermission])

  const canUserEdit = useMemo(() => {
    return activeDocument ? canEdit(activeDocument) : false
  }, [activeDocument, canEdit])

  const canUserComment = useMemo(() => {
    return activeDocument ? canComment(activeDocument) : false
  }, [activeDocument, canComment])

  // Prepare initial document data for the editor
  const initialDocument = useMemo(() => {
    if (!activeDocument) return { content: '', title: 'Untitled Document' }
    
    return {
      content: activeDocument.content || '',
      title: activeDocument.title || 'Untitled Document',
    }
  }, [activeDocument])

  // Mock user data for NavigationBar (keeping existing interface)
  const mockUser = useMemo(() => ({
    id: user?.uid || '',
    name: user?.displayName || 'User',
    email: user?.email || '',
    avatar: user?.photoURL || '',
    plan: 'free' as const,
  }), [user])

  console.log('[DocumentContainer] Active document permissions:', {
    documentId: activeDocumentId,
    userPermission,
    canEdit: canUserEdit,
    canComment: canUserComment,
    isOwner: activeDocument?.ownerId === user?.uid
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full grid-rows-[auto_1fr]">
      {/* Navigation Bar */}
      {!isDistractionFree && (
        <NavigationBar
          user={mockUser}
          documents={documents}
          ownedDocuments={ownedDocuments}
          sharedDocuments={sharedDocuments}
          activeDocumentId={activeDocumentId || ''}
          isAISidebarOpen={isAISidebarOpen}
          aiSuggestionCount={0}
          writingGoals={writingGoals}
          isDistractionFree={isDistractionFree}
          onDocumentSelect={handleDocumentSelect}
          onNewDocument={handleNewDocument}
          onUserAction={handleUserAction}
          onAISidebarToggle={handleAISidebarToggle}
          onWritingGoalsClick={handleWritingGoalsClick}
          onDistractionFreeToggle={handleDistractionFreeToggle}
          onVersionHistoryClick={handleToggleVersionHistory}
          onDeleteDocument={handleDeleteDocument}
        />
      )}

      {/* Main Content Area */}
      <main className="relative flex">
        <div
          className={`flex-1 transition-all duration-300 ${isAISidebarOpen && !isDistractionFree ? 'mr-80' : 'mr-0'}`}
        >
          {isDistractionFree && (
            <div className="absolute right-4 top-4 z-50">
              <DistractionFreeToggle
                isDistractionFree={isDistractionFree}
                onToggle={handleDistractionFreeToggle}
              />
            </div>
          )}
          
          {activeDocument && initialDocument && user?.uid ? (
            <DocumentEditor
              key={activeDocumentId}
              documentId={activeDocument.id}
              initialDocument={initialDocument}
              onSave={handleSave}
              saveStatus={saveStatus}
              readOnly={!canUserEdit}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">
                  {documents.length > 0
                    ? 'Select a document to start editing'
                    : 'Create a new document to begin'}
                </p>
                <button
                  onClick={handleNewDocument}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
                >
                  New Document
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Sidebar */}
        {isAISidebarOpen && !isDistractionFree && (
          <AISidebar 
            isOpen={isAISidebarOpen} 
            documentId={activeDocumentId}
            writingGoals={writingGoals}
            currentContent={activeDocument?.content}
          />
        )}
      </main>

      <VersionHistorySidebar
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        onRestore={handleRestoreVersion}
        onView={handleViewVersion}
        onDelete={handleDeleteVersion}
        versions={versions}
        loading={versionsLoading}
        error={versionsError}
        restoringVersionId={restoringVersionId}
      />

      {diffContent && (
        <VersionDiffViewer
          isOpen={!!diffContent}
          onClose={() => setDiffContent(null)}
          oldContent={diffContent.oldContent}
          newContent={diffContent.newContent}
        />
      )}

      {/* Writing Goals Modal */}
      <WritingGoalsModal
        isOpen={isGoalsModalOpen}
        currentGoals={writingGoals}
        onClose={() => {
          console.log('[DocumentContainer] Goals modal closing, resetting new document state')
          setIsGoalsModalOpen(false)
          // Reset new document creation state if user cancels
          if (isCreatingNewDocument) {
            setIsCreatingNewDocument(false)
            setNewDocumentTitle('Untitled Document')
          }
        }}
        onSave={handleSaveWritingGoals}
        showOnNewDocument={showGoalsOnNewDocument}
        onShowOnNewDocumentChange={setShowGoalsOnNewDocument}
        isNewDocument={isCreatingNewDocument}
        initialTitle={newDocumentTitle}
      />
    </div>
  )
}
