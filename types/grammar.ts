export interface GrammarError {
  id: string
  start: number
  end: number
  error: string
  suggestions: string[]
  explanation: string
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'punctuation'
  shownAt?: number
  // Additional metadata for chunked processing
  chunkId?: string
  originalChunkStart?: number
  originalChunkEnd?: number
}

/**
 * Extended grammar error interface for chunk processing
 */
export interface ChunkedGrammarError extends GrammarError {
  chunkId: string
  originalChunkStart: number
  originalChunkEnd: number
} 