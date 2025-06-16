"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { DocumentEditor } from "./document-editor"
import { AISidebar } from "./ai-sidebar"
import { NavigationBar } from "./navigation-bar"
import { WritingGoalsModal } from "./writing-goals-modal"
import { useDocuments } from "@/hooks/use-documents"
import { defaultWritingGoals } from "@/utils/writing-goals-data"
import type { WritingGoals } from "@/types/writing-goals"

export function DocumentContainer() {
  const { user } = useAuth()
  const { documents, loading, createDocument, updateDocument } = useDocuments()

  const [content, setContent] = useState("")
  const [activeDocumentId, setActiveDocumentId] = useState<string>("")
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true)
  const [writingGoals, setWritingGoals] = useState<WritingGoals>(defaultWritingGoals)
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const [showGoalsOnNewDocument, setShowGoalsOnNewDocument] = useState(true)

  // Set active document when documents load
  useEffect(() => {
    if (documents.length > 0 && !activeDocumentId) {
      const firstDoc = documents[0]
      setActiveDocumentId(firstDoc.id)
      setContent(firstDoc.content)
    }
  }, [documents, activeDocumentId])

  const handleContentChange = useCallback(
    async (newContent: string) => {
      setContent(newContent)

      if (activeDocumentId && user?.uid) {
        // Auto-save document
        await updateDocument(activeDocumentId, {
          content: newContent,
          wordCount: newContent.trim().split(/\s+/).filter(Boolean).length,
          characterCount: newContent.length,
        })
      }
    },
    [activeDocumentId, user?.uid, updateDocument],
  )

  const handleDocumentSelect = useCallback(
    (documentId: string) => {
      const document = documents.find((doc) => doc.id === documentId)
      if (document) {
        setActiveDocumentId(documentId)
        setContent(document.content)
      }
    },
    [documents],
  )

  const handleNewDocument = useCallback(async () => {
    if (!user?.uid) return

    const documentId = await createDocument("Untitled Document")
    if (documentId) {
      setActiveDocumentId(documentId)
      setContent("")

      if (showGoalsOnNewDocument) {
        setIsGoalsModalOpen(true)
      }
    }
  }, [user?.uid, createDocument, showGoalsOnNewDocument])

  const handleUserAction = useCallback((action: string) => {
    switch (action) {
      case "profile":
        console.log("Opening profile...")
        break
      case "settings":
        console.log("Opening settings...")
        break
      case "billing":
        console.log("Opening billing...")
        break
      case "help":
        console.log("Opening help...")
        break
      case "signout":
        console.log("Signing out...")
        break
      default:
        console.log("Unknown action:", action)
    }
  }, [])

  const handleAISidebarToggle = useCallback(() => {
    setIsAISidebarOpen((prev) => !prev)
  }, [])

  const handleWritingGoalsClick = useCallback(() => {
    setIsGoalsModalOpen(true)
  }, [])

  const handleSaveWritingGoals = useCallback(
    (newGoals: WritingGoals) => {
      setWritingGoals(newGoals)
    },
    [],
  )

  // Convert documents to the format expected by navigation
  const navigationDocuments = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    lastModified: new Date(doc.updatedAt),
    wordCount: doc.wordCount,
    isActive: doc.id === activeDocumentId,
  }))

  const mockUser = {
    id: user?.uid || "",
    name: user?.displayName || "User",
    email: user?.email || "",
    plan: "pro" as const,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Navigation Bar */}
      <NavigationBar
        user={mockUser}
        documents={navigationDocuments}
        activeDocumentId={activeDocumentId}
        isAISidebarOpen={isAISidebarOpen}
        aiSuggestionCount={0}
        writingGoals={writingGoals}
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
        onUserAction={handleUserAction}
        onAISidebarToggle={handleAISidebarToggle}
        onWritingGoalsClick={handleWritingGoalsClick}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 relative">
        <div className={`flex-1 transition-all duration-300 ${isAISidebarOpen ? "mr-80" : "mr-0"}`}>
          <DocumentEditor
            onContentChange={handleContentChange}
            suggestions={[]}
            onApplySuggestion={() => {}}
          />
        </div>

        {/* AI Sidebar */}
        <AISidebar
          isOpen={isAISidebarOpen}
          onToggle={handleAISidebarToggle}
        />
      </div>

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
