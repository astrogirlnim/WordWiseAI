'use client';

/**
 * Harper.js Grammar Wrapper - Phase 2: Harper.js Integration
 * 
 * This wrapper utility provides a clean interface for Harper.js grammar checking
 * that integrates with our existing grammar error types and TipTap editor.
 * 
 * Key Features:
 * - Maps Harper.js Lint objects to our GrammarError interface
 * - Handles WASM module initialization and error handling
 * - Provides debounced grammar checking for performance
 * - Supports local, privacy-first grammar checking
 * - No network requests or external API dependencies
 * 
 * Phase 2 Implementation Notes:
 * - Harper.js processes text locally using WebAssembly
 * - Provides sub-100ms grammar checking performance
 * - Eliminates rate limiting issues from Phase 1
 * - Maintains compatibility with existing TipTap decorations
 */

import type { GrammarError } from '@/types/grammar';

// Dynamic import for Harper.js to handle WASM loading in Next.js
let harperModule: any = null;
let harperLinter: any = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Track all Harper.js lint_kind values we encounter for analysis
const detectedHarperCategories = new Set<string>();

/**
 * Harper.js error categories mapped to our grammar error types
 */
const HARPER_ERROR_TYPE_MAP: Record<string, GrammarError['type']> = {
  'Spelling': 'spelling',
  'Grammar': 'grammar',
  'Style': 'style',
  'Capitalization': 'grammar',
  'Punctuation': 'punctuation',
  'Clarity': 'clarity',
  'Redundancy': 'style',
  'WordChoice': 'style',
  'Repetition': 'style',
  'Readability': 'clarity',
  'Formatting': 'style',
  'Miscellaneous': 'grammar',
} as const;

/**
 * Initialize Harper.js WASM module
 * This handles the asynchronous loading of the WebAssembly binary
 */
async function initializeHarper(): Promise<void> {
  // Ensure this only runs in the browser
  if (typeof window === 'undefined') {
    console.warn('[HarperWrapper] Phase 2: Attempted to initialize on the server. Skipping.');
    return;
  }
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;

  console.log('[HarperWrapper] Phase 2: Initializing Harper.js WASM module...');

  initializationPromise = (async () => {
    try {
      // Dynamic import to handle WASM loading in Next.js environment
      const { binary, LocalLinter, Dialect } = await import('harper.js');
      
      console.log('[HarperWrapper] Phase 2: Harper.js module loaded, setting up binary...');
      
      // Setup the WASM binary. It will fetch the wasm file from the root,
      // so we have placed harper_wasm_bg.wasm in the /public directory.
      await binary.setup();
      
      console.log('[HarperWrapper] Phase 2: Harper.js binary ready, creating linter...');
      
      // Create a linter instance with American English dialect
      harperLinter = await binary.createLinter(Dialect.American);
      
      console.log('[HarperWrapper] Phase 2: Harper.js linter created successfully');
      
      // Store the module reference
      harperModule = { binary, LocalLinter, Dialect };
      isInitialized = true;
      
      console.log('[HarperWrapper] Phase 2: ✅ Harper.js initialization complete');
    } catch (error) {
      console.error('[HarperWrapper] Phase 2: ❌ Failed to initialize Harper.js:', error);
      // Reset state on error so we can retry
      isInitialized = false;
      initializationPromise = null;
      harperLinter = null;
      harperModule = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Convert Harper.js Lint object to our GrammarError interface
 */
function convertHarperLintToGrammarError(lint: any, index: number): GrammarError {
  const span = lint.span();
  const suggestions = lint.suggestions();
  const lintKind = lint.lint_kind();
  
  // Track this category for analysis
  detectedHarperCategories.add(lintKind);
  
  // Log the original Harper.js lint_kind for analysis
  console.log(`[HarperWrapper] Phase 4: Raw Harper lint_kind: "${lintKind}"`);
  
  // Map Harper.js lint kind to our error type
  const errorType = HARPER_ERROR_TYPE_MAP[lintKind] || 'grammar';
  
  // Log any unmapped categories
  if (!HARPER_ERROR_TYPE_MAP[lintKind]) {
    console.warn(`[HarperWrapper] Phase 4: ⚠️ UNMAPPED Harper lint_kind: "${lintKind}" - defaulting to 'grammar'`);
  }
  
  console.log(`[HarperWrapper] Phase 4: Converting Harper lint - Kind: "${lintKind}" → Type: "${errorType}", Span: ${span.start}-${span.end}`);
  
  return {
    id: `harper-${Date.now()}-${index}`, // Generate unique ID
    start: span.start,
    end: span.end,
    error: lint.get_problem_text(),
    suggestions: suggestions.map((suggestion: any) => suggestion.text),
    explanation: lint.message(),
    type: errorType,
    shownAt: Date.now(),
  };
}

/**
 * Check grammar using Harper.js
 * 
 * @param text - The text to check for grammar errors
 * @param options - Optional configuration for the grammar check
 * @returns Promise<GrammarError[]> - Array of grammar errors found
 */
export async function checkGrammarWithHarper(
  text: string,
  options: {
    language?: 'plaintext' | 'markdown';
    minTextLength?: number;
  } = {}
): Promise<GrammarError[]> {
  const { language = 'plaintext', minTextLength = 10 } = options;
  
  console.log(`[HarperWrapper] Phase 2: Starting grammar check - Text length: ${text.length}, Language: ${language}`);
  
  // Skip very short text
  if (text.length < minTextLength) {
    console.log(`[HarperWrapper] Phase 2: Text too short (${text.length} < ${minTextLength}), skipping check`);
    return [];
  }

  try {
    // Ensure Harper.js is initialized
    await initializeHarper();
    
    if (!harperLinter) {
      console.error('[HarperWrapper] Phase 2: Harper linter not available after initialization');
      return [];
    }

    console.log('[HarperWrapper] Phase 2: Running Harper.js lint on text...');
    const startTime = performance.now();
    
    // Run Harper.js linting
    const lints = await harperLinter.lint(text, { language });
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`[HarperWrapper] Phase 2: ✅ Harper.js lint completed in ${duration}ms - Found ${lints.length} issues`);
    
    // Convert Harper lints to our GrammarError format
    const grammarErrors = lints.map((lint: any, index: number) => 
      convertHarperLintToGrammarError(lint, index)
    );
    
    console.log(`[HarperWrapper] Phase 2: ✅ Converted ${grammarErrors.length} Harper lints to grammar errors`);
    
    return grammarErrors;
    
  } catch (error) {
    console.error('[HarperWrapper] Phase 2: ❌ Error during Harper.js grammar check:', error);
    
    // Return empty array on error to maintain compatibility
    return [];
  }
}

/**
 * Apply a grammar suggestion to text using Harper.js
 * 
 * @param text - The original text
 * @param error - The grammar error containing the suggestion
 * @param suggestionIndex - Which suggestion to apply (default: 0)
 * @returns Promise<string> - The text with the suggestion applied
 */
export async function applySuggestionWithHarper(
  text: string, 
  error: GrammarError, 
  suggestionIndex: number = 0
): Promise<string> {
  console.log(`[HarperWrapper] Phase 2: Applying suggestion ${suggestionIndex} for error ${error.id}`);
  
  try {
    // Ensure Harper.js is initialized
    await initializeHarper();
    
    if (!harperLinter) {
      console.error('[HarperWrapper] Phase 2: Harper linter not available for suggestion application');
      return text;
    }

    // For now, implement simple text replacement
    // TODO: In Phase 3, we can enhance this with Harper's applySuggestion method
    const suggestion = error.suggestions[suggestionIndex];
    if (!suggestion) {
      console.warn(`[HarperWrapper] Phase 2: No suggestion at index ${suggestionIndex}`);
      return text;
    }

    const before = text.substring(0, error.start);
    const after = text.substring(error.end);
    const correctedText = before + suggestion + after;
    
    console.log(`[HarperWrapper] Phase 2: ✅ Applied suggestion "${suggestion}" for error "${error.error}"`);
    
    return correctedText;
    
  } catch (error) {
    console.error('[HarperWrapper] Phase 2: ❌ Error applying Harper.js suggestion:', error);
    return text;
  }
}

/**
 * Get Harper.js initialization status
 */
export function getHarperStatus(): {
  isInitialized: boolean;
  isInitializing: boolean;
  hasModule: boolean;
  hasLinter: boolean;
} {
  return {
    isInitialized,
    isInitializing: initializationPromise !== null && !isInitialized,
    hasModule: harperModule !== null,
    hasLinter: harperLinter !== null,
  };
}

/**
 * Reset Harper.js state (useful for testing or error recovery)
 */
export function resetHarperState(): void {
  console.log('[HarperWrapper] Phase 2: Resetting Harper.js state');
  
  isInitialized = false;
  initializationPromise = null;
  harperLinter = null;
  harperModule = null;
}

/**
 * Pre-warm Harper.js for faster first-use
 * This can be called during app initialization to reduce latency
 */
export async function preWarmHarper(): Promise<boolean> {
  console.log('[HarperWrapper] Phase 2: Pre-warming Harper.js...');
  
  try {
    await initializeHarper();
    console.log('[HarperWrapper] Phase 2: ✅ Harper.js pre-warmed successfully');
    return true;
  } catch (error) {
    console.error('[HarperWrapper] Phase 2: ❌ Harper.js pre-warm failed:', error);
    return false;
  }
}

/**
 * Get analysis data about Harper.js category coverage
 * This helps verify that our error type mapping is comprehensive
 */
export function getHarperCategoryAnalysis(): {
  detectedCategories: string[];
  mappedCategories: string[];
  unmappedCategories: string[];
  totalCategoriesDetected: number;
  mappingCoverage: number;
} {
  const detectedArray = Array.from(detectedHarperCategories);
  const mappedCategories = detectedArray.filter(cat => HARPER_ERROR_TYPE_MAP[cat]);
  const unmappedCategories = detectedArray.filter(cat => !HARPER_ERROR_TYPE_MAP[cat]);
  
  return {
    detectedCategories: detectedArray,
    mappedCategories,
    unmappedCategories,
    totalCategoriesDetected: detectedArray.length,
    mappingCoverage: detectedArray.length > 0 ? (mappedCategories.length / detectedArray.length) * 100 : 100,
  };
} 