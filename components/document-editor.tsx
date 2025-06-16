"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useAutoSave } from "@/hooks/use-auto-save"
import { getWordCount, getCharacterCount } from "@/utils/document-utils"
import { DocumentStatusBar } from "./document-status-bar"
import type { Document } from "@/types/document"
import type { AISuggestion } from "@/types/ai-features"

interface DocumentEditorProps {
  initialDocument?: Partial<Document>
  onSave?: (content: string) => Promise<void>
  onContentChange?: (content: string) => void
  suggestions?: AISuggestion[]
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
}

export function DocumentEditor({
  initialDocument = { content: "", title: "Untitled Document" },
  onSave = async (content: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log("Document saved:", content.slice(0, 50) + "...")
  },
  onContentChange,
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialDocument.content || "")
  const [title, setTitle] = useState(initialDocument.title || "Untitled Document")

  const { saveStatus } = useAutoSave({
    content,
    onSave,
    delay: 2000,
  })

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setContent(newContent)
      onContentChange?.(newContent)
    },
    [onContentChange],
  )

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }, [])

  const wordCount = getWordCount(content)
  const characterCount = getCharacterCount(content)

  return (
    <div className="flex flex-col h-full">
      {/* Document Title */}
      <div className="px-6 py-4 border-b">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-2xl font-semibold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
          placeholder="Untitled Document"
        />
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-full resize-none border-none outline-none px-6 py-6 text-base leading-relaxed bg-transparent placeholder:text-muted-foreground"
          placeholder="Start writing..."
          spellCheck={true}
        />
      </div>

      {/* Status Bar */}
      <DocumentStatusBar saveStatus={saveStatus} wordCount={wordCount} characterCount={characterCount} />
    </div>
  )
}
