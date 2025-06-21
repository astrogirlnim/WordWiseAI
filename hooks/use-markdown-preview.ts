'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { debounce } from 'lodash'

// Phase 2.2: Reduced debounce for real-time markdown preview
const MARKDOWN_PREVIEW_DEBOUNCE = 100; // ms - Phase 2.2: 100ms for real-time responsiveness

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

  // Phase 2.2: Removed typing lock check for markdown preview
  // Preview should update in real-time regardless of typing status

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
   * Debounced markdown detection - REDUCED debounce for real-time preview
   * Phase 2.2: Preview should update in real-time, only lightly debounced
   */
  const debouncedDetectMarkdown = useMemo(() => debounce((text: string) => {
    console.log('[useMarkdownPreview] Phase 2.2: Starting markdown detection for real-time preview');
    
    // Phase 2.2: REMOVED typing lock check - preview should update in real-time
    // Markdown detection is lightweight and should not be blocked by typing
    
    const detected = detectMarkdown(text);
    setIsMarkdownDetected(detected);
    console.log('[useMarkdownPreview] Phase 2.2: Markdown detection completed, detected:', detected);
  }, 100), [detectMarkdown]) // Phase 2.2: Reduced to 100ms for responsiveness

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