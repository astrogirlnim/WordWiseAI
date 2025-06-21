'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * Hook for managing markdown preview functionality
 * Detects markdown syntax and provides preview state management
 */
export function useMarkdownPreview(plainTextContent: string) {
  console.log('[useMarkdownPreview] Hook initialized with plain text length:', plainTextContent.length)
  
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

  // Detect markdown syntax in content
  const detectMarkdown = useCallback((text: string): boolean => {
    console.log('[useMarkdownPreview] Detecting markdown in text length:', text.length)
    
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
    console.log('[useMarkdownPreview] Markdown score:', markdownScore, 'Has markdown:', hasMarkdown)
    return hasMarkdown
  }, [markdownPatterns])

  // Update markdown detection when content changes
  useEffect(() => {
    console.log('[useMarkdownPreview] Content changed, updating markdown detection')
    setIsMarkdownDetected(detectMarkdown(plainTextContent))
  }, [plainTextContent, detectMarkdown])

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