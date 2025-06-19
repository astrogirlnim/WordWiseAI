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
import { Button } from '@/components/ui/button'
import { AlertTriangle, Search, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { GrammarError } from '@/types/grammar'
import { useAuth } from '@/lib/auth-context'
import { AuditService, AuditEvent } from '@/services/audit-service'
import { useMarkdownPreview } from '@/hooks/use-markdown-preview'
import { MarkdownPreviewPanel } from './markdown-preview-panel'
import { MarkdownPreviewToggle } from './markdown-preview-toggle'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

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

  // Phase 6.1: Full Document Check State
  const [isFullDocCheckDialogOpen, setIsFullDocCheckDialogOpen] = useState(false)
  const [isFullDocumentChecking, setIsFullDocumentChecking] = useState(false)

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
  const { errors, removeError, checkGrammarImmediately, checkFullDocument } = useGrammarChecker(
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
        placeholder: 'Start writing your masterpiece...',
      }),
      GrammarExtension,
    ],
    content: pageContent, // Use paginated content
    onUpdate: ({ editor }) => {
      const newPageHtml = editor.getHTML();
      setFullContentHtml(prevFullContentHtml => {
        const oldPageEndIndex = pageOffset + pageContent.length;
        const updatedFullContent =
          prevFullContentHtml.substring(0, pageOffset) +
          newPageHtml +
          prevFullContentHtml.substring(oldPageEndIndex);

        console.log('[DocumentEditor] onUpdate (fixed): updatedFullContent.length:', updatedFullContent.length);
        if (onContentChange) onContentChange(updatedFullContent);
        if (onSave) onSave(updatedFullContent, title);
        return updatedFullContent;
      });
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

  // **PHASE 6.1 SUBFEATURE 4: Full Document Check**
  const handleFullDocumentCheck = useCallback(async () => {
    console.log('[DocumentEditor] Phase 6.1: Starting full document grammar check');
    setIsFullDocumentChecking(true);
    setIsFullDocCheckDialogOpen(false);
    
    try {
      // Use the specialized full document check function
      await checkFullDocument(fullPlainText);
      console.log('[DocumentEditor] Phase 6.1: Full document check completed');
    } catch (error) {
      console.error('[DocumentEditor] Phase 6.1: Full document check failed:', error);
    } finally {
      setIsFullDocumentChecking(false);
      // After full document check, return to page-scoped checking
      setTimeout(() => {
        console.log('[DocumentEditor] Phase 6.1: Returning to page-scoped checking');
        checkGrammarImmediately(fullPlainText);
      }, 1000);
    }
  }, [fullPlainText, checkFullDocument, checkGrammarImmediately]);

  const handleFullDocumentCheckConfirm = useCallback(() => {
    handleFullDocumentCheck();
  }, [handleFullDocumentCheck]);

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
    [editor, user, documentId, removeError, pageOffset, checkGrammarImmediately, fullPlainText],
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
    console.log('[DocumentEditor] Phase 8.2: Previous fullContentHtml length:', fullContentHtml.length)
    console.log('[DocumentEditor] Phase 8.2: New content length:', newContent.length)
    
    setFullContentHtml(newContent)
    setCurrentPage(1) // Reset to first page on document change

    // **CRITICAL FIX**: Ensure editor content is immediately synchronized after state update
    // This fixes version restore by forcing editor content update after fullContentHtml changes
    setTimeout(() => {
      if (editor && !editor.isDestroyed) {
        const newPageContent = newContent.substring(0, Math.min(PAGE_SIZE_CHARS, newContent.length))
        const currentEditorContent = editor.getHTML()
        
        console.log('[DocumentEditor] Phase 8.2: Forcing editor content update for version restore')
        console.log('[DocumentEditor] Phase 8.2: Current editor content length:', currentEditorContent.length)
        console.log('[DocumentEditor] Phase 8.2: New page content length:', newPageContent.length)
        
        if (currentEditorContent !== newPageContent) {
          console.log('[DocumentEditor] Phase 8.2: Updating editor content with restored version')
          editor.commands.setContent(newPageContent, false) // false to avoid triggering onUpdate
        } else {
          console.log('[DocumentEditor] Phase 8.2: Editor content already matches, no update needed')
        }
      } else {
        console.warn('[DocumentEditor] Phase 8.2: Editor not available for content sync')
      }
    }, 0) // Use setTimeout to ensure state update completes before editor update

  }, [initialDocument.content, documentId, editor]) // eslint-disable-next-line react-hooks/exhaustive-deps -- fullContentHtml intentionally excluded to prevent editor reset on every keystroke. This effect should only run on external changes (version restore, document switch).

  // **PHASE 6.1 SUBFEATURE 3: Reliable Error-to-Editor Sync**
  // Enhanced error synchronization with comprehensive debug logging
  useEffect(() => {
    console.log(`[DocumentEditor] Phase 6.1: Error sync triggered. Total errors: ${errors.length}, Page offset: ${pageOffset}`);
    
    if (!editor || editor.isDestroyed) {
      console.warn('[DocumentEditor] Phase 6.1: Editor not available or destroyed, skipping error sync');
      return;
    }

    console.log(`[DocumentEditor] Phase 6.1: Editor available, document size: ${editor.state.doc.content.size}`);
    
    const relativeErrors = errors
        .map((error, index) => {
            // BUGFIX: Improved position conversion with validation
            const start = error.start - pageOffset;
            const end = error.end - pageOffset;

            console.log(`[DocumentEditor] BUGFIX: Processing error ${index + 1}/${errors.length} - ID: ${error.id}`);
            console.log(`[DocumentEditor] BUGFIX: Original positions: ${error.start}-${error.end}, Page offset: ${pageOffset}`);
            console.log(`[DocumentEditor] BUGFIX: Calculated relative positions: ${start}-${end}, Editor doc size: ${editor.state.doc.content.size}`);

            // Enhanced validation: check if error is on current page and positions are valid
            const isOnCurrentPage = start >= 0 && end <= editor.state.doc.content.size && start < end;
            const isValidRange = end > start && start >= 0;
            
            if (isOnCurrentPage && isValidRange) {
                // Get the actual text at these positions to verify alignment
                const actualText = editor.state.doc.textBetween(start, end);
                console.log(`[DocumentEditor] BUGFIX: Expected text: "${error.error}", Actual text: "${actualText}"`);
                
                // Flexible text matching: exact, trimmed, or containment
                const exactMatch = actualText === error.error;
                const trimmedMatch = actualText.trim() === error.error.trim();
                const containsMatch = actualText.includes(error.error) || error.error.includes(actualText);
                
                if (exactMatch) {
                    console.log(`[DocumentEditor] BUGFIX: ✓ Exact text alignment perfect for error ${error.id}`);
                } else if (trimmedMatch) {
                    console.log(`[DocumentEditor] BUGFIX: ✓ Trimmed text alignment confirmed for error ${error.id}`);
                } else if (containsMatch && Math.abs(actualText.length - error.error.length) <= 2) {
                    console.log(`[DocumentEditor] BUGFIX: ✓ Partial text alignment confirmed for error ${error.id}`);
                } else {
                    console.warn(`[DocumentEditor] BUGFIX: ⚠️ Text mismatch for error ${error.id} - but including anyway for debugging`);
                }

                const pageRelativeError = { 
                    ...error, 
                    start, 
                    end,
                };
                console.log(`[DocumentEditor] BUGFIX: ✓ Including error ${error.id} on current page at ${start}-${end}`);
                return pageRelativeError;
            } else {
                console.log(`[DocumentEditor] BUGFIX: ✗ Excluding error ${error.id} - not on current page or invalid range (${start}, ${end})`);
                return null;
            }
        })
        .filter((e): e is GrammarError => e !== null);

    console.log(`[DocumentEditor] BUGFIX: Filtered ${relativeErrors.length} page-relative errors from ${errors.length} total errors`);

    // **PHASE 6.1: Always dispatch errors to ensure GrammarExtension receives updates**
    const { tr } = editor.state;
    tr.setMeta('grammarErrors', relativeErrors);
    
    console.log(`[DocumentEditor] BUGFIX: Dispatching ${relativeErrors.length} errors to GrammarExtension`);
    
    try {
      editor.view.dispatch(tr);
      console.log('[DocumentEditor] BUGFIX: ✓ Successfully dispatched errors to editor');
    } catch (error) {
      console.error('[DocumentEditor] BUGFIX: ✗ Failed to dispatch errors to editor:', error);
    }
  }, [errors, editor, pageOffset])

  const [wordCount, setWordCount] = useState(0)
  const [characterCount, setCharacterCount] = useState(0)

  useEffect(() => {
    setWordCount(getWordCount(fullPlainText))
    setCharacterCount(getCharacterCount(fullPlainText))
  }, [fullPlainText])

  // Handle paste event to trigger grammar check and save
  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    console.log('[DocumentEditor] handlePaste: Paste event detected')
    console.log('[DocumentEditor] handlePaste: Current document state - fullContentHtml length:', fullContentHtml.length)
    console.log('[DocumentEditor] handlePaste: Current page offset:', pageOffset, 'Page content length:', pageContent.length)
    console.log('[DocumentEditor] handlePaste: Document ID:', documentId)
    
    // Let the paste happen, then trigger grammar check and save after a short delay
    setTimeout(() => {
      if (!editor) {
        console.warn('[DocumentEditor] handlePaste: Editor not available, aborting paste processing')
        return
      }
      
      const newPageHtml = editor.getHTML()
      console.log('[DocumentEditor] handlePaste: New page HTML length after paste:', newPageHtml.length)
      console.log('[DocumentEditor] handlePaste: New page HTML preview:', JSON.stringify(newPageHtml.substring(0, 100)))
      
      // Use the same logic as onUpdate to reconstruct the full document
      setFullContentHtml(prevFullContentHtml => {
        const oldPageEndIndex = pageOffset + pageContent.length
        const updatedFullContent =
          prevFullContentHtml.substring(0, pageOffset) +
          newPageHtml +
          prevFullContentHtml.substring(oldPageEndIndex)
        
        console.log('[DocumentEditor] handlePaste: Document reconstruction completed')
        console.log('[DocumentEditor] handlePaste: Previous full content length:', prevFullContentHtml.length)
        console.log('[DocumentEditor] handlePaste: Updated full content length:', updatedFullContent.length)
        console.log('[DocumentEditor] handlePaste: Content change detected:', prevFullContentHtml !== updatedFullContent)
        
        // Get plain text for grammar checking
        const div = document.createElement('div')
        div.innerHTML = updatedFullContent
        const plainText = div.textContent || ''
        console.log('[DocumentEditor] handlePaste: Plain text length for grammar check:', plainText.length)
        
        // Trigger content change callback
        if (onContentChange) {
          console.log('[DocumentEditor] handlePaste: Calling onContentChange callback')
          onContentChange(updatedFullContent)
        } else {
          console.warn('[DocumentEditor] handlePaste: onContentChange callback not available')
        }
        
        // Trigger save callback  
        if (onSave) {
          console.log('[DocumentEditor] handlePaste: Calling onSave callback with content length:', updatedFullContent.length, 'title:', title)
          onSave(updatedFullContent, title)
        } else {
          console.warn('[DocumentEditor] handlePaste: onSave callback not available')
        }
        
        // Trigger grammar check immediately
        console.log('[DocumentEditor] handlePaste: Triggering immediate grammar check')
        checkGrammarImmediately(plainText)
        
        return updatedFullContent
      })
    }, 10) // 10ms delay to let the paste finish
  }, [editor, pageOffset, pageContent.length, onContentChange, onSave, title, checkGrammarImmediately, fullContentHtml, documentId])

  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null)

  // **MARKDOWN PREVIEW FUNCTIONALITY**
  // Get plain text content from editor for markdown preview
  const [editorPlainText, setEditorPlainText] = useState('')
  
  // Update plain text when editor content changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const plainText = editor.getText()
      console.log('[DocumentEditor] Updating editor plain text, length:', plainText.length)
      setEditorPlainText(plainText)
    }
  }, [editor, fullContentHtml]) // Update when HTML content changes

  console.log('[DocumentEditor] Initializing markdown preview with plain text length:', editorPlainText.length)
  const {
    isPreviewOpen,
    setIsPreviewOpen,
    previewContent,
    isMarkdownDetected,
    togglePreview,
  } = useMarkdownPreview(editorPlainText) // Use plain text instead of HTML

  console.log('[DocumentEditor] Markdown preview state:', {
    isPreviewOpen,
    isMarkdownDetected,
    previewContentLength: previewContent.length
  })

  // **PHASE 6 PAGINATION LOGIC**

  if (!editor) {
    return null
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Award-winning header with sophisticated styling */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-retro-primary/10 to-retro-sunset/10 border border-retro-primary/20">
              <FileText className="h-5 w-5 text-retro-primary" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => onSave?.(fullContentHtml, title)}
              className="flex-1 bg-transparent text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200 focus:text-retro-primary"
              placeholder="Untitled Document"
            />
          </div>
          
          {/* Markdown Preview Toggle */}
          <div className="flex items-center gap-2">
            <MarkdownPreviewToggle
              isPreviewOpen={isPreviewOpen}
              isMarkdownDetected={isMarkdownDetected}
              onToggle={togglePreview}
              className="mr-2"
            />
          </div>
          
          {/* Enhanced full document check button */}
          <div className="flex items-center gap-3">
            <Dialog open={isFullDocCheckDialogOpen} onOpenChange={setIsFullDocCheckDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isFullDocumentChecking}
                  className="flex items-center gap-2 font-medium"
                >
                  <Search className="h-4 w-4" />
                  {isFullDocumentChecking ? 'Checking...' : 'Full Document Check'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Full Document Grammar Check
                  </DialogTitle>
                  <DialogDescription className="space-y-3">
                    <p>
                      You&apos;re about to perform a grammar check on the entire document ({Math.ceil(fullPlainText.length / 1000)}k characters).
                    </p>
                    <div className="awwwards-card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-800 dark:text-amber-200">Rate Limit Warning</p>
                          <p className="text-amber-700 dark:text-amber-300 mt-1">
                            This may trigger rate limits and could take several minutes. 
                            Consider checking smaller sections instead.
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      After completion, the system will return to checking only the visible page.
                    </p>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFullDocCheckDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleFullDocumentCheckConfirm}>
                    Check Full Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Award-winning editor area with sophisticated styling and markdown preview support */}
      <div className="flex-1 overflow-hidden">
        {isPreviewOpen ? (
          /* Split layout with resizable panels */
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Editor Panel */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <ContextMenuPrimitive.Root>
                <ContextMenuPrimitive.Trigger>
                  <div
                    className="award-winning-editor h-full focus-within:shadow-lg transition-all duration-300"
                    onClick={() => editor.chain().focus().run()}
                    onContextMenuCapture={handleContextMenuCapture}
                    onPaste={handlePaste}
                  >
                    <div className="prose prose-lg dark:prose-invert max-w-none h-full overflow-y-auto px-6 py-8 focus:outline-none">
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </ContextMenuPrimitive.Trigger>
                {contextMenu && (
                  <ContextMenuContent className="awwwards-card min-w-[200px]">
                    <ContextMenuLabel className="text-retro-primary font-medium">
                      Spelling: &quot;{contextMenu.error.error}&quot;
                    </ContextMenuLabel>
                    {contextMenu.error.suggestions.map((suggestion, index) => (
                      <ContextMenuItem
                        key={index}
                        onSelect={() => handleApplySuggestion(contextMenu.error, suggestion)}
                        className="font-medium"
                      >
                        Accept: &quot;{suggestion}&quot;
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
            </ResizablePanel>
            
            {/* Resizable Handle */}
            <ResizableHandle withHandle />
            
            {/* Markdown Preview Panel */}
            <ResizablePanel defaultSize={40} minSize={25}>
              <MarkdownPreviewPanel
                content={previewContent}
                isVisible={isPreviewOpen}
                className="h-full"
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Single editor layout */
          <ContextMenuPrimitive.Root>
            <ContextMenuPrimitive.Trigger>
              <div
                className="award-winning-editor h-full m-6 focus-within:shadow-lg transition-all duration-300"
                onClick={() => editor.chain().focus().run()}
                onContextMenuCapture={handleContextMenuCapture}
                onPaste={handlePaste}
              >
                <div className="prose prose-lg dark:prose-invert max-w-none h-full overflow-y-auto px-12 py-10 focus:outline-none">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </ContextMenuPrimitive.Trigger>
            {contextMenu && (
              <ContextMenuContent className="awwwards-card min-w-[200px]">
                <ContextMenuLabel className="text-retro-primary font-medium">
                  Spelling: &quot;{contextMenu.error.error}&quot;
                </ContextMenuLabel>
                {contextMenu.error.suggestions.map((suggestion, index) => (
                  <ContextMenuItem
                    key={index}
                    onSelect={() => handleApplySuggestion(contextMenu.error, suggestion)}
                    className="font-medium"
                  >
                    Accept: &quot;{suggestion}&quot;
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
        )}
      </div>

      {/* Enhanced status bar */}
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
