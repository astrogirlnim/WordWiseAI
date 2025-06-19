'use client'

import type React from 'react'
import { useState, useCallback, useEffect, useMemo } from 'react'
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

// Phase 6: Document Pagination
const PAGE_SIZE_CHARS = 5000 // As per optimization checklist

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

  // Phase 6: Pagination State
  const [fullContentHtml, setFullContentHtml] = useState(initialDocument.content || '')
  const [currentPage, setCurrentPage] = useState(1)

  const { totalPages, pageContent, pageOffset } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(fullContentHtml.length / PAGE_SIZE_CHARS))
    const safeCurrentPage = Math.min(currentPage, totalPages)
    const start = (safeCurrentPage - 1) * PAGE_SIZE_CHARS
    const end = Math.min(start + PAGE_SIZE_CHARS, fullContentHtml.length)
    const pageContent = fullContentHtml.substring(start, end)
    return { totalPages, pageContent, pageOffset: start }
  }, [fullContentHtml, currentPage])
  
  // We need plain text of the full document for the grammar checker
  const fullPlainText = useMemo(() => {
      if (typeof window === 'undefined') return ''
      // This is a bit of a hack to get plain text without a visible editor instance.
      // It's not ideal for performance but necessary for the grammar checker.
      const div = document.createElement('div')
      div.innerHTML = fullContentHtml
      return div.textContent || ''
  }, [fullContentHtml])

  const visibleRange = useMemo(() => ({
    start: pageOffset,
    end: pageOffset + pageContent.length,
  }), [pageOffset, pageContent]);

  const { user } = useAuth()
  // Phase 6: Pass visibleRange to the grammar checker hook
  const { errors, isChecking, removeError, checkGrammarImmediately } = useGrammarChecker(
    documentId, 
    fullPlainText,
    visibleRange
  )

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
    content: pageContent, // Use paginated content
    onUpdate: ({ editor }) => {
      const newPageHtml = editor.getHTML()
      
      // Reconstruct full content
      const oldPageEndIndex = pageOffset + pageContent.length
      const updatedFullContent = 
        fullContentHtml.substring(0, pageOffset) + 
        newPageHtml + 
        fullContentHtml.substring(oldPageEndIndex)
        
      setFullContentHtml(updatedFullContent)

      onContentChange?.(updatedFullContent)
      onSave?.(updatedFullContent, title)
    },
    onCreate: ({ editor }) => {
      const text = editor.getText()
      // Initial grammar check for the first page
      if (text) {
        checkGrammarImmediately(fullPlainText); // Still check full text, but triggered by page load
      }
    },
  })

  // Phase 6: Page change handler
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }, [totalPages])

  // Effect to update editor content when page changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
        const currentEditorContent = editor.getHTML()
        if (currentEditorContent !== pageContent) {
            console.log(`[DocumentEditor] Page changed to ${currentPage}. Updating editor content.`)
            editor.commands.setContent(pageContent, false) // `false` to avoid triggering onUpdate
        }
    }
  }, [pageContent, editor, currentPage])

  const handleApplySuggestion = useCallback(
    (error: GrammarError, suggestion: string) => {
      if (!editor || !user) return

      // Adjust error positions to be relative to the current page
      const relativeStart = error.start - pageOffset
      const relativeEnd = error.end - pageOffset

      // Check if the error is on the current page
      if (relativeStart < 0 || relativeEnd > editor.state.doc.content.size) {
          console.warn(`[DocumentEditor] Attempted to apply suggestion for an error not on the current page. Error ID: ${error.id}`)
          // Future enhancement: automatically switch to the page with the error.
          return
      }

      let replacementRange = { from: relativeStart, to: relativeEnd }

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
        // After applying suggestion, the content is updated, onUpdate will trigger a full re-check
        // We pass the full plain text to ensure context is always up-to-date
        checkGrammarImmediately(fullPlainText)
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
    [editor, user, documentId, removeError, pageOffset, pageContent, checkGrammarImmediately, fullPlainText],
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
  // **ADAPTED FOR PHASE 6 (PAGINATION)**
  useEffect(() => {
    console.log('[DocumentEditor] Phase 8.2: Checking for content synchronization')
    
    const newContent = initialDocument.content || ''

    if (fullContentHtml === newContent) {
        console.log('[DocumentEditor] Full content unchanged, skipping sync')
        return
    }

    console.log('[DocumentEditor] New initialDocument content detected. Updating full content state.')
    setFullContentHtml(newContent)
    setCurrentPage(1) // Reset to first page on document change

  }, [initialDocument.content, documentId])


  useEffect(() => {
    if (editor && !editor.isDestroyed) {
        const relativeErrors = errors
            .map(error => {
                const start = error.start - pageOffset;
                const end = error.end - pageOffset;

                // Only include errors that are on the current page and within the page's content bounds
                if (start >= 0 && end <= editor.state.doc.content.size) {
                    // We need to pass the original error in the data-error-json for context menu actions
                    const pageRelativeError = { 
                        ...error, 
                        start, 
                        end,
                    };
                    return pageRelativeError
                }
                return null;
            })
            .filter((e): e is GrammarError => e !== null);

        const { tr } = editor.state;
        // Pass the errors that are relative to the current page to the extension
        tr.setMeta('grammarErrors', relativeErrors);
        editor.view.dispatch(tr);
    }
  }, [errors, editor, pageOffset])

  const [wordCount, setWordCount] = useState(0)
  const [characterCount, setCharacterCount] = useState(0)

  useEffect(() => {
    setWordCount(getWordCount(fullPlainText))
    setCharacterCount(getCharacterCount(fullPlainText))
  }, [fullPlainText])

  if (!editor) {
    return null
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onSave?.(fullContentHtml, title)}
          className="w-full bg-transparent text-3xl font-bold focus:outline-none"
          placeholder="Untitled Document"
        />
      </div>
      <ContextMenuPrimitive.Root>
        <ContextMenuPrimitive.Trigger>
          <div
            className="prose prose-sm dark:prose-invert max-w-none flex-grow overflow-y-auto p-8 focus:outline-none"
            onClick={() => editor.chain().focus().run()}
            onContextMenuCapture={handleContextMenuCapture}
          >
            <EditorContent editor={editor} />
          </div>
        </ContextMenuPrimitive.Trigger>
        {contextMenu && (
          <ContextMenuContent>
            <ContextMenuLabel>
              Spelling: "{contextMenu.error.error}"
            </ContextMenuLabel>
            {contextMenu.error.suggestions.map((suggestion, index) => (
              <ContextMenuItem
                key={index}
                onSelect={() => handleApplySuggestion(contextMenu.error, suggestion)}
              >
                Accept: "{suggestion}"
              </ContextMenuItem>
            ))}
            {contextMenu.error.suggestions.length > 0 && <ContextMenuSeparator />}
            <ContextMenuItem onSelect={() => handleIgnoreError(contextMenu.error)}>
              Ignore
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleAddToDictionary(contextMenu.error)}>
              Add to Dictionary
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenuPrimitive.Root>

      <DocumentStatusBar
        saveStatus={saveStatus}
        wordCount={wordCount}
        characterCount={characterCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
