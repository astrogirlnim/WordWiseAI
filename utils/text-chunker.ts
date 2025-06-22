/**
 * Phase 1: Text Chunker - DEPRECATED STUB IMPLEMENTATION
 * 
 * PHASE 1 STATUS: Legacy text chunking for AI grammar checking has been removed.
 * This file now contains stub implementations to maintain interface compatibility.
 * 
 * Previously: Smart text chunking utility for performance-optimized grammar checking
 * with sentence-boundary detection and position mapping for large documents.
 * 
 * TODO (Phase 2): Remove this file entirely after Harper.js integration is complete,
 * as Harper.js handles text processing locally without requiring chunking.
 */

/**
 * Represents a chunk of text with metadata for position tracking
 * @deprecated Phase 1: Removed with AI grammar checking
 */
export interface TextChunk {
  /** The actual text content of this chunk */
  text: string;
  /** Zero-based start position in the original document */
  originalStart: number;
  /** Zero-based end position in the original document (exclusive) */
  originalEnd: number;
  /** Unique identifier for this chunk */
  chunkId: string;
  /** Index of this chunk in the sequence (0-based) */
  chunkIndex: number;
  /** Total number of chunks in the document */
  totalChunks: number;
  /** Start position of overlap region with previous chunk */
  overlapStart?: number;
  /** End position of overlap region with next chunk */
  overlapEnd?: number;
  /** Whether this chunk contains sentence boundaries at its edges */
  hasCompleteSentences: boolean;
}

/**
 * Configuration options for text chunking
 * @deprecated Phase 1: Removed with AI grammar checking
 */
export interface ChunkingOptions {
  /** Maximum size of each chunk in characters (default: 2000) */
  maxChunkSize?: number;
  /** Number of characters to overlap between chunks (default: 100) */
  overlapSize?: number;
  /** Whether to respect sentence boundaries (default: true) */
  respectSentences?: boolean;
  /** Custom sentence boundary patterns (optional) */
  customSentencePatterns?: RegExp[];
}

/**
 * TextChunker class - Phase 1: Stub implementation
 * @deprecated Phase 1: Removed with AI grammar checking migration
 */
export class TextChunker {
  private readonly maxChunkSize: number;
  private readonly overlapSize: number;
  private readonly respectSentences: boolean;
  private readonly customSentencePatterns: RegExp[];

  constructor(options: ChunkingOptions = {}) {
    this.maxChunkSize = options.maxChunkSize ?? 5000;
    this.overlapSize = options.overlapSize ?? 200;
    this.respectSentences = options.respectSentences ?? true;
    this.customSentencePatterns = options.customSentencePatterns ?? [];

    console.log(`[TextChunker] Phase 1: Stub implementation initialized - chunking disabled`);
  }

  /**
   * Phase 1: Stub implementation - returns single chunk for interface compatibility
   * @param text The original text to chunk
   * @returns Array with single TextChunk object (no actual chunking performed)
   */
  public chunkText(text: string): TextChunk[] {
    console.log(`[TextChunker] Phase 1: Stub - chunkText called with ${text.length} characters, returning single chunk`);
    
    if (!text || text.trim().length === 0) {
      console.log('[TextChunker] Phase 1: Stub - empty text provided, returning empty array');
      return [];
    }

    // Phase 1: Always return text as single chunk - no actual chunking
    return [{
      text,
      originalStart: 0,
      originalEnd: text.length,
      chunkId: 'stub-chunk-0',
      chunkIndex: 0,
      totalChunks: 1,
      hasCompleteSentences: true // Assume complete for stub
    }];
  }

  /**
   * Phase 1: Stub implementation - returns positions unchanged
   * @param chunkError Error with chunk-relative positions
   * @param chunk TextChunk metadata
   * @returns Original positions (no mapping performed)
   */
  public mapErrorToOriginalPosition(
    chunkError: { start: number; end: number }, 
    chunk: TextChunk
  ): { start: number; end: number } {
    console.log(`[TextChunker] Phase 1: Stub - mapErrorToOriginalPosition called, returning positions unchanged`);
    
    // Phase 1: No position mapping needed since no chunking occurs
    return {
      start: chunkError.start,
      end: chunkError.end
    };
  }

  /**
   * Phase 1: Stub implementation - returns errors unchanged (no deduplication)
   * @param allErrors Array of errors to deduplicate
   * @returns Original errors array (no deduplication performed)
   */
  public deduplicateOverlapErrors(
    allErrors: Array<{ start: number; end: number; error: string; id: string }>
  ): Array<{ start: number; end: number; error: string; id: string }> {
    console.log(`[TextChunker] Phase 1: Stub - deduplicateOverlapErrors called with ${allErrors.length} errors, returning unchanged`);
    
    // Phase 1: No deduplication needed since no chunking/overlap occurs
    return allErrors;
  }
}

/**
 * Default TextChunker instance with standard configuration
 * @deprecated Phase 1: Removed with AI grammar checking
 */
export const defaultTextChunker = new TextChunker({
  maxChunkSize: 5000,
  overlapSize: 200,
  respectSentences: true
});

/**
 * Convenience function to chunk text using default configuration
 * @deprecated Phase 1: Removed with AI grammar checking
 * @param text Text to chunk
 * @returns Array of TextChunk objects (stub: always single chunk)
 */
export function chunkText(text: string): TextChunk[] {
  return defaultTextChunker.chunkText(text);
} 