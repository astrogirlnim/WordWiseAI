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
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@/components/ui/context-menu'
import type { GrammarError } from '@/types/grammar'
import { useAuth } from '@/lib/auth-context'
import { AuditService, AuditEvent } from '@/services/audit-service'

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
  const [content, setContent] = useState('')
  const [plainText, setPlainText] = useState('')

  const { user } = useAuth()
  const { errors, isChecking, removeError, checkGrammarImmediately } = useGrammarChecker(documentId, plainText)

  const [contextMenu, setContextMenu] = useState<{ error: GrammarError } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable history to manage it manually if needed, or for performance.
        history: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      GrammarExtension,
    ],
    content: initialDocument.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      setContent(html)
      setPlainText(text)
      onContentChange?.(html)
      onSave?.(html, title)
    },
    onCreate: ({ editor }) => {
      setPlainText(editor.getText())
    },
  })

  const handleApplySuggestion = useCallback(
    (error: GrammarError, suggestion: string) => {
      if (!editor || !user) return
      let replacementRange = { from: error.start, to: error.end }

      const textInDoc = editor.state.doc.textBetween(
        replacementRange.from,
        replacementRange.to,
      )

      if (textInDoc !== error.error) {
        console.warn(
          `[DocumentEditor] Mismatch detected. Expected: "${error.error}", Found: "${textInDoc}". Searching for correct position.`,
        )

        const potentialRanges: { from: number; to: number }[] = []
        editor.state.doc.nodesBetween(
          0,
          editor.state.doc.content.size,
          (node, pos) => {
            if (!node.isText || !node.text) {
              return
            }

            let index
            const text = node.text
            let offset = 0

            while ((index = text.indexOf(error.error, offset)) !== -1) {
              const from = pos + index
              const to = from + error.error.length
              potentialRanges.push({ from, to })
              offset = index + error.error.length
            }
          },
        )

        if (potentialRanges.length > 0) {
          const bestMatch = potentialRanges.reduce((prev, curr) => {
            const prevDist = Math.abs(prev.from - error.start)
            const currDist = Math.abs(curr.from - error.start)
            return currDist < prevDist ? curr : prev
          })
          replacementRange = bestMatch
          console.log(
            `[DocumentEditor] Found closest match. New range: [${replacementRange.from}, ${replacementRange.to}]`,
          )
        } else {
          console.error(
            `[DocumentEditor] Could not find text "${error.error}" in document to apply suggestion. Aborting.`,
          )
          return
        }
      }

      editor
        .chain()
        .focus()
        .deleteRange(replacementRange)
        .insertContentAt(replacementRange.from, suggestion)
        .run()

      // Immediately re-check grammar after applying a suggestion
      if (editor) {
        checkGrammarImmediately(editor.getText())
      }

      AuditService.logEvent(AuditEvent.SUGGESTION_APPLY, user.uid, {
        documentId,
        errorId: error.id,
        errorText: error.error,
        suggestion,
        msSinceShown: error.shownAt ? Date.now() - error.shownAt : -1,
      })

      removeError(error.id)
      setContextMenu(null)
    },
    [editor, user, documentId, removeError, checkGrammarImmediately],
  )

  const handleIgnoreError = useCallback(
    (error: GrammarError) => {
      if (!user) return
      AuditService.logEvent(AuditEvent.SUGGESTION_IGNORE, user.uid, {
        documentId,
        errorId: error.id,
        errorText: error.error,
        msSinceShown: error.shownAt ? Date.now() - error.shownAt : -1,
      })
      removeError(error.id)
      setContextMenu(null)
    },
    [user, documentId, removeError],
  )

  const handleAddToDictionary = useCallback(
    (error: GrammarError) => {
      if (!user) return
      // TODO: Implement user dictionary service
      console.log('Adding to dictionary:', error.error)
      AuditService.logEvent(AuditEvent.SUGGESTION_ADD_TO_DICTIONARY, user.uid, {
        documentId,
        errorId: error.id,
        word: error.error,
        msSinceShown: error.shownAt ? Date.now() - error.shownAt : -1,
      })
      removeError(error.id)
      setContextMenu(null)
    },
    [user, documentId, removeError],
  )

  useEffect(() => {
    if (editor && initialDocument.content && initialDocument.content !== content) {
      console.log(`[DocumentEditor] Syncing content and running initial check for document ${documentId}`);
      
      // Sync component state
      setContent(initialDocument.content);
      
      const text = editor.getText();
      setPlainText(text);
      
      // Kick off grammar check immediately
      if (text) {
        checkGrammarImmediately(text);
      }
    }
  }, [documentId, initialDocument.content, editor, content, checkGrammarImmediately]);
  
  useEffect(() => {
    if (initialDocument.title && initialDocument.title !== title) {
        setTitle(initialDocument.title)
    }
  }, [initialDocument.title, title])

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const { tr } = editor.state;
      tr.setMeta('grammarErrors', errors);
      editor.view.dispatch(tr);
    }
  }, [errors, editor]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === '.') {
            const { from } = editor.state.selection;
            const errorAtCursor = errors.find(e => from >= e.start && from <= e.end);
            if (errorAtCursor) {
                event.preventDefault();
                console.log("Keyboard shortcut for suggestions triggered, but pop-up location is not implemented.", errorAtCursor)
            }
        }

        if (event.altKey && event.key === 'Enter') {
            if (contextMenu) {
                event.preventDefault();
                const firstSuggestion = contextMenu.error.suggestions[0];
                if (firstSuggestion) {
                    handleApplySuggestion(contextMenu.error, firstSuggestion);
                }
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, errors, contextMenu, handleApplySuggestion]);

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
      <ContextMenuPrimitive.Root onOpenChange={(open) => {
          if (!open) {
              setContextMenu(null);
          }
      }}>
        <ContextMenuPrimitive.Trigger asChild>
          <div className="relative flex-1 prose dark:prose-invert max-w-none" onContextMenuCapture={(e) => {
              const target = e.target as HTMLElement;
              const errorSpan = target.closest('.grammar-error');
              if (errorSpan) {
                  const errorJson = errorSpan.getAttribute('data-error-json');
                  if (errorJson) {
                      const error: GrammarError = JSON.parse(errorJson);
                      setContextMenu({ error });
                  } else {
                      setContextMenu(null);
                  }
              } else {
                  setContextMenu(null);
              }
          }}>
            <EditorContent editor={editor} className="h-full w-full resize-none border-none bg-transparent px-6 py-6 text-base leading-relaxed outline-none" />
          </div>
        </ContextMenuPrimitive.Trigger>
        {contextMenu && (
            <ContextMenuContent>
                <ContextMenuLabel>Suggestions for &quot;{contextMenu.error.error}&quot;</ContextMenuLabel>
                <ContextMenuSeparator />
                {contextMenu.error.suggestions.length > 0 ? (
                    contextMenu.error.suggestions.map((suggestion, index) => (
                        <ContextMenuItem key={index} onSelect={() => handleApplySuggestion(contextMenu.error, suggestion)}>
                            {suggestion}
                        </ContextMenuItem>
                    ))
                ) : (
                    <ContextMenuItem disabled>No suggestions available</ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => handleIgnoreError(contextMenu.error)}>Ignore</ContextMenuItem>
                <ContextMenuItem onSelect={() => handleAddToDictionary(contextMenu.error)}>Add to Dictionary</ContextMenuItem>
            </ContextMenuContent>
        )}
      </ContextMenuPrimitive.Root>

      {/* Status Bar */}
      <DocumentStatusBar
        saveStatus={isChecking ? { status: 'checking' } : saveStatus}
        wordCount={wordCount}
        characterCount={characterCount}
      />
    </div>
  )
}
