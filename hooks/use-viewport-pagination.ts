import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface ViewportPaginationOptions {
  containerHeight: number
  lineHeight: number
  padding: number
  charWidth: number
}

interface ViewportPaginationResult {
  totalPages: number
  currentPage: number
  setCurrentPage: (page: number) => void
  pageContent: string
  pageOffset: number
  visibleRange: { start: number; end: number }
  estimatedLinesPerPage: number
  handlePageChange: (newPage: number) => void
}

/**
 * Custom hook for viewport-based pagination
 * Calculates page size based on actual screen height rather than fixed character count
 */
export function useViewportPagination(
  fullContent: string,
  initialPage: number = 1
): ViewportPaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [containerHeight, setContainerHeight] = useState(600) // Default fallback
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate viewport dimensions and estimated content capacity
  const paginationConfig = useMemo(() => {
    // Constants for text measurement (approximate values for typical editor styling)
    const lineHeight = 24 // px - typical line height for prose text
    const padding = 32 // px - top and bottom padding combined
    const charWidth = 8 // px - approximate character width
    const wordsPerLine = Math.floor((typeof window !== 'undefined' ? window.innerWidth : 800) * 0.6 / (charWidth * 6)) // Estimate ~6 chars per word
    
    const availableHeight = containerHeight - padding
    const estimatedLinesPerPage = Math.floor(availableHeight / lineHeight)
    const estimatedCharsPerPage = estimatedLinesPerPage * wordsPerLine * 6 // 6 chars per word average
    
    console.log('[useViewportPagination] Calculated pagination config:', {
      containerHeight,
      availableHeight,
      estimatedLinesPerPage,
      estimatedCharsPerPage,
      wordsPerLine
    })
    
    return {
      lineHeight,
      padding,
      charWidth,
      estimatedLinesPerPage,
      estimatedCharsPerPage
    }
  }, [containerHeight])

  // Measure container height using ResizeObserver
  useEffect(() => {
    if (typeof window === 'undefined') return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height
        console.log('[useViewportPagination] Container height changed:', newHeight)
        setContainerHeight(newHeight)
      }
    })

    // Find the editor container automatically
    const editorContainer = document.querySelector('.prose.prose-lg')
    if (editorContainer) {
      resizeObserver.observe(editorContainer)
      
      // Set initial height
      const initialHeight = editorContainer.getBoundingClientRect().height
      if (initialHeight > 0) {
        setContainerHeight(initialHeight)
      }
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Calculate pagination based on content and viewport
  const { totalPages, pageContent, pageOffset, visibleRange } = useMemo(() => {
    const { estimatedCharsPerPage } = paginationConfig
    
    if (!fullContent.length) {
      return {
        totalPages: 1,
        pageContent: '',
        pageOffset: 0,
        visibleRange: { start: 0, end: 0 }
      }
    }

    // Calculate total pages based on estimated chars per page
    const totalPages = Math.max(1, Math.ceil(fullContent.length / estimatedCharsPerPage))
    const safeCurrentPage = Math.min(currentPage, totalPages)
    
    // Calculate page boundaries
    const start = (safeCurrentPage - 1) * estimatedCharsPerPage
    const end = Math.min(start + estimatedCharsPerPage, fullContent.length)
    const pageContent = fullContent.substring(start, end)
    
    console.log('[useViewportPagination] Page calculation:', {
      fullContentLength: fullContent.length,
      estimatedCharsPerPage,
      totalPages,
      currentPage: safeCurrentPage,
      pageStart: start,
      pageEnd: end,
      pageContentLength: pageContent.length
    })

    return {
      totalPages,
      pageContent,
      pageOffset: start,
      visibleRange: { start, end }
    }
  }, [fullContent, currentPage, paginationConfig])

  // Handle page changes with bounds checking
  const handlePageChange = useCallback((newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages))
    console.log('[useViewportPagination] Page change requested:', newPage, 'Clamped to:', clampedPage)
    setCurrentPage(clampedPage)
  }, [totalPages])

  // Reset to first page when content changes significantly
  useEffect(() => {
    if (currentPage > totalPages) {
      console.log('[useViewportPagination] Current page exceeds total pages, resetting to page 1')
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  return {
    totalPages,
    currentPage,
    setCurrentPage,
    pageContent,
    pageOffset,
    visibleRange,
    estimatedLinesPerPage: paginationConfig.estimatedLinesPerPage,
    handlePageChange
  }
}

/**
 * Hook to measure text content height for more accurate pagination
 * This can be used as an enhancement to get more precise page sizing
 */
export function useTextHeightMeasurement() {
  const measureTextHeight = useCallback((text: string, styles: CSSStyleDeclaration): number => {
    if (typeof window === 'undefined') return 0
    
    // Create a temporary div to measure text height
    const measureDiv = document.createElement('div')
    measureDiv.style.position = 'absolute'
    measureDiv.style.visibility = 'hidden'
    measureDiv.style.height = 'auto'
    measureDiv.style.width = styles.width || '100%'
    measureDiv.style.fontSize = styles.fontSize || '14px'
    measureDiv.style.lineHeight = styles.lineHeight || '1.6'
    measureDiv.style.fontFamily = styles.fontFamily || 'Inter, sans-serif'
    measureDiv.style.padding = styles.padding || '32px'
    measureDiv.innerHTML = text.replace(/\n/g, '<br>')

    document.body.appendChild(measureDiv)
    const height = measureDiv.getBoundingClientRect().height
    document.body.removeChild(measureDiv)

    return height
  }, [])

  return { measureTextHeight }
}