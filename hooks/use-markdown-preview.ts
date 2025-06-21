'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { debounce } from 'lodash'

// Phase 2: Add debounce delay for markdown preview
const MARKDOWN_PREVIEW_DEBOUNCE = 500; // ms - Phase 2: 500ms debounce

/**
 * Hook for managing markdown preview functionality
 * Phase 2: Enhanced with debouncing and typing lock detection
 */
export function useMarkdownPreview(
  plainTextContent: string, 
  contentCoordinatorRef?: React.RefObject<any> // Phase 2: Add coordinator reference
) {
  console.log('[useMarkdownPreview] Phase 2: Hook initialized with plain text length:', plainTextContent.length)
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isMarkdownDetected, setIsMarkdownDetected] = useState(false)

  // Comprehensive markdown detection patterns
  const markdownPatterns = useMemo(() => [
    /^#{1,6}\s+.+$/m,                    // Headers: # ## ### etc.
    /^\s*[-*+]\s+.+$/m,                  // Unordered lists: - * +
    /^\s*\d+\.\s+.+$/m,                  // Ordered lists: 1. 2. etc.
    /\*\*[^*]+\*\*/,                     // Bold: **text**
    /\*[^*]+\*/,                         // Italic: *text*
    /`[^`]+`/,                           // Inline code: `code`
    /```[\s\S]*?```/,                    // Code blocks: ```code```
    /^\s*>\s+.+$/m,                      // Blockquotes: > text
    /\[.+\]\(.+\)/,                      // Links: [text](url)
    /!\[.*\]\(.+\)/,                     // Images: ![alt](url)
    /^\s*\|.+\|$/m,                      // Tables: |col1|col2|
    /^\s*[-=]{3,}$/m,                    // Horizontal rules: --- or ===
    /~~[^~]+~~/,                         // Strikethrough: ~~text~~
    /^\s*- \[[x ]\]\s+.+$/m,            // Task lists: - [x] done, - [ ] todo
    /\[.+\]:\s*.+$/m,                    // Reference links: [ref]: url
  ], [])

  /**
   * Check if user is currently typing using EditorContentCoordinator
   * Phase 2: Respect typing lock to prevent interference with user input
   */
  const isUserTyping = useCallback((): boolean => {
    if (!contentCoordinatorRef?.current) {
      console.log('[useMarkdownPreview] Phase 2: No coordinator available, assuming not typing');
      return false;
    }
    
    const state = contentCoordinatorRef.current.getState();
    const typing = state.isUserTyping || state.isProcessingUpdate;
    
    return typing;
  }, [contentCoordinatorRef]);

  // Detect markdown syntax in content
  const detectMarkdown = useCallback((text: string): boolean => {
    console.log('[useMarkdownPreview] Phase 2: Detecting markdown in text length:', text.length)
    
    if (!text.trim()) {
      console.log('[useMarkdownPreview] Empty text, no markdown detected')
      return false
    }

    // Check for markdown patterns
    for (const pattern of markdownPatterns) {
      if (pattern.test(text)) {
        console.log('[useMarkdownPreview] Markdown pattern detected:', pattern.source)
        return true
      }
    }

    // Additional heuristic: check for common markdown indicators
    const lines = text.split('\n')
    let markdownScore = 0

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Score various markdown features
      if (trimmedLine.startsWith('#')) markdownScore += 2
      if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*') || trimmedLine.startsWith('+')) markdownScore += 1
      if (/^\d+\./.test(trimmedLine)) markdownScore += 1
      if (trimmedLine.startsWith('>')) markdownScore += 1
      if (trimmedLine.includes('**') || trimmedLine.includes('*')) markdownScore += 0.5
      if (trimmedLine.includes('`')) markdownScore += 0.5
      if (trimmedLine.includes('[') && trimmedLine.includes('](')) markdownScore += 1
    }

    const hasMarkdown = markdownScore >= 2
    console.log('[useMarkdownPreview] Phase 2: Markdown score:', markdownScore, 'Has markdown:', hasMarkdown)
    return hasMarkdown
  }, [markdownPatterns])
  
  /**
   * Debounced markdown detection with typing lock check
   * Phase 2: Implement 500ms debounce and respect typing lock
   */
  const debouncedDetectMarkdown = useMemo(() => debounce((text: string) => {
    console.log('[useMarkdownPreview] Phase 2: Starting debounced markdown detection');
    
    // Phase 2: Check if user is currently typing - if so, skip detection
    if (isUserTyping()) {
      console.log('[useMarkdownPreview] Phase 2: User is typing, skipping markdown detection');
      return;
    }
    
    const detected = detectMarkdown(text);
    setIsMarkdownDetected(detected);
  }, MARKDOWN_PREVIEW_DEBOUNCE), [detectMarkdown, isUserTyping])

  // Update markdown detection when content changes (debounced)
  useEffect(() => {
    console.log('[useMarkdownPreview] Phase 2: Content changed, triggering debounced markdown detection')
    debouncedDetectMarkdown(plainTextContent)
    
    // Cleanup on unmount
    return () => {
      debouncedDetectMarkdown.cancel();
    }
  }, [plainTextContent, debouncedDetectMarkdown])

  // Toggle preview visibility
  const togglePreview = useCallback(() => {
    console.log('[useMarkdownPreview] Toggling preview from', isPreviewOpen, 'to', !isPreviewOpen)
    setIsPreviewOpen((prev: boolean) => !prev)
  }, [isPreviewOpen])

  // Auto-open preview when markdown is detected
  useEffect(() => {
    if (isMarkdownDetected && !isPreviewOpen) {
      console.log('[useMarkdownPreview] Auto-opening preview due to markdown detection')
      // Optionally auto-open preview (can be made configurable)
      // setIsPreviewOpen(true)
    }
  }, [isMarkdownDetected, isPreviewOpen])

  console.log('[useMarkdownPreview] Hook state:', {
    isPreviewOpen,
    isMarkdownDetected,
    previewContentLength: plainTextContent.length
  })

  return {
    isPreviewOpen,
    setIsPreviewOpen,
    previewContent: plainTextContent, // Return the plain text directly for markdown rendering
    isMarkdownDetected,
    togglePreview,
  }
}