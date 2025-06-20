'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'
import { AISidebar } from './ai-sidebar'
import { NavigationBar } from './navigation-bar'
import { WritingGoalsModal } from './writing-goals-modal'
import { useDocuments } from '@/hooks/use-documents'
import { useToast } from '@/hooks/use-toast'
import { defaultWritingGoals } from '@/utils/writing-goals-data'
import type { WritingGoals } from '@/types/writing-goals'
import { VersionHistorySidebar } from './version-history-sidebar'
import type { AutoSaveStatus, Document as DocumentType } from '@/types/document'
import { VersionDiffViewer } from './version-diff-viewer'
import { useDocumentVersions } from '@/hooks/use-document-versions'
import { useAutoSave } from '@/hooks/use-auto-save'
import { CollaborationService } from '@/services/collaboration-service'
import { useComments } from '@/hooks/use-comments'
import { CommentsSidebar } from './comments-sidebar'
import type { UserProfile } from '@/types/user'

const DocumentEditor = dynamic(() => import('./document-editor').then(mod => mod.DocumentEditor), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
})

export function DocumentContainer({ documentId: initialDocumentId }: { documentId?: string }) {
  console.log('[DocumentContainer] Rendering document container')
  const { user } = useAuth()
  const {
    documents,
    loading,
    createDocument,
    updateDocument,
    restoreDocumentVersion,
    deleteDocument,
  } = useDocuments()
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(initialDocumentId || null)
  const { versions, loading: versionsLoading, error: versionsError, reloadVersions, deleteVersion } = useDocumentVersions(activeDocumentId || null)
  const { comments, addComment, deleteComment, resolveComment, reactivateComment } = useComments(activeDocumentId)
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
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [diffContent, setDiffContent] = useState<{
    oldContent: string
    newContent: string
  } | null>(null)
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>({
    status: 'saved'
  })
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null)

  const activeDocument = useMemo(
    () => documents.find((doc) => doc.id === activeDocumentId),
    [documents, activeDocumentId]
  );

  const { canEdit } = useMemo(() => {
    if (!activeDocument) {
      return { canEdit: false }
    }

    // Handle public access for logged-out users first
    if (!user) {
      if (activeDocument.isPublic && activeDocument.publicViewMode !== 'disabled') {
        return { canEdit: false };
      }
      return { canEdit: false };
    }

    // Handle access for logged-in users
    if (activeDocument.ownerId === user.uid) {
      return { canEdit: true }
    }

    const sharedInfo = activeDocument.sharedWith.find(
      (s) => s.userId === user.uid
    )
    if (sharedInfo) {
      return { canEdit: sharedInfo.role === 'editor' }
    }

    if (activeDocument.isPublic && activeDocument.publicViewMode !== 'disabled') {
      return { canEdit: false };
    }

    return { canEdit: false }
  }, [activeDocument, user]);

  const { myDocuments, sharedWithMe, publicDocuments } = useMemo(() => {
    if (!user?.uid) {
      return { myDocuments: [], sharedWithMe: [], publicDocuments: [] };
    }

    const my: DocumentType[] = [];
    const shared: DocumentType[] = [];
    const publicDocs: DocumentType[] = [];

    documents.forEach((doc: DocumentType) => {
      if (doc.ownerId === user.uid) {
        my.push(doc);
      } else if (doc.sharedWithIds?.includes(user.uid)) {
        shared.push(doc);
      } else if (doc.isPublic) {
        publicDocs.push(doc);
      }
    });

    return { myDocuments: my, sharedWithMe: shared, publicDocuments: publicDocs };
  }, [documents, user?.uid]);

  // Set active document when documents load or initialDocumentId changes
  useEffect(() => {
    if (initialDocumentId) {
      setActiveDocumentId(initialDocumentId);
    } else if (documents.length > 0 && !activeDocumentId) {
      setActiveDocumentId(documents[0].id)
    }
  }, [documents, activeDocumentId, initialDocumentId])

  // Join collaboration session when active document changes
  useEffect(() => {
    if (!activeDocumentId || !user?.uid) {
      console.log('[DocumentContainer] No active document or user, skipping collaboration join')
      return
    }

    console.log('[DocumentContainer] Joining collaboration session for document:', activeDocumentId)

    const joinSession = async () => {
      try {
        // Generate user color and prepare user data for collaboration
        const collaborationUser = {
          id: user.uid,
          name: user.displayName || user.email || 'Unknown User',
          email: user.email || '',
          color: '#3B82F6', // Will be generated consistently in the service
        }

        console.log('[DocumentContainer] Joining with user data:', collaborationUser)
        await CollaborationService.joinDocumentSession(activeDocumentId, collaborationUser)
        
        console.log('[DocumentContainer] Successfully joined collaboration session')
      } catch (error) {
        console.error('[DocumentContainer] Failed to join collaboration session:', error)
        // Don't show error to user unless it's a critical permission issue
        if (error instanceof Error && error.message.includes('Access denied')) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to collaborate on this document.',
            variant: 'destructive',
          })
        }
      }
    }

    joinSession()

    // Cleanup function to leave session when document changes or component unmounts
    return () => {
      // This is now handled by the logout function in AuthContext to avoid race conditions
      // if (user?.uid) {
      //   console.log('[DocumentContainer] Leaving collaboration session for document:', activeDocumentId)
      //   CollaborationService.leaveDocumentSession(activeDocumentId, user.uid).catch((error) => {
      //     console.error('[DocumentContainer] Error leaving collaboration session:', error)
      //   })
      // }
    }
  }, [activeDocumentId, user, toast])

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
        console.error('[handleRestoreVersion] Error during version restore:', error)
        console.error('[handleRestoreVersion] - Document ID:', activeDocumentId)
        console.error('[handleRestoreVersion] - Version ID:', versionId)
        console.error('[handleRestoreVersion] - Error details:', error instanceof Error ? error.message : String(error))

        // Clear restoring state and update UI to show error
        setRestoringVersionId(null)
        setSaveStatus({ status: 'error' })
        console.log('[handleRestoreVersion] Cleared restoring state due to error')

        // Show error toast
        toast({
          title: 'Restore Failed',
          description: 'Failed to restore the document version. Please try again.',
          variant: 'destructive',
        })
        console.log('[handleRestoreVersion] Error toast displayed')

        // Keep version history open so user can try again
        console.log('[handleRestoreVersion] Keeping version history sidebar open for retry')
      }
    },
    [activeDocumentId, restoreDocumentVersion, reloadVersions, documents, toast],
  )

  const handleViewVersion = useCallback(
    (versionContent: string) => {
      if (activeDocument) {
        setDiffContent({
          oldContent: versionContent,
          newContent: activeDocument.content,
        })
      }
    },
    [activeDocument]
  )

  const handleNewDocument = useCallback(async () => {
    if (!user?.uid) return

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
      try {
        await deleteDocument(documentId)
        toast({
          title: 'Document deleted',
          description: 'The document has been successfully deleted.',
        })
      } catch (error) {
        console.error('[DocumentContainer] Failed to delete document:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete the document. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [deleteDocument, toast],
  )

  const handleSaveWritingGoals = useCallback(async (newGoals: WritingGoals, title?: string) => {
    console.log('[DocumentContainer] Saving writing goals:', { 
      newGoals, 
      title, 
      isCreatingNewDocument 
    })

    // Always save the goals
    setWritingGoals(newGoals)

    // If we're creating a new document, create it with the provided title
    if (isCreatingNewDocument && title && user?.uid) {
      console.log('[DocumentContainer] Creating new document with title:', title)
      try {
        const newDocId = await createDocument(title.trim() || 'Untitled Document')
        if (newDocId) {
          setActiveDocumentId(newDocId)
          console.log('[DocumentContainer] New document created successfully with ID:', newDocId, 'and title:', title)
        }
      } catch (error) {
        console.error('[DocumentContainer] Failed to create new document:', error)
        toast({
          title: 'Error Creating Document',
          description: 'Failed to create the new document. Please try again.',
          variant: 'destructive',
        })
      } finally {
        // Reset new document creation state
        setIsCreatingNewDocument(false)
        setNewDocumentTitle('Untitled Document')
      }
    } else {
      console.log('[DocumentContainer] Just updating goals for existing workflow')
    }
  }, [isCreatingNewDocument, createDocument, user?.uid, toast])

  const handleContentChange = useAutoSave(
    (content: string) => {
      if (!activeDocumentId || !updateDocument) return;
      setSaveStatus({ status: 'saving' });
      updateDocument(activeDocumentId, {
        content,
        wordCount: content.trim().split(/\s+/).filter(Boolean).length,
        characterCount: content.length,
      })
      .then(() => setSaveStatus({ status: 'saved' }))
      .catch(() => setSaveStatus({ status: 'error' }));
    },
    2000
  );

  const handleDeleteVersion = useCallback(
    async (versionId: string) => {
      if (!activeDocumentId) return
      try {
        await deleteVersion(versionId)
        toast({
          title: 'Version deleted',
          description: 'The version has been successfully deleted.',
        })
      } catch (error) {
        console.error('[DocumentContainer] Failed to delete version:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete the version. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [activeDocumentId, deleteVersion, toast],
  )

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

  if (initialDocumentId && !loading && !activeDocument) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-center">
        <h2 className="text-2xl font-semibold mb-2">Document not found</h2>
        <p className="text-muted-foreground">
          You may not have access to this document, or it may have been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className={`h-screen w-full flex flex-col ${isDistractionFree ? 'is-distraction-free' : ''}`}>
      {!isDistractionFree && user && (
        <NavigationBar
          user={{
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            avatar: user.photoURL || '',
            plan: 'pro', // This should be dynamic
          }}
          myDocuments={myDocuments}
          sharedDocuments={sharedWithMe}
          publicDocuments={publicDocuments}
          activeDocumentId={activeDocumentId || undefined}
          onDocumentSelect={handleDocumentSelect}
          onNewDocument={handleNewDocument}
          writingGoals={writingGoals}
          onWritingGoalsClick={() => setIsGoalsModalOpen(true)}
          isDistractionFree={isDistractionFree}
          onDistractionFreeToggle={() => setIsDistractionFree(!isDistractionFree)}
          isAISidebarOpen={isAISidebarOpen}
          onAISidebarToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
          onVersionHistoryClick={handleToggleVersionHistory}
          isCommentsSidebarOpen={isCommentsSidebarOpen}
          onCommentsToggle={() => setIsCommentsSidebarOpen(!isCommentsSidebarOpen)}
          onDeleteDocument={handleDeleteDocument}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeDocument ? (
            <DocumentEditor
              key={activeDocument.id}
              documentId={activeDocument.id}
              initialDocument={activeDocument}
              onContentChange={handleContentChange}
              saveStatus={saveStatus}
              isEditable={canEdit}
              comments={comments}
              addComment={addComment}
              setActiveCommentId={setActiveCommentId}
            />
          ) : documents.length > 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
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
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-muted-foreground">Create a new document to begin</p>
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

        {isCommentsSidebarOpen && !isDistractionFree && user && (
          (() => {
            const debugUser: UserProfile = {
              id: user.uid,
              name: user.displayName || 'User',
              email: user.email || '',
              orgId: '',
              role: '',
              preferences: {
                defaultWritingGoals: {
                  audience: 'consumers',
                  formality: 'casual',
                  domain: 'marketing-copy',
                  intent: 'persuade',
                },
                autoSaveInterval: 0,
                showAdvancedSuggestions: false,
                preferredTone: '',
              },
              acceptedSuggestions: [],
              rejectedSuggestions: [],
              createdAt: 0,
              updatedAt: 0,
            }
            console.log('[DocumentContainer] Passing currentUser to CommentsSidebar:', debugUser)
            return (
              <CommentsSidebar
                isOpen={isCommentsSidebarOpen}
                onClose={() => setIsCommentsSidebarOpen(false)}
                comments={comments}
                currentUser={debugUser}
                onAddComment={addComment}
                onResolveComment={resolveComment}
                onDeleteComment={deleteComment}
                onReactivateComment={reactivateComment}
                activeCommentId={activeCommentId}
                setActiveCommentId={setActiveCommentId}
                isDocumentOwner={activeDocument?.ownerId === user.uid}
              />
            )
          })()
        )}
      </div>

      {isVersionHistoryOpen && activeDocumentId && (
        <VersionHistorySidebar
          isOpen={isVersionHistoryOpen}
          onClose={handleToggleVersionHistory}
          versions={versions}
          onRestore={handleRestoreVersion}
          onView={handleViewVersion}
          onDelete={handleDeleteVersion}
          loading={versionsLoading}
          error={versionsError}
          restoringVersionId={restoringVersionId}
        />
      )}

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
