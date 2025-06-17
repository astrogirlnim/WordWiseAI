'use client'

import type React from 'react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { getWordCount, getCharacterCount } from '@/utils/document-utils'
import { DocumentStatusBar } from './document-status-bar'
import type { Document, AutoSaveStatus } from '@/types/document'
import type { AISuggestion } from '@/types/ai-features'
import { useYjs } from '@/hooks/use-yjs'
import * as Y from 'yjs'

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
  const { yDoc, provider } = useYjs({ roomId: documentId })
  const [content, setContent] = useState('')
  const [title, setTitle] = useState(initialDocument.title || 'Untitled Document')
  const isInitialized = useRef(false)

  // This effect synchronizes the Yjs document with the initial content from the database.
  // It runs only once when the document ID changes.
  useEffect(() => {
    console.log(`[DocumentEditor] Initializing document ${documentId}`)
    const yText = yDoc.getText('content')
    const initialContent = initialDocument.content || ''

    const handleSync = () => {
      console.log('[DocumentEditor] Provider synced. Comparing content.')
      const currentYjsContent = yText.toString()

      // If Yjs content is different from the DB, update Yjs.
      if (currentYjsContent !== initialContent) {
        console.log(`[DocumentEditor] Discrepancy found. Updating Yjs content for ${documentId}.`)
        yDoc.transact(() => {
          yText.delete(0, yText.length)
          yText.insert(0, initialContent)
        })
      } else {
        console.log(`[DocumentEditor] Content for ${documentId} is already in sync.`)
      }
      
      // Set the textarea content from Yjs, making Yjs the source of truth for the UI.
      setContent(yText.toString())
      isInitialized.current = true
    }

    if (provider) {
      // The 'synced' event fires when the provider has connected and synchronized its state.
      provider.on('synced', handleSync)
    }

    // Set up the observer to keep the React state in sync with Yjs.
    const handleObserver = () => {
      setContent(yText.toString())
    }
    yText.observe(handleObserver)

    // Initial content for the title
    setTitle(initialDocument.title || 'Untitled Document')

    return () => {
      console.log(`[DocumentEditor] Cleaning up ${documentId}`)
      if (provider) {
        provider.off('synced', handleSync)
      }
      yText.unobserve(handleObserver)
    }
  }, [documentId, initialDocument.content, initialDocument.title, provider, yDoc])

  // This effect handles changes to the document content from user input.
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isInitialized.current) return

      const newContent = e.target.value
      const yText = yDoc.getText('content')
      
      // Instead of replacing the whole content, we calculate the diff.
      // For a simple textarea, we'll still replace, but a more advanced editor
      // would provide granular diffs.
      yDoc.transact(() => {
        yText.delete(0, yText.length)
        yText.insert(0, newContent)
      })

      onContentChange?.(newContent)
      onSave?.(newContent, title)
    },
    [yDoc, title, onSave, onContentChange],
  )
  
  // This effect handles changes to the document title.
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
          placeholder={isInitialized.current ? "Start writing..." : "Connecting..."}
          spellCheck={true}
          disabled={!isInitialized.current}
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
