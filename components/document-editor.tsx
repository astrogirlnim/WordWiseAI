'use client'

import type React from 'react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { getWordCount, getCharacterCount } from '@/utils/document-utils'
import { DocumentStatusBar } from './document-status-bar'
import type { Document, AutoSaveStatus } from '@/types/document'
import { useYjs } from '@/hooks/use-yjs'
import { useGrammarCheck } from '@/hooks/use-auto-save'
import type { GrammarError } from '@/services/ai-service'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface DocumentEditorProps {
  documentId: string
  initialDocument?: Partial<Document>
  onSave?: (content: string, title: string) => void
  onContentChange?: (content: string) => void
  saveStatus: AutoSaveStatus
}

export function DocumentEditor({
  documentId,
  initialDocument = { content: '', title: 'Untitled Document' },
  onSave,
  onContentChange,
  saveStatus,
}: DocumentEditorProps) {
  console.log(`[DocumentEditor] Rendering. Document ID: ${documentId}`)
  const { yDoc, provider } = useYjs({ roomId: documentId })
  const [content, setContent] = useState('')
  const [title, setTitle] = useState(initialDocument.title || 'Untitled Document')
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    error: GrammarError
  } | null>(null)
  const isInitialized = useRef(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Grammar checking hook
  const checkGrammar = useGrammarCheck(
    (errors) => {
      console.log('[DocumentEditor] Received grammar errors:', errors.length)
      setGrammarErrors(errors)
    },
    (latency) => {
      console.log('[DocumentEditor] Grammar check latency:', latency)
    }
  )

  // This effect synchronizes the Yjs document with the initial content from the database.
  // It runs only once when the document ID changes.
  useEffect(() => {
    console.log(`[DocumentEditor] Initializing document ${documentId}`)
    const yText = yDoc.getText('content')
    const initialContent = initialDocument.content || ''

    const handleSync = () => {
      console.log('[DocumentEditor] Provider synced. Comparing content.')
      const currentYjsContent = yText.toString()
      const initialDbContent = initialDocument.content || ''

      // If Yjs content is empty and DB has content, update Yjs.
      // This is a simplified sync logic. A real-world app would need a more robust merge.
      if (currentYjsContent.trim() === '' && initialDbContent.trim() !== '') {
        console.log(`[DocumentEditor] Yjs is empty, populating from DB for ${documentId}.`)
        yDoc.transact(() => {
          yText.insert(0, initialDbContent)
        })
        setContent(initialDbContent)
      } else {
         console.log(`[DocumentEditor] Content for ${documentId} is already in sync or Yjs has content.`)
         setContent(currentYjsContent)
      }
      isInitialized.current = true
    }

    if (provider) {
      // The 'synced' event fires when the provider has connected and synchronized its state.
      provider.on('synced', handleSync)
    }

    // Set up the observer to keep the React state in sync with Yjs.
    const handleObserver = () => {
      const newContent = yDoc.getText('content').toString()
      setContent(newContent)
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
    (e: React.FormEvent<HTMLDivElement>) => {
      if (!isInitialized.current) return

      const newContent = e.currentTarget.innerText
      const yText = yDoc.getText('content')
      
      // Update Yjs with the new plain text content
      yDoc.transact(() => {
        yText.delete(0, yText.length)
        yText.insert(0, newContent)
      })

      onContentChange?.(newContent)
      onSave?.(newContent, title)

      // Trigger grammar check with 300ms debounce
      checkGrammar(newContent)
    },
    [yDoc, title, onSave, onContentChange, checkGrammar],
  )

  const handleSuggestionClick = (error: GrammarError, suggestion: string) => {
    const yText = yDoc.getText('content')
    const currentContent = yText.toString()
    
    // Create new content with the suggestion applied
    const newContent = currentContent.substring(0, error.start) + suggestion + currentContent.substring(error.end)
    
    // Update Yjs, which will then update the state via the observer
    yDoc.transact(() => {
        yText.delete(0, yText.length)
        yText.insert(0, newContent)
    })
    
    // Immediately clear errors and re-check grammar
    setGrammarErrors([])
    checkGrammar(newContent)
    setContextMenu(null)
  }

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])
  
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

  const renderContentWithErrors = () => {
    if (!content) return null

    const sortedErrors = [...grammarErrors].sort((a, b) => a.start - b.start)
    let lastIndex = 0
    const parts: (string | JSX.Element)[] = []

    sortedErrors.forEach((error, index) => {
      if (error.start < lastIndex) return // Skip overlapping errors

      // Add text part before the error
      if (error.start > lastIndex) {
        parts.push(content.substring(lastIndex, error.start))
      }

      // Add the error span
      const errorText = content.substring(error.start, error.end)
      const errorClass = error.type === 'spelling' ? 'bg-red-200 dark:bg-red-800/50' : 'bg-blue-200 dark:bg-blue-800/50'
      
      parts.push(
        <ContextMenu key={`${error.start}-${index}`}>
          <ContextMenuTrigger asChild>
            <span className={errorClass} data-testid={`error-${index}`}>
              {errorText}
            </span>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <div className="p-2 text-sm text-muted-foreground">{error.message}</div>
            {error.suggestions.map((suggestion, sIndex) => (
              <ContextMenuItem key={sIndex} onClick={() => handleSuggestionClick(error, suggestion)}>
                {suggestion}
              </ContextMenuItem>
            ))}
             {error.suggestions.length === 0 && <ContextMenuItem disabled>No suggestions</ContextMenuItem>}
          </ContextMenuContent>
        </ContextMenu>
      )

      lastIndex = error.end
    })

    // Add remaining text part
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return <>{parts}</>
  }

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
      <div className="relative flex-1" onClick={() => editorRef.current?.focus()}>
        <div
          ref={editorRef}
          contentEditable={isInitialized.current}
          onInput={handleContentChange}
          className="h-full w-full resize-none border-none bg-transparent px-6 py-6 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
          data-placeholder={isInitialized.current ? "Start writing..." : "Connecting..."}
          spellCheck={false} // Disable browser's spellcheck to use our own
        >
          {renderContentWithErrors()}
        </div>
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
