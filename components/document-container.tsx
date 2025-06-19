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
import { useAutoSave } from '@/hooks/use-auto-save'
import { AuditService, AuditEvent } from '@/services/audit-service'

const DocumentEditor = dynamic(() => import('./document-editor').then(mod => mod.DocumentEditor), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
})

export function DocumentContainer() {
  const { user } = useAuth()
  const {
    documents,
    loading,
    createDocument,
    updateDocument,
    restoreDocumentVersion,
    deleteDocument,
  } = useDocuments()
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const { versions, loading: versionsLoading, error: versionsError, reloadVersions, deleteVersion } = useDocumentVersions(activeDocumentId || null)
  const { toast } = useToast()

  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true)
  const [writingGoals, setWritingGoals] =
    useState<WritingGoals>(defaultWritingGoals)
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const [showGoalsOnNewDocument, setShowGoalsOnNewDocument] = useState(true)
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

  // Set active document when documents load
  useEffect(() => {
    if (documents.length > 0 && !activeDocumentId) {
      setActiveDocumentId(documents[0].id)
    }
  }, [documents, activeDocumentId])

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
      const currentDoc = documents.find((d) => d.id === activeDocumentId)
      if (currentDoc) {
        setDiffContent({
          oldContent: versionContent,
          newContent: currentDoc.content,
        })
      }
    },
    [activeDocumentId, documents],
  )

  const handleNewDocument = useCallback(async () => {
    if (!user?.uid) return

    const newDocId = await createDocument('Untitled Document')
    if (newDocId) {
      setActiveDocumentId(newDocId)

      if (showGoalsOnNewDocument) {
        setIsGoalsModalOpen(true)
      }
    }
  }, [user?.uid, createDocument, showGoalsOnNewDocument])

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      if (!deleteDocument) return

      const docToDelete = documents.find((d) => d.id === documentId)
      if (!docToDelete) return

      try {
        await deleteDocument(documentId)

        if (activeDocumentId === documentId) {
          const remainingDocs = documents.filter((d) => d.id !== documentId)
          setActiveDocumentId(remainingDocs.length > 0 ? remainingDocs[0].id : null)
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
    [deleteDocument, documents, activeDocumentId, toast],
  )

  const handleUserAction = useCallback((action: string) => {
    switch (action) {
      case 'profile':
        console.log('Opening profile...')
        break
      case 'settings':
        console.log('Opening settings...')
        break
      case 'billing':
        console.log('Opening billing...')
        break
      case 'help':
        console.log('Opening help...')
        break
      case 'signout':
        console.log('Signing out...')
        break
      default:
        console.log('Unknown action:', action)
    }
  }, [])

  const handleAISidebarToggle = useCallback(() => {
    setIsAISidebarOpen((prev) => !prev)
  }, [])

  const handleDistractionFreeToggle = useCallback(() => {
    setIsDistractionFree((prev) => !prev)
  }, [])

  const handleWritingGoalsClick = useCallback(() => {
    setIsGoalsModalOpen(true)
  }, [])

  const handleSaveWritingGoals = useCallback((newGoals: WritingGoals) => {
    setWritingGoals(newGoals)
  }, [])

  const activeDocument =
    documents.find((doc) => doc.id === activeDocumentId) || null

  // Memoize initialDocument to prevent unnecessary re-renders that cause title reset
  const initialDocument = useMemo(() => {
    if (!activeDocument) return null
    console.log('[DocumentContainer] Memoizing initialDocument for', activeDocument.title)
    return {
      ...activeDocument,
      content: activeDocument.content || ''
    }
  }, [activeDocument]) // Depend on activeDocument to satisfy linter

  const mockUser = {
    id: user?.uid || '',
    name: user?.displayName || 'User',
    email: user?.email || '',
    plan: 'pro' as const,
  }

  const handleSave = useAutoSave(
    async (content: string, title: string) => {
      if (!activeDocumentId) return
      console.log('[DocumentContainer] handleSave called. Content length:', content.length, 'Title:', title)
      setSaveStatus({ status: 'saving' })
      try {
        await updateDocument(activeDocumentId, {
          content,
          title,
          wordCount: content.trim().split(/\s+/).filter(Boolean).length,
          characterCount: content.length,
        })
        setSaveStatus({ status: 'saved' })
        console.log('[DocumentContainer] Save completed successfully for title:', title)
      } catch (error) {
        console.error('[DocumentContainer] Failed to save document', error)
        setSaveStatus({ status: 'error' })
      }
    },
    2000,
    {
      compareArgs: (prev, current) => {
        // Compare content and title to avoid unnecessary saves
        const isSame = prev[0] === current[0] && prev[1] === current[1]
        console.log('[DocumentContainer] Comparing save args. Same?', isSame, 'Title changed?', prev[1] !== current[1])
        return isSame
      }
    }
  )

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
          <AISidebar isOpen={isAISidebarOpen} />
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
        onClose={() => setIsGoalsModalOpen(false)}
        onSave={handleSaveWritingGoals}
        showOnNewDocument={showGoalsOnNewDocument}
        onShowOnNewDocumentChange={setShowGoalsOnNewDocument}
      />
    </div>
  )
}
