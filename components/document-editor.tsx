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
  const [plainText, setPlainText] = useState('')

  const { user } = useAuth()
  const { errors, isChecking, removeError, checkGrammarImmediately } = useGrammarChecker(documentId, plainText)

  const [contextMenu, setContextMenu] = useState<{ error: GrammarError } | null>(null);

  const handleContextMenuCapture = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const errorSpan = target.closest('.grammar-error');
    if (errorSpan) {
        const errorJson = errorSpan.getAttribute('data-error-json');
        if (errorJson) {
            try {
              const error: GrammarError = JSON.parse(errorJson);
              setContextMenu({ error });
            } catch (parseError) {
              console.error('[DocumentEditor] Failed to parse error JSON:', parseError);
              setContextMenu(null);
            }
        } else {
            setContextMenu(null);
        }
    } else {
        setContextMenu(null);
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
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
      setPlainText(text)
      onContentChange?.(html)
      onSave?.(html, title)
    },
    onCreate: ({ editor }) => {
      const text = editor.getText()
      setPlainText(text)
      if (text) {
        checkGrammarImmediately(text);
      }
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

  // Only update title when switching to a different document (by documentId)
  // This prevents the feedback loop that was resetting the title on every keystroke
  useEffect(() => {
    console.log('[DocumentEditor] Document changed. Setting title from initialDocument:', initialDocument.title)
    if (initialDocument.title) {
      setTitle(initialDocument.title)
    }
  }, [documentId, initialDocument.title]) // Include initialDocument.title to satisfy linter but effect behavior unchanged since documentId changes trigger this

  // **PHASE 8.2: CRITICAL FIX** - Synchronize editor content with external changes (version restore)
  useEffect(() => {
    console.log('[DocumentEditor] Phase 8.2: Checking for content synchronization')
    console.log('[DocumentEditor] Current editor content length:', editor?.getHTML()?.length || 0)
    console.log('[DocumentEditor] New initialDocument content length:', initialDocument.content?.length || 0)
    
    if (!editor || editor.isDestroyed) {
      console.log('[DocumentEditor] Editor not ready for content sync')
      return
    }

    // Get current editor content for comparison
    const currentContent = editor.getHTML()
    const newContent = initialDocument.content || ''
    
    // Skip update if content is the same (prevent unnecessary operations)
    if (currentContent === newContent) {
      console.log('[DocumentEditor] Content unchanged, skipping sync')
      return
    }

    // Check if user is actively typing (prevent interrupting user input)
    const isUserTyping = editor.isFocused && Date.now() - (editor.state.selection.from || 0) < 1000
    if (isUserTyping) {
      console.log('[DocumentEditor] User is actively typing, delaying content sync')
      // Retry after a short delay to avoid interrupting user
      const timeoutId = setTimeout(() => {
        if (editor && !editor.isDestroyed && editor.getHTML() !== newContent) {
          console.log('[DocumentEditor] Retrying content sync after typing delay')
          editor.commands.setContent(newContent, false) // false = don't emit update events
          
          // Update plainText state for grammar checking
          const newPlainText = editor.getText()
          setPlainText(newPlainText)
          if (newPlainText) {
            checkGrammarImmediately(newPlainText)
          }
        }
      }, 500)
      return () => clearTimeout(timeoutId)
    }

    // Apply content synchronization
    console.log('[DocumentEditor] Applying content synchronization')
    console.log('[DocumentEditor] Before sync - Editor content:', currentContent.substring(0, 100) + (currentContent.length > 100 ? '...' : ''))
    console.log('[DocumentEditor] Before sync - New content:', newContent.substring(0, 100) + (newContent.length > 100 ? '...' : ''))
    
    try {
      // Preserve cursor position if possible
      const currentSelection = editor.state.selection
      
      // Update editor content (false = don't trigger update events to prevent auto-save conflicts)
      editor.commands.setContent(newContent, false)
      
      // Try to restore cursor position (best effort)
      if (currentSelection && currentSelection.from <= editor.state.doc.content.size) {
        editor.commands.setTextSelection(Math.min(currentSelection.from, editor.state.doc.content.size))
      }
      
      // Update plainText state for grammar checking
      const newPlainText = editor.getText()
      setPlainText(newPlainText)
      
      // Trigger grammar check on restored content
      if (newPlainText) {
        console.log('[DocumentEditor] Triggering grammar check on restored content')
        checkGrammarImmediately(newPlainText)
      }
      
      console.log('[DocumentEditor] Content synchronization completed successfully')
      console.log('[DocumentEditor] After sync - Editor content length:', editor.getHTML().length)
      
    } catch (error) {
      console.error('[DocumentEditor] Error during content synchronization:', error)
      // Fallback: try setting content without preserving selection
      try {
        editor.commands.setContent(newContent, false)
        console.log('[DocumentEditor] Fallback content sync successful')
      } catch (fallbackError) {
        console.error('[DocumentEditor] Fallback content sync also failed:', fallbackError)
      }
    }
  }, [editor, initialDocument.content, checkGrammarImmediately]) // Watch for content changes

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const { tr } = editor.state;
      console.log('[DocumentEditor] Setting grammarErrors meta:', errors);
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
                setContextMenu({ error: errorAtCursor });
            }
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, errors]);


  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <input
        type="text"
        value={title}
        onChange={(e) => {
          console.log('[DocumentEditor] Title changed by user:', e.target.value)
          setTitle(e.target.value)
        }}
        onBlur={() => {
          console.log('[DocumentEditor] Title input blurred. Saving title:', title)
          onSave?.(editor?.getHTML() || '', title)
        }}
        className="text-2xl font-bold p-2 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none"
        aria-label="Document Title"
      />
      <div onContextMenu={handleContextMenuCapture} className="flex-grow">
        <ContextMenuPrimitive.Root onOpenChange={(open) => !open && setContextMenu(null)}>
          <ContextMenuPrimitive.Trigger asChild>
            <EditorContent editor={editor} className="flex-grow overflow-y-auto p-4 h-full" />
          </ContextMenuPrimitive.Trigger>
          {contextMenu?.error && (
            <ContextMenuContent>
              <ContextMenuLabel className="text-gray-500">{contextMenu.error.explanation}</ContextMenuLabel>
              <ContextMenuSeparator />
              {contextMenu.error.suggestions?.map((suggestion, index) => (
                <ContextMenuItem key={index} onSelect={() => handleApplySuggestion(contextMenu.error, suggestion)}>
                  {suggestion}
                </ContextMenuItem>
              ))}
              {contextMenu.error.suggestions?.length === 0 && (
                  <ContextMenuItem disabled>No suggestions available</ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => handleIgnoreError(contextMenu.error)}>Ignore</ContextMenuItem>
              <ContextMenuItem onSelect={() => handleAddToDictionary(contextMenu.error)}>
                Add to Dictionary
              </ContextMenuItem>
            </ContextMenuContent>
          )}
        </ContextMenuPrimitive.Root>
      </div>
      <DocumentStatusBar
        wordCount={getWordCount(editor.getText())}
        characterCount={getCharacterCount(editor.getText())}
        saveStatus={isChecking ? { status: 'checking' } : saveStatus}
      />
    </div>
  )
}
