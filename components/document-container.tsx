"use client"

import { useState, useCallback, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { DocumentEditor } from "./document-editor"
import { AISidebar } from "./ai-sidebar"
import { NavigationBar } from "./navigation-bar"
import { WritingGoalsModal } from "./writing-goals-modal"
import { useDocuments } from "@/hooks/use-documents"
import { AIService } from "@/services/ai-service"
import { defaultWritingGoals } from "@/utils/writing-goals-data"
import type { AISuggestion, ToneAnalysis } from "@/types/ai-features"
import type { WritingGoals } from "@/types/writing-goals"
import type { ToneAlignmentReport } from "@/types/tone-alignment"

export function DocumentContainer() {
  const { user } = useUser()
  const { documents, loading, createDocument, updateDocument } = useDocuments()

  const [content, setContent] = useState("")
  const [activeDocumentId, setActiveDocumentId] = useState<string>("")
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true)
  const [writingGoals, setWritingGoals] = useState<WritingGoals>(defaultWritingGoals)
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const [showGoalsOnNewDocument, setShowGoalsOnNewDocument] = useState(true)

  // AI Analysis state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null)
  const [toneAlignmentReport, setToneAlignmentReport] = useState<ToneAlignmentReport | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Set active document when documents load
  useEffect(() => {
    if (documents.length > 0 && !activeDocumentId) {
      const firstDoc = documents[0]
      setActiveDocumentId(firstDoc.id)
      setContent(firstDoc.content)
      setWritingGoals(firstDoc.writingGoals)
    }
  }, [documents, activeDocumentId])

  // Generate AI analysis when content or goals change
  useEffect(() => {
    if (!content.trim() || !activeDocumentId || !user?.id) return

    const timeoutId = setTimeout(async () => {
      try {
        setAnalysisLoading(true)
        const analysis = await AIService.generateAnalysis(user.id, activeDocumentId, content, writingGoals)

        setAiSuggestions(analysis.suggestions)
        setToneAnalysis(analysis.toneAnalysis)
        setToneAlignmentReport(analysis.alignmentReport)
      } catch (error) {
        console.error("Failed to generate AI analysis:", error)
      } finally {
        setAnalysisLoading(false)
      }
    }, 2000) // Debounce for 2 seconds

    return () => clearTimeout(timeoutId)
  }, [content, writingGoals, activeDocumentId, user?.id])

  const handleContentChange = useCallback(
    async (newContent: string) => {
      setContent(newContent)

      if (activeDocumentId && user?.id) {
        // Auto-save document
        await updateDocument(activeDocumentId, {
          content: newContent,
          wordCount: newContent.trim().split(/\s+/).filter(Boolean).length,
          characterCount: newContent.length,
        })
      }
    },
    [activeDocumentId, user?.id, updateDocument],
  )

  const handleDocumentSelect = useCallback(
    (documentId: string) => {
      const document = documents.find((doc) => doc.id === documentId)
      if (document) {
        setActiveDocumentId(documentId)
        setContent(document.content)
        setWritingGoals(document.writingGoals)
      }
    },
    [documents],
  )

  const handleNewDocument = useCallback(async () => {
    if (!user?.id) return

    const documentId = await createDocument("Untitled Document", writingGoals)
    if (documentId) {
      setActiveDocumentId(documentId)
      setContent("")

      if (showGoalsOnNewDocument) {
        setIsGoalsModalOpen(true)
      }
    }
  }, [user?.id, createDocument, writingGoals, showGoalsOnNewDocument])

  const handleApplySuggestion = useCallback(
    async (suggestion: AISuggestion) => {
      if (!user?.id || !activeDocumentId) return

      // Save feedback to Firestore
      await AIService.saveSuggestionFeedback(user.id, activeDocumentId, suggestion, "applied")

      // Remove from local state
      setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))

      console.log("Applied suggestion:", suggestion)
    },
    [user?.id, activeDocumentId],
  )

  const handleDismissSuggestion = useCallback(
    async (suggestionId: string) => {
      if (!user?.id || !activeDocumentId) return

      const suggestion = aiSuggestions.find((s) => s.id === suggestionId)
      if (suggestion) {
        // Save feedback to Firestore
        await AIService.saveSuggestionFeedback(user.id, activeDocumentId, suggestion, "dismissed")
      }

      // Remove from local state
      setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
    },
    [user?.id, activeDocumentId, aiSuggestions],
  )

  const handleApplyRecommendation = useCallback((recommendationId: string) => {
    console.log("Applied tone recommendation:", recommendationId)
  }, [])

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
    async (newGoals: WritingGoals) => {
      setWritingGoals(newGoals)

      // Update the active document's writing goals
      if (activeDocumentId && user?.id) {
        await updateDocument(activeDocumentId, { writingGoals: newGoals })
      }
    },
    [activeDocumentId, user?.id, updateDocument],
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
    id: user?.id || "",
    name: user?.fullName || "User",
    email: user?.primaryEmailAddress?.emailAddress || "",
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
        aiSuggestionCount={aiSuggestions.length}
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
            suggestions={aiSuggestions}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={handleDismissSuggestion}
          />
        </div>

        {/* AI Sidebar */}
        <AISidebar
          suggestions={aiSuggestions}
          toneAnalysis={
            toneAnalysis || {
              overall: "neutral",
              confidence: 0,
              aspects: { formality: 50, friendliness: 50, confidence: 50, clarity: 50 },
              suggestions: [],
            }
          }
          toneAlignmentReport={
            toneAlignmentReport || {
              overallScore: 0,
              overallStatus: "poor",
              scores: {
                audience: { category: "", current: 0, target: 0, alignment: 0, status: "poor" },
                formality: { category: "", current: 0, target: 0, alignment: 0, status: "poor" },
                domain: { category: "", current: 0, target: 0, alignment: 0, status: "poor" },
                intent: { category: "", current: 0, target: 0, alignment: 0, status: "poor" },
              },
              recommendations: [],
              brandConsistency: { score: 0, issues: [], strengths: [] },
            }
          }
          isOpen={isAISidebarOpen}
          onToggle={handleAISidebarToggle}
          onApplySuggestion={handleApplySuggestion}
          onDismissSuggestion={handleDismissSuggestion}
          onApplyRecommendation={handleApplyRecommendation}
        />
      </div>

      {/* Writing Goals Modal */}
      <WritingGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        currentGoals={writingGoals}
        onSave={handleSaveWritingGoals}
        showOnNewDocument={showGoalsOnNewDocument}
        onShowOnNewDocumentChange={setShowGoalsOnNewDocument}
      />
    </div>
  )
}
