'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { DocumentEditor } from './document-editor'
import { AISidebar } from './ai-sidebar'
import { NavigationBar } from './navigation-bar'
import { WritingGoalsModal } from './writing-goals-modal'
import { useDocuments } from '@/hooks/use-documents'
import { defaultWritingGoals } from '@/utils/writing-goals-data'
import type { WritingGoals } from '@/types/writing-goals'
import { VersionHistorySidebar } from './version-history-sidebar'
import type { Document, AutoSaveStatus } from '@/types/document'
import { Timestamp } from 'firebase/firestore'
import { DistractionFreeToggle } from './distraction-free-toggle'
import { VersionDiffViewer } from './version-diff-viewer'
import { useDocumentVersions } from '@/hooks/use-document-versions'
import { useAutoSave } from '@/hooks/use-auto-save'

export function DocumentContainer() {
  const { user } = useAuth()
  const {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    restoreDocumentVersion,
  } = useDocuments()
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const { versions, loading: versionsLoading, error: versionsError, reloadVersions } = useDocumentVersions(activeDocumentId || null)

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
      if (!activeDocumentId || !restoreDocumentVersion) return

      await restoreDocumentVersion(activeDocumentId, versionId)
      await reloadVersions()
      setIsVersionHistoryOpen(false)
      // toast(...)
    },
    [activeDocumentId, restoreDocumentVersion, reloadVersions],
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

  const mockUser = {
    id: user?.uid || '',
    name: user?.displayName || 'User',
    email: user?.email || '',
    plan: 'pro' as const,
  }

  const handleSave = useAutoSave(
    async (content: string, title: string) => {
      if (!activeDocumentId) return
              console.log('[DocumentContainer] Starting save process for', activeDocumentId)
        setSaveStatus({ status: 'saving' })
        try {
          await updateDocument(activeDocumentId, {
            content,
            title,
            wordCount: content.trim().split(/\s+/).filter(Boolean).length,
            characterCount: content.length,
          })
          setSaveStatus({ status: 'saved' })
          console.log('[DocumentContainer] Save completed successfully')
        } catch (error) {
          console.error('[DocumentContainer] Failed to save document', error)
          setSaveStatus({ status: 'error' })
        }
    },
    2000,
    {
      compareArgs: (prev, current) => {
        // Compare content and title to avoid unnecessary saves
        return prev[0] === current[0] && prev[1] === current[1]
      }
    }
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
          {activeDocument && user?.uid ? (
            <DocumentEditor
              key={activeDocumentId}
              documentId={activeDocument.id}
              initialDocument={activeDocument}
              onSave={handleSave}
              saveStatus={saveStatus}
              suggestions={[]}
              onApplySuggestion={() => {}}
              onDismissSuggestion={() => {}}
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
          <AISidebar isOpen={isAISidebarOpen} onToggle={handleAISidebarToggle} />
        )}
      </main>

      <VersionHistorySidebar
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        documentId={activeDocumentId}
        onRestore={handleRestoreVersion}
        onView={handleViewVersion}
        versions={versions}
        loading={versionsLoading}
        error={versionsError}
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
