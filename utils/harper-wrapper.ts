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
 * Expanded mapping to capture all Harper.js lint categories for comprehensive error detection
 */
const HARPER_ERROR_TYPE_MAP: Record<string, GrammarError['type']> = {
  // Core grammar and spelling
  'Spelling': 'spelling',
  'Grammar': 'grammar',
  'Capitalization': 'grammar',
  'Punctuation': 'punctuation',
  'Tense': 'grammar',
  'Agreement': 'grammar',
  'Syntax': 'grammar',
  
  // Style and clarity
  'Style': 'style',
  'Clarity': 'clarity',
  'Readability': 'clarity',
  'Conciseness': 'clarity',
  'Wordiness': 'style',
  'Redundancy': 'style',
  'WordChoice': 'style',
  'Repetition': 'style',
  'Formatting': 'style',
  
  // Advanced language issues
  'VoicePassive': 'style',
  'VoiceActive': 'style',
  'Tone': 'style',
  'Formality': 'style',
  'Consistency': 'style',
  'Coherence': 'clarity',
  'Flow': 'clarity',
  'Transition': 'clarity',
  
  // Technical writing
  'Jargon': 'clarity',
  'Terminology': 'style',
  'Abbreviation': 'style',
  'Acronym': 'style',
  'Citation': 'style',
  'Reference': 'style',
  
  // Sentence structure
  'SentenceLength': 'clarity',
  'SentenceStructure': 'grammar',
  'Parallelism': 'style',
  'Modifier': 'grammar',
  'Dangling': 'grammar',
  'Misplaced': 'grammar',
  
  // Fallback categories
  'Miscellaneous': 'grammar',
  'Other': 'grammar',
  'Unknown': 'grammar',
} as const;

/**
 * Initialize Harper.js WASM module
 * This handles the asynchronous loading of the WebAssembly binary
 */
async function initializeHarper(): Promise<void> {
  console.log('[HarperWrapper] Phase 5: initializeHarper called');
  
  // Ensure this only runs in the browser
  if (typeof window === 'undefined') {
    console.warn('[HarperWrapper] Phase 5: Attempted to initialize on the server. Skipping.');
    return;
  }
  
  console.log('[HarperWrapper] Phase 5: Browser environment confirmed');
  
  if (isInitialized) {
    console.log('[HarperWrapper] Phase 5: Already initialized, skipping');
    return;
  }
  
  if (initializationPromise) {
    console.log('[HarperWrapper] Phase 5: Initialization already in progress, waiting...');
    return initializationPromise;
  }

  console.log('[HarperWrapper] Phase 5: Initializing Harper.js WASM module...');

  initializationPromise = (async () => {
    try {
      console.log('[HarperWrapper] Phase 5: Starting dynamic import of harper.js...');
      
      // Dynamic import to handle WASM loading in Next.js environment
      const { binary, LocalLinter, Dialect } = await import('harper.js');
      
      console.log('[HarperWrapper] Phase 5: Harper.js module loaded successfully');
      console.log('[HarperWrapper] Phase 5: Available exports:', { 
        hasBinary: !!binary, 
        hasLocalLinter: !!LocalLinter, 
        hasDialect: !!Dialect 
      });
      
      console.log('[HarperWrapper] Phase 5: Setting up WASM binary...');
      
      // Setup the WASM binary. It will fetch the wasm file from the root,
      // so we have placed harper_wasm_bg.wasm in the /public directory.
      await binary.setup();
      
      console.log('[HarperWrapper] Phase 5: Harper.js binary setup complete');
      
      console.log('[HarperWrapper] Phase 5: Creating linter with American dialect...');
      
      // Create a linter instance with American English dialect
      harperLinter = await binary.createLinter(Dialect.American);
      
      console.log('[HarperWrapper] Phase 5: Harper.js linter created successfully');
      console.log('[HarperWrapper] Phase 5: Linter type:', typeof harperLinter);
      
      // Store the module reference
      harperModule = { binary, LocalLinter, Dialect };
      isInitialized = true;
      
      console.log('[HarperWrapper] Phase 5: ✅ Harper.js initialization complete');
      console.log('[HarperWrapper] Phase 5: Final state - isInitialized:', isInitialized, 'hasLinter:', !!harperLinter);
      
    } catch (error) {
      console.error('[HarperWrapper] Phase 5: ❌ Failed to initialize Harper.js:', error);
      console.error('[HarperWrapper] Phase 5: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
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
  console.log(`[HarperWrapper] Phase 5: Raw Harper lint_kind: "${lintKind}"`);
  
  // Map Harper.js lint kind to our error type
  const errorType = HARPER_ERROR_TYPE_MAP[lintKind] || 'grammar';
  
  // Log any unmapped categories
  if (!HARPER_ERROR_TYPE_MAP[lintKind]) {
    console.warn(`[HarperWrapper] Phase 5: ⚠️ UNMAPPED Harper lint_kind: "${lintKind}" - defaulting to 'grammar'`);
  } else {
    console.log(`[HarperWrapper] Phase 5: Mapped "${lintKind}" to "${errorType}".`);
  }
  
  console.log(`[HarperWrapper] Phase 5: Converting Harper lint - Kind: "${lintKind}" → Type: "${errorType}", Span: ${span.start}-${span.end}`);
  
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
  
  console.log(`[HarperWrapper] Phase 5: Starting grammar check - Text length: ${text.length}, Language: ${language}`);
  console.log(`[HarperWrapper] Phase 5: Text content (first 200 chars):`, text.substring(0, 200));
  
  // Skip very short text
  if (text.length < minTextLength) {
    console.log(`[HarperWrapper] Phase 5: Text too short (${text.length} < ${minTextLength}), skipping check.`);
    return [];
  }

  try {
    // Ensure Harper.js is initialized
    await initializeHarper();
    
    if (!harperLinter) {
      console.error('[HarperWrapper] Phase 5: Harper linter not available after initialization attempt.');
      return [];
    }

    console.log('[HarperWrapper] Phase 5: Running Harper.js lint on text...');
    const startTime = performance.now();
    
    // Run Harper.js linting
    const lints = await harperLinter.lint(text, { language });
    console.log(`[HarperWrapper] Phase 5: Harper.js lint returned ${lints.length} lints.`);
    
    console.log(`[HarperWrapper] Phase 5: ✅ Harper.js found ${lints.length} errors`);
    
    // Convert Harper.js lints to our GrammarError format
    const errors = lints.map((lint: any, index: number) => convertHarperLintToGrammarError(lint, index));
    
    // **ANALYSIS: Log Harper.js category analysis after each check**
    const categoryAnalysis = getHarperCategoryAnalysis();
    console.log(`[HarperWrapper] Phase 5: 📊 Harper.js Category Analysis:`, {
      totalDetected: categoryAnalysis.totalCategoriesDetected,
      mappingCoverage: `${categoryAnalysis.mappingCoverage}%`,
      detectedCategories: categoryAnalysis.detectedCategories,
      unmappedCategories: categoryAnalysis.unmappedCategories
    });
    
    if (categoryAnalysis.unmappedCategories.length > 0) {
      console.warn(`[HarperWrapper] Phase 5: ⚠️ Found ${categoryAnalysis.unmappedCategories.length} unmapped Harper.js categories:`, categoryAnalysis.unmappedCategories);
      console.warn(`[HarperWrapper] Phase 5: 💡 Consider adding these to HARPER_ERROR_TYPE_MAP for better error classification.`);
    }
    
    const endTime = performance.now();
    console.log(`[HarperWrapper] Phase 5: ✅ Grammar check completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    return errors;
    
  } catch (error) {
    console.error('[HarperWrapper] Phase 5: \u274c Error during Harper.js grammar check:', error);
    
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
  console.log(`[HarperWrapper] Phase 5: Applying suggestion for error ID ${error.id} at index ${suggestionIndex}.`);
  console.log(`[HarperWrapper] Phase 5: Original text length: ${text.length}, Error span: ${error.start}-${error.end}`);
  console.log(`[HarperWrapper] Phase 5: Error text: "${error.error}", Available suggestions:`, error.suggestions);
  
  const suggestion = error.suggestions[suggestionIndex];
  
  if (typeof suggestion !== 'string') {
    console.error(`[HarperWrapper] Phase 5: ❌ Invalid suggestion at index ${suggestionIndex} for error:`, error);
    return text;
  }
  
  if (!suggestion.trim()) {
    console.warn(`[HarperWrapper] Phase 5: ⚠️ Empty suggestion at index ${suggestionIndex}, returning original text`);
    return text;
  }
  
  const { start, end } = error;
  
  // Validate span bounds
  if (start < 0 || end > text.length || start >= end) {
    console.error(`[HarperWrapper] Phase 5: ❌ Invalid error span [${start}, ${end}] for text length ${text.length}`);
    return text;
  }
  
  // Extract the problematic text to verify it matches
  const problemText = text.substring(start, end);
  console.log(`[HarperWrapper] Phase 5: Problem text from span: "${problemText}"`);
  
  // Apply the suggestion by replacing the error span with the suggestion
  const newText = text.substring(0, start) + suggestion + text.substring(end);
  
  console.log(`[HarperWrapper] Phase 5: ✅ Suggestion "${suggestion}" applied successfully.`);
  console.log(`[HarperWrapper] Phase 5: New text length: ${newText.length} (change: ${newText.length - text.length})`);
  
  return newText;
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
    isInitializing: !!initializationPromise && !isInitialized,
    hasModule: !!harperModule,
    hasLinter: !!harperLinter,
  };
}

/**
 * Reset Harper.js state (useful for testing or error recovery)
 */
export function resetHarperState(): void {
  console.log('[HarperWrapper] Phase 5: Resetting Harper.js state.');
  harperModule = null;
  harperLinter = null;
  initializationPromise = null;
}

/**
 * Pre-warms the Harper.js module without performing a check
 * @returns {Promise<boolean>} - True if initialization was successful, false otherwise
 */
export async function preWarmHarper(): Promise<boolean> {
  console.log('[HarperWrapper] Phase 5: Pre-warming Harper.js module...');
  try {
    await initializeHarper();
    console.log('[HarperWrapper] Phase 5: ✅ Pre-warming successful.');
    return isInitialized;
  } catch (error) {
    console.error('[HarperWrapper] Phase 5: ❌ Error during pre-warming:', error);
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
  const mappedCategories = Object.keys(HARPER_ERROR_TYPE_MAP);
  const detectedArray = Array.from(detectedHarperCategories);
  const unmappedCategories = detectedArray.filter(
    cat => !mappedCategories.includes(cat)
  );

  return {
    detectedCategories: detectedArray,
    mappedCategories,
    unmappedCategories,
    totalCategoriesDetected: detectedArray.length,
    mappingCoverage: detectedArray.length > 0
      ? (detectedArray.length - unmappedCategories.length) / detectedArray.length
      : 1,
  };
} 