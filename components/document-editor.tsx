'use client'

import type React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { getWordCount, getCharacterCount } from '@/utils/document-utils'
import { DocumentStatusBar } from './document-status-bar'
import type { Document, AutoSaveStatus } from '@/types/document'
import type { AISuggestion } from '@/types/ai-features'

interface DocumentEditorProps {
  documentId: string
  initialDocument?: Partial<Document>
  onSave?: (content: string, title: string) => void
  onContentChange?: (content: string) => void
  suggestions?: AISuggestion[]
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
  saveStatus: AutoSaveStatus
}

export function DocumentEditor({
  documentId,
  initialDocument = { content: '', title: 'Untitled Document' },
  onSave,
  onContentChange,
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
  saveStatus,
}: DocumentEditorProps) {
  console.log(`[DocumentEditor] Rendering. Document ID: ${documentId}`)
  const [content, setContent] = useState(initialDocument.content || '')
  const [title, setTitle] = useState(initialDocument.title || 'Untitled Document')

  useEffect(() => {
    console.log(`[DocumentEditor] Initializing document ${documentId}`)
    setContent(initialDocument.content || '')
    setTitle(initialDocument.title || 'Untitled Document')
  }, [documentId, initialDocument.content, initialDocument.title])

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setContent(newContent)
      onContentChange?.(newContent)
      onSave?.(newContent, title)
    },
    [title, onSave, onContentChange],
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value
      setTitle(newTitle)
      onSave?.(content, newTitle)
    },
    [content, onSave],
  )

  const wordCount = getWordCount(content)
  const characterCount = getCharacterCount(content)

  return (
    <div className="flex h-full flex-col">
      {/* Document Title */}
      <div className="border-b px-6 py-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full border-none bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground"
          placeholder="Untitled Document"
        />
      </div>

      {/* Editor Area */}
      <div className="relative flex-1">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="h-full w-full resize-none border-none bg-transparent px-6 py-6 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
          placeholder="Start writing..."
          spellCheck={true}
        />
      </div>

      {/* Status Bar */}
      <DocumentStatusBar
        saveStatus={saveStatus}
        wordCount={wordCount}
        characterCount={characterCount}
      />
    </div>
  )
}
