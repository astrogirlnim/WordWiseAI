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
  console.log('[DocumentEditor] Rendering with document:', documentId, 'initial content length:', initialDocument?.content?.length || 0)
  
  const { yDoc } = useYjs({ roomId: documentId })
  const [content, setContent] = useState('')
  const [title, setTitle] = useState(initialDocument.title || 'Untitled Document')
  const isInitializedRef = useRef(false)
  const lastSavedContentRef = useRef('')

  // Initialize YJS content only once and set up observer
  useEffect(() => {
    console.log('[DocumentEditor] Setting up YJS for document:', documentId)
    const yText = yDoc.getText('content')

    const observer = () => {
      const currentContent = yText.toString()
      console.log('[DocumentEditor] YJS content changed, new length:', currentContent.length)
      setContent(currentContent)
      onContentChange?.(currentContent)
    }

    yText.observe(observer)

    // Initialize content only if YJS is empty and we have initial content
    if (!isInitializedRef.current) {
      const yjsContent = yText.toString()
      const initContent = initialDocument.content || ''
      
      console.log('[DocumentEditor] Initializing content - YJS length:', yjsContent.length, 'Initial length:', initContent.length)
      
      if (yjsContent === '' && initContent !== '') {
        console.log('[DocumentEditor] Setting initial content in YJS')
        yDoc.transact(() => {
          yText.insert(0, initContent)
        })
      } else if (yjsContent !== '') {
        console.log('[DocumentEditor] Using existing YJS content')
        setContent(yjsContent)
        onContentChange?.(yjsContent)
      } else {
        console.log('[DocumentEditor] Both YJS and initial content are empty')
        setContent(initContent)
        onContentChange?.(initContent)
      }
      
      lastSavedContentRef.current = yjsContent || initContent
      isInitializedRef.current = true
    }

    return () => {
      console.log('[DocumentEditor] Cleaning up YJS observer')
      yText.unobserve(observer)
    }
  }, [yDoc, documentId, initialDocument.content, onContentChange])

  // Update title when initialDocument changes
  useEffect(() => {
    console.log('[DocumentEditor] Title updated:', initialDocument.title)
    setTitle(initialDocument.title || 'Untitled Document')
  }, [initialDocument.title])

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      console.log('[DocumentEditor] Textarea content changed, new length:', newContent.length)
      
      const yText = yDoc.getText('content')
      const currentYjsContent = yText.toString()
      
      // Only update YJS if content actually differs to prevent feedback loops
      if (currentYjsContent !== newContent) {
        console.log('[DocumentEditor] Updating YJS content')
        yDoc.transact(() => {
          yText.delete(0, yText.length)
          yText.insert(0, newContent)
        })
      }
      
      // Only trigger save if content actually changed
      if (newContent !== lastSavedContentRef.current && onSave) {
        console.log('[DocumentEditor] Content changed, triggering save')
        onSave(newContent, title)
        lastSavedContentRef.current = newContent
      }
    },
    [yDoc, onSave, title],
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value
      console.log('[DocumentEditor] Title changed:', newTitle)
      setTitle(newTitle)
      if (onSave) {
        onSave(content, newTitle)
      }
    },
    [onSave, content],
  )

  const wordCount = getWordCount(content)
  const characterCount = getCharacterCount(content)

  console.log('[DocumentEditor] Rendering editor with content length:', content.length)

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
