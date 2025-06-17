'use client'

import type React from 'react'

import { useState, useCallback } from 'react'
import { useAutoSave } from '@/hooks/use-auto-save'
import { getWordCount, getCharacterCount } from '@/utils/document-utils'
import { DocumentStatusBar } from './document-status-bar'
import type { Document } from '@/types/document'
import type { AISuggestion } from '@/types/ai-features'

interface DocumentEditorProps {
  initialDocument?: Partial<Document>
  onSave?: (content: string) => Promise<void>
  onContentChange?: (content: string) => void
  suggestions?: AISuggestion[]
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
}

export function DocumentEditor({
  initialDocument = { content: '', title: 'Untitled Document' },
  onSave = async (content: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('Document saved:', content.slice(0, 50) + '...')
  },
  onContentChange,
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialDocument.content || '')
  const [title, setTitle] = useState(
    initialDocument.title || 'Untitled Document',
  )

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

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value)
    },
    [],
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
