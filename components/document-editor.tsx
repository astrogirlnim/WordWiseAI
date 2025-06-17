'use client'

import type React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { getWordCount, getCharacterCount } from '@/utils/document-utils'
import { DocumentStatusBar } from './document-status-bar'
import type { Document, AutoSaveStatus } from '@/types/document'
import { useGrammarChecker } from '@/hooks/use-grammar-checker'
import { GrammarExtension } from './tiptap-grammar-extension'

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
  const [title, setTitle] = useState(initialDocument.title || 'Untitled Document')
  const [content, setContent] = useState(initialDocument.content || '')

  const { errors, isChecking } = useGrammarChecker(documentId, content)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable history to manage it manually if needed, or for performance.
        history: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      GrammarExtension.configure({
        errors,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setContent(html)
      onContentChange?.(html)
      onSave?.(html, title)
    },
  })

  useEffect(() => {
    if (editor && initialDocument.content !== content) {
      console.log(`[DocumentEditor] Setting editor content for document ${documentId}`)
      setContent(initialDocument.content || '')
      editor.commands.setContent(initialDocument.content || '', false)
    }
    if (initialDocument.title !== title) {
        setTitle(initialDocument.title || 'Untitled Document')
    }
  }, [documentId, initialDocument.content, initialDocument.title, editor])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value
      setTitle(newTitle)
      onSave?.(content, newTitle)
    },
    [content, onSave],
  )

  const wordCount = getWordCount(editor?.getText() || '')
  const characterCount = getCharacterCount(editor?.getText() || '')

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
      <div className="relative flex-1 prose dark:prose-invert max-w-none">
        <EditorContent editor={editor} className="h-full w-full resize-none border-none bg-transparent px-6 py-6 text-base leading-relaxed outline-none" />
      </div>

      {/* Status Bar */}
      <DocumentStatusBar
        saveStatus={isChecking ? { status: 'checking' } : saveStatus}
        wordCount={wordCount}
        characterCount={characterCount}
      />
    </div>
  )
}
