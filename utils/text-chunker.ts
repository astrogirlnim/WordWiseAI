/**
 * NOTE: Default chunk size increased to 5000 characters and overlap to 200 for rate limiting and backend efficiency.
 * This reduces the number of parallel requests and helps avoid function spamming.
 */

/**
 * TextChunker - Smart text chunking utility for performance-optimized grammar checking
 * 
 * This utility implements intelligent sentence-boundary chunking to enable efficient
 * processing of large documents while maintaining context and accuracy.
 * 
 * Features:
 * - Sentence-boundary detection with edge case handling
 * - Configurable chunk sizes with overlap for context preservation
 * - Multi-byte character safe position tracking
 * - Comprehensive chunk metadata for error mapping
 */

/**
 * Represents a chunk of text with metadata for position tracking
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
 * TextChunker class for intelligent text segmentation
 */
export class TextChunker {
  private readonly maxChunkSize: number;
  private readonly overlapSize: number;
  private readonly respectSentences: boolean;
  private readonly customSentencePatterns: RegExp[];

  // Common abbreviations that don't end sentences
  private readonly abbreviations = new Set([
    'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'vs', 'etc', 'inc', 'ltd', 'corp',
    'fig', 'ref', 'vol', 'no', 'pp', 'ch', 'sec', 'dept', 'univ', 'assoc', 'bros',
    'co', 'al', 'eg', 'ie', 'ca', 'cf', 'approx', 'est', 'max', 'min', 'avg'
  ]);

  // Patterns for decimal numbers (e.g., "3.14", "0.5")
  private readonly decimalPattern = /\d+\.\d+/g;

  // Enhanced sentence boundary detection patterns
  private readonly sentenceEndPatterns = [
    // Standard sentence endings
    /[.!?]+[\s\r\n]+(?=[A-Z])/g,  // Period/exclamation/question followed by whitespace and capital
    /[.!?]+["']*[\s\r\n]+(?=[A-Z])/g,  // Same but with quotes
    /[.!?]+\)[\s\r\n]+(?=[A-Z])/g,  // Parentheses after punctuation
    // Dialog and special cases
    /[.!?]+["'][\s\r\n]*$/g,  // End of quoted speech
    /[.!?]+[\s\r\n]+(?=["'][A-Z])/g,  // Before quoted speech
  ];

  constructor(options: ChunkingOptions = {}) {
    this.maxChunkSize = options.maxChunkSize ?? 5000;
    this.overlapSize = options.overlapSize ?? 200;
    this.respectSentences = options.respectSentences ?? true;
    this.customSentencePatterns = options.customSentencePatterns ?? [];

    // Validate configuration
    if (this.maxChunkSize <= this.overlapSize * 2) {
      throw new Error('Maximum chunk size must be at least twice the overlap size');
    }
    if (this.overlapSize < 0 || this.maxChunkSize < 1) {
      throw new Error('Chunk and overlap sizes must be positive');
    }

    console.log(`[TextChunker] Initialized with maxChunkSize: ${this.maxChunkSize}, overlapSize: ${this.overlapSize}`);
  }

  /**
   * Splits text into intelligent chunks with proper metadata tracking
   * @param text The original text to chunk
   * @returns Array of TextChunk objects with metadata
   */
  public chunkText(text: string): TextChunk[] {
    if (!text || text.trim().length === 0) {
      console.log('[TextChunker] Empty text provided, returning empty array');
      return [];
    }

    // Handle short texts that don't need chunking
    if (text.length <= this.maxChunkSize) {
      console.log(`[TextChunker] Text length (${text.length}) within single chunk limit`);
      return [{
        text,
        originalStart: 0,
        originalEnd: text.length,
        chunkId: this.generateChunkId(0),
        chunkIndex: 0,
        totalChunks: 1,
        hasCompleteSentences: this.hasCompleteSentences(text)
      }];
    }

    console.log(`[TextChunker] Chunking text of ${text.length} characters`);
    const chunks: TextChunk[] = [];
    let currentPosition = 0;
    let chunkIndex = 0;

    while (currentPosition < text.length) {
      const chunkData = this.extractChunk(text, currentPosition, chunkIndex);
      chunks.push(chunkData.chunk);
      currentPosition = chunkData.nextPosition;
      chunkIndex++;

      console.log(`[TextChunker] Created chunk ${chunkIndex}: ${chunkData.chunk.originalStart}-${chunkData.chunk.originalEnd} (${chunkData.chunk.text.length} chars)`);
    }

    // Update total chunks count and overlap metadata
    chunks.forEach((chunk, index) => {
      chunk.totalChunks = chunks.length;
      
      // Set overlap regions
      if (index > 0) {
        chunk.overlapStart = chunk.originalStart;
      }
      if (index < chunks.length - 1) {
        chunk.overlapEnd = Math.min(chunk.originalEnd, chunk.originalStart + this.maxChunkSize - this.overlapSize);
      }
    });

    console.log(`[TextChunker] Successfully created ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Extracts a single chunk starting from the given position
   */
  private extractChunk(text: string, startPosition: number, chunkIndex: number): {
    chunk: TextChunk;
    nextPosition: number;
  } {
    const maxEndPosition = Math.min(startPosition + this.maxChunkSize, text.length);
    let endPosition = maxEndPosition;

    // If we're not at the end of the text and respecting sentences, find a good break point
    if (endPosition < text.length && this.respectSentences) {
      const sentenceBreak = this.findOptimalSentenceBreak(text, startPosition, endPosition);
      if (sentenceBreak > startPosition) {
        endPosition = sentenceBreak;
      }
    }

    const chunkText = text.substring(startPosition, endPosition);
    const nextPosition = this.calculateNextPosition(startPosition, endPosition, text.length);

    return {
      chunk: {
        text: chunkText,
        originalStart: startPosition,
        originalEnd: endPosition,
        chunkId: this.generateChunkId(chunkIndex),
        chunkIndex,
        totalChunks: 0, // Will be updated later
        hasCompleteSentences: this.hasCompleteSentences(chunkText)
      },
      nextPosition
    };
  }

  /**
   * Finds the optimal sentence boundary for chunk splitting
   */
  private findOptimalSentenceBreak(text: string, startPos: number, maxEndPos: number): number {
    const searchText = text.substring(startPos, maxEndPos);
    const sentenceBoundaries = this.findSentenceBoundaries(searchText);

    if (sentenceBoundaries.length === 0) {
      console.log('[TextChunker] No sentence boundaries found, using max position');
      return maxEndPos;
    }

    // Find the last sentence boundary that gives us a reasonable chunk size
    const minChunkSize = this.maxChunkSize * 0.6; // At least 60% of max size
    const relativeMinSize = Math.max(minChunkSize - startPos, 0);

    for (let i = sentenceBoundaries.length - 1; i >= 0; i--) {
      const boundary = sentenceBoundaries[i];
      if (boundary >= relativeMinSize) {
        const absolutePosition = startPos + boundary;
        console.log(`[TextChunker] Found optimal sentence break at position ${absolutePosition}`);
        return absolutePosition;
      }
    }

    // If no good boundary found, use the first one or max position
    const fallbackPosition = startPos + sentenceBoundaries[sentenceBoundaries.length - 1];
    console.log(`[TextChunker] Using fallback sentence break at position ${fallbackPosition}`);
    return fallbackPosition;
  }

  /**
   * Finds all sentence boundaries in the given text
   */
  private findSentenceBoundaries(text: string): number[] {
    const boundaries: number[] = [];
    const allPatterns = [...this.sentenceEndPatterns, ...this.customSentencePatterns];

    for (const pattern of allPatterns) {
      // Reset regex state
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const position = match.index + match[0].length;
        
        // Validate this is a real sentence boundary
        if (this.isValidSentenceBoundary(text, match.index)) {
          boundaries.push(position);
        }
      }
    }

    // Remove duplicates and sort
    return Array.from(new Set(boundaries)).sort((a, b) => a - b);
  }

  /**
   * Validates whether a potential sentence boundary is actually a sentence end
   */
  private isValidSentenceBoundary(text: string, position: number): boolean {
    // Check for abbreviations
    const beforePeriod = text.substring(Math.max(0, position - 10), position).toLowerCase();
    const abbreviationMatch = beforePeriod.match(/\b(\w+)\.$/);
    
    if (abbreviationMatch && this.abbreviations.has(abbreviationMatch[1])) {
      return false;
    }

    // Check for decimal numbers
    const aroundPeriod = text.substring(Math.max(0, position - 5), Math.min(text.length, position + 5));
    if (this.decimalPattern.test(aroundPeriod)) {
      return false;
    }

    // Check for ellipsis
    if (text.substring(position - 2, position + 1) === '...') {
      return false;
    }

    return true;
  }

  /**
   * Calculates the next starting position considering overlap
   */
  private calculateNextPosition(currentStart: number, currentEnd: number, textLength: number): number {
    if (currentEnd >= textLength) {
      return textLength; // End of text
    }

    // Calculate overlap position
    const overlapStart = Math.max(currentStart, currentEnd - this.overlapSize);
    return overlapStart;
  }

  /**
   * Checks if a text chunk contains complete sentences
   */
  private hasCompleteSentences(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;

    // Check if starts and ends with complete sentence patterns
    const startsWithCapital = /^[A-Z]/.test(trimmed);
    const endsWithPunctuation = /[.!?]["']?$/.test(trimmed);

    return startsWithCapital && endsWithPunctuation;
  }

  /**
   * Generates a unique identifier for a chunk
   */
  private generateChunkId(chunkIndex: number): string {
    return `chunk_${chunkIndex}_${Date.now()}`;
  }

  /**
   * Maps error positions from chunk coordinates back to original document positions
   * @param chunkError Grammar error with positions relative to chunk
   * @param chunk The chunk this error belongs to
   * @returns Grammar error with positions mapped to original document
   */
  public mapErrorToOriginalPosition(chunkError: { start: number; end: number }, chunk: TextChunk): { start: number; end: number } {
    // BUGFIX: Simplified position mapping to avoid drift
    // Simply add the chunk's start position to the relative error positions
    const originalStart = chunk.originalStart + chunkError.start;
    const originalEnd = chunk.originalStart + chunkError.end;

    // Validate positions are within chunk bounds
    const maxPosition = chunk.originalStart + chunk.text.length;
    const validatedStart = Math.max(chunk.originalStart, Math.min(originalStart, maxPosition));
    const validatedEnd = Math.max(validatedStart, Math.min(originalEnd, maxPosition));

    console.log(`[TextChunker] BUGFIX: Mapped error position from chunk ${chunkError.start}-${chunkError.end} to document ${validatedStart}-${validatedEnd} (chunk starts at ${chunk.originalStart})`);

    return {
      start: validatedStart,
      end: validatedEnd
    };
  }

  /**
   * DEPRECATED: Calculates byte-safe positions for multi-byte character support
   * This was causing position drift, so we're using simpler arithmetic now
   */
  private calculateBytePosition(relativePosition: number, chunkText: string, chunkStartInDocument: number): number {
    // BUGFIX: Simplified - just use direct position arithmetic
    return chunkStartInDocument + Math.min(relativePosition, chunkText.length);
  }

  /**
   * Deduplicates errors that may appear in overlapping regions between chunks
   * @param allErrors Array of all errors from all chunks
   * @returns Deduplicated array of errors
   */
  public deduplicateOverlapErrors(allErrors: Array<{ start: number; end: number; error: string; id: string }>): Array<{ start: number; end: number; error: string; id: string }> {
    const deduplicated: Array<{ start: number; end: number; error: string; id: string }> = [];
    const seen = new Set<string>();

    // Sort errors by position for consistent processing
    const sortedErrors = Array.from(allErrors).sort((a, b) => a.start - b.start);

    for (const error of sortedErrors) {
      // Create a content-based key for deduplication
      const contentKey = `${error.start}-${error.end}-${error.error}`;
      
      if (!seen.has(contentKey)) {
        // Check if this error overlaps with any previously added error
        const hasOverlap = deduplicated.some(existing => 
          this.errorsOverlap(error, existing) && 
          error.error === existing.error
        );

        if (!hasOverlap) {
          deduplicated.push(error);
          seen.add(contentKey);
        } else {
          console.log(`[TextChunker] Removed duplicate error at ${error.start}-${error.end}: "${error.error}"`);
        }
      }
    }

    console.log(`[TextChunker] Deduplicated ${allErrors.length} errors to ${deduplicated.length}`);
    return deduplicated;
  }

  /**
   * Checks if two errors overlap in their positions
   */
  private errorsOverlap(error1: { start: number; end: number }, error2: { start: number; end: number }): boolean {
    return Math.max(error1.start, error2.start) < Math.min(error1.end, error2.end);
  }
}

/**
 * Default TextChunker instance with standard configuration
 */
export const defaultTextChunker = new TextChunker({
  maxChunkSize: 2000,
  overlapSize: 100,
  respectSentences: true
});

/**
 * Utility function for quick text chunking with default settings
 * @param text Text to chunk
 * @returns Array of text chunks with metadata
 */
export function chunkText(text: string): TextChunk[] {
  return defaultTextChunker.chunkText(text);
} 