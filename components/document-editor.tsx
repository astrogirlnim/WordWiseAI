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
import { useAISuggestions } from '@/hooks/use-ai-suggestions'
import type { AISuggestion } from '@/types/ai-features'

// Phase 6: Document Pagination
const PAGE_SIZE_CHARS = 5000 // As per optimization checklist

interface DocumentEditorProps {
  documentId: string
  initialDocument?: Partial<Document>
  onSave?: (content: string, title: string) => void
  onContentChange?: (content: string) => void
  saveStatus: AutoSaveStatus
  onAISuggestionsChange?: (suggestions: AISuggestion[]) => void

}

export function DocumentEditor({
  documentId,
  initialDocument = { content: '', title: 'Untitled Document' },
  onSave,
  onContentChange,
  saveStatus,
  onAISuggestionsChange,

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

  // AI Suggestions integration
  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    applySuggestion,
    dismissSuggestion,
    suggestionCount
  } = useAISuggestions({
    documentId,
    autoSubscribe: true
  })

  console.log(`[DocumentEditor] AI Suggestions state:`, {
    suggestionCount,
    loading: suggestionsLoading,
    error: !!suggestionsError
  })

  // Notify parent component about AI suggestions changes
  useEffect(() => {
    console.log(`[DocumentEditor] AI suggestions changed, notifying parent:`, suggestions.length)
    if (onAISuggestionsChange) {
      onAISuggestionsChange(suggestions)
    }
  }, [suggestions, onAISuggestionsChange])





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

  /**
   * Apply an AI suggestion to the document
   */
  const handleApplyAISuggestion = useCallback(async (suggestion: AISuggestion) => {
    if (!editor || !user) {
      console.warn('[DocumentEditor] Cannot apply AI suggestion - missing editor or user');
      return;
    }
    
    console.log('[DocumentEditor] handleApplyAISuggestion called', suggestion);
    
    // Prevent repeated application by checking if already applied
    if (suggestion.status === 'applied') {
      console.warn('[DocumentEditor] Suggestion already applied, skipping', suggestion.id);
      return;
    }
    
    try {
      const originalText = suggestion.originalText;
      const suggestedText = suggestion.suggestedText;
      const suggestionType = suggestion.type;
      
      console.log('[DocumentEditor] Applying suggestion:', {
        id: suggestion.id,
        type: suggestionType,
        title: suggestion.title,
        hasOriginalText: !!originalText,
        suggestedTextLength: suggestedText?.length || 0,
        status: suggestion.status
      });
      
      console.log('[DocumentEditor] Current fullContentHtml (first 500 chars):', fullContentHtml.slice(0, 500));
      let textReplaced = false;
      let updatedContent = fullContentHtml;
      
      // Determine if this is a funnel suggestion (headline, subheadline, cta, outline)
      const funnelTypes = ['headline', 'subheadline', 'cta', 'outline'];
      const isFunnelSuggestion = funnelTypes.includes(suggestionType);
      
      if (!originalText || originalText.trim() === '' || isFunnelSuggestion) {
        // Funnel suggestion: insert at strategic positions with deduplication
        console.log('[DocumentEditor] Processing funnel suggestion');
        
        // Check if this type of suggestion already exists in the document to prevent duplicates
        // Only check for funnel types that have specific markers
        type FunnelSuggestionType = 'headline' | 'subheadline' | 'cta' | 'outline';
        
        const existingMarkers: Record<FunnelSuggestionType, RegExp> = {
          headline: /^#\s+.+$/m,
          subheadline: /^##\s+.+$/m,
          cta: /\*\*[^*]+\*\*\s*$/m,
          outline: /^\d+\.\s+.+:/m
        };
        
        // Only check for existing markers if this is a funnel suggestion type
        const isFunnelType = (type: string): type is FunnelSuggestionType => {
          return ['headline', 'subheadline', 'cta', 'outline'].includes(type);
        };
        
        if (isFunnelType(suggestionType)) {
          const existingMarker = existingMarkers[suggestionType];
          if (existingMarker && existingMarker.test(fullContentHtml)) {
            console.log(`[DocumentEditor] ${suggestionType} already exists, replacing instead of adding`);
            
            // Replace existing content of same type
            if (suggestionType === 'headline') {
              updatedContent = fullContentHtml.replace(/^#\s+.+$/m, `# ${suggestedText}`);
            } else if (suggestionType === 'subheadline') {
              updatedContent = fullContentHtml.replace(/^##\s+.+$/m, `## ${suggestedText}`);
            } else if (suggestionType === 'cta') {
              updatedContent = fullContentHtml.replace(/\*\*[^*]+\*\*\s*$/m, `**${suggestedText}**`);
            } else if (suggestionType === 'outline') {
              // Replace existing outline
              const outlineRegex = /^\d+\.\s+.+$/gm;
              updatedContent = fullContentHtml.replace(outlineRegex, '').trim() + '\n\n' + suggestedText;
            }
            textReplaced = true;
          } else {
            // Insert new content at appropriate position
            textReplaced = insertFunnelSuggestionContent(suggestionType, suggestedText, fullContentHtml);
          }
        } else {
          // For non-funnel suggestions, just insert the content
          textReplaced = insertFunnelSuggestionContent(suggestionType as FunnelSuggestionType, suggestedText, fullContentHtml);
        }
        
        // Helper function to insert funnel suggestion content
        function insertFunnelSuggestionContent(type: string, text: string, content: string): boolean {
          let insertPosition = 0;
          let insertText = text;
          
          if (type === 'headline') {
            // Headlines go at the very beginning
            insertPosition = 0;
            insertText = `# ${text}\n\n`;
            updatedContent = insertText + content;
          } else if (type === 'subheadline') {
            // Subheadlines go after any existing headline
            const headlineMatch = content.match(/^#\s+.+?\n/m);
            if (headlineMatch) {
              insertPosition = headlineMatch.index! + headlineMatch[0].length;
              insertText = `## ${text}\n\n`;
              updatedContent = content.slice(0, insertPosition) + insertText + content.slice(insertPosition);
            } else {
              insertPosition = 0;
              insertText = `## ${text}\n\n`;
              updatedContent = insertText + content;
            }
          } else if (type === 'cta') {
            // CTAs go at the end of the document
            insertText = `\n\n**${text}**`;
            updatedContent = content + insertText;
          } else if (type === 'outline') {
            // Outlines go after headlines/subheadlines but before main content
            const headerEndMatch = content.match(/^#{1,6}\s+.+?\n+/gm);
            if (headerEndMatch && headerEndMatch.length > 0) {
              const lastHeader = headerEndMatch[headerEndMatch.length - 1];
              const lastHeaderIndex = content.lastIndexOf(lastHeader);
              insertPosition = lastHeaderIndex + lastHeader.length;
              insertText = `${text}\n\n`;
              updatedContent = content.slice(0, insertPosition) + insertText + content.slice(insertPosition);
            } else {
              insertPosition = 0;
              insertText = `${text}\n\n`;
              updatedContent = insertText + content;
            }
          }
          return true;
        }
        
        console.log('[DocumentEditor] Applied funnel suggestion:', {
          type: suggestionType,
          contentLengthBefore: fullContentHtml.length,
          contentLengthAfter: updatedContent.length,
          textReplaced
        });
        
      } else if (originalText && suggestedText) {
        // Style suggestion: replace original text with suggested text
        console.log('[DocumentEditor] Processing style suggestion with originalText:', originalText.substring(0, 100));
        
        if (fullContentHtml.includes(originalText)) {
          console.log('[DocumentEditor] Found original text in full document HTML, replacing...');
          updatedContent = fullContentHtml.replace(originalText, suggestedText);
          textReplaced = true;
          console.log('[DocumentEditor] Successfully replaced text in document');
        } else {
          console.warn('[DocumentEditor] Could not find original text in document for style suggestion:', {
            originalText: originalText.substring(0, 100),
            fullContentPreview: fullContentHtml.slice(0, 200)
          });
          
          // Try partial matching for better results
          const words = originalText.split(' ');
          if (words.length > 2) {
            const partialText = words.slice(0, Math.floor(words.length / 2)).join(' ');
            if (fullContentHtml.includes(partialText)) {
              console.log('[DocumentEditor] Found partial match, replacing...');
              updatedContent = fullContentHtml.replace(partialText, suggestedText);
              textReplaced = true;
            }
          }
        }
      }
      
      // Update the document content if changes were made
      if (textReplaced && updatedContent !== fullContentHtml) {
        console.log('[DocumentEditor] Updating document content');
        setFullContentHtml(updatedContent);
        
        // Update editor content for current page
        const newPageContent = updatedContent.substring(pageOffset, Math.min(pageOffset + PAGE_SIZE_CHARS, updatedContent.length));
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(newPageContent, false);
        }
        
        // Apply suggestion in Firestore with correct type
        const applyType = isFunnelSuggestion ? 'funnel' : 'style';
        console.log('[DocumentEditor] Applying suggestion to Firestore with type:', applyType);
        await applySuggestion(suggestion.id, applyType);
        
        // Trigger grammar check and save
        const div = document.createElement('div');
        div.innerHTML = updatedContent;
        const plainText = div.textContent || '';
        checkGrammarImmediately(plainText);
        
        if (onSave) {
          onSave(updatedContent, title);
        }
        
        console.log('[DocumentEditor] Successfully applied suggestion and updated content');
        
        // Show success feedback
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('AI_SUGGESTION_SUCCESS', { 
            detail: { 
              suggestionId: suggestion.id,
              type: suggestionType,
              title: suggestion.title
            } 
          }));
        }
        
      } else {
        console.warn('[DocumentEditor] No text replacement occurred');
        
        // Still try to apply in Firestore to mark as applied
        const applyType = isFunnelSuggestion ? 'funnel' : 'style';
        await applySuggestion(suggestion.id, applyType);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('AI_SUGGESTION_WARNING', { 
            detail: { 
              suggestionId: suggestion.id,
              message: 'Suggestion marked as applied but content may not have changed'
            } 
          }));
        }
      }
      
    } catch (error) {
      console.error('[DocumentEditor] Error applying AI suggestion:', error);
      
      // Show user-friendly error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('AI_SUGGESTION_ERROR', { 
          detail: { 
            suggestionId: suggestion.id, 
            error: error instanceof Error ? error.message : 'Unknown error occurred while applying suggestion'
          } 
        }));
      }
      
      // Don't throw the error to prevent UI crashes
    }
  }, [editor, user, applySuggestion, checkGrammarImmediately, fullContentHtml, setFullContentHtml, onSave, title, pageOffset]);

  // Listen for AI suggestion apply events from the sidebar
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleAISuggestionApplyEvent = (event: CustomEvent) => {
      console.log('[DocumentEditor] Received AI_SUGGESTION_APPLY event:', event.detail);
      const suggestion = event.detail as AISuggestion
      if (suggestion) {
        handleApplyAISuggestion(suggestion)
      }
    }

    window.addEventListener('AI_SUGGESTION_APPLY', handleAISuggestionApplyEvent as EventListener)
    console.log('[DocumentEditor] Added AI_SUGGESTION_APPLY event listener')

    return () => {
      window.removeEventListener('AI_SUGGESTION_APPLY', handleAISuggestionApplyEvent as EventListener)
      console.log('[DocumentEditor] Removed AI_SUGGESTION_APPLY event listener')
    }
  }, [handleApplyAISuggestion])

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

  }, [initialDocument.content, documentId, editor, fullContentHtml])

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePaste = useCallback((_event: React.ClipboardEvent<HTMLDivElement>) => {
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

  // Return AI suggestion handlers along with other handlers
  const aiSuggestionHandlers = useMemo(() => ({
    suggestions,
    suggestionsLoading,
    suggestionsError,
    suggestionCount,
    handleApplyAISuggestion,
    handleDismissAISuggestion: dismissSuggestion
  }), [suggestions, suggestionsLoading, suggestionsError, suggestionCount, handleApplyAISuggestion, dismissSuggestion])

  console.log('[DocumentEditor] Exporting AI suggestion handlers:', {
    suggestionCount: aiSuggestionHandlers.suggestionCount,
    loading: aiSuggestionHandlers.suggestionsLoading,
    error: !!aiSuggestionHandlers.suggestionsError
  })

  // Add AI suggestion handlers to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - for debugging only
      window.documentEditorAISuggestions = aiSuggestionHandlers
    }
  }, [aiSuggestionHandlers])

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
                  <DialogDescription asChild>
                    <div className="space-y-3">
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
                    </div>
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

// Export AI suggestion handlers for external use
export type DocumentEditorAISuggestionHandlers = {
  suggestions: AISuggestion[]
  suggestionsLoading: boolean
  suggestionsError: string | null
  suggestionCount: number
  handleApplyAISuggestion: (suggestion: AISuggestion) => Promise<void>
  handleDismissAISuggestion: (suggestionId: string) => Promise<void>
}
