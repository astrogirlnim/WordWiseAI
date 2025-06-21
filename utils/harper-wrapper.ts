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
 * FIXED: Corrected Harper.js API usage for proper error detection and suggestions
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
 * UPGRADED: Using WorkerLinter for non-blocking web performance
 */
async function initializeHarper(): Promise<void> {
  console.log('[HarperWrapper] WORKER_UPGRADE: initializeHarper called');
  
  // Ensure this only runs in the browser
  if (typeof window === 'undefined') {
    console.warn('[HarperWrapper] WORKER_UPGRADE: Attempted to initialize on the server. Skipping.');
    return;
  }
  
  console.log('[HarperWrapper] WORKER_UPGRADE: Browser environment confirmed');
  
  if (isInitialized) {
    console.log('[HarperWrapper] WORKER_UPGRADE: Already initialized, skipping');
    return;
  }
  
  if (initializationPromise) {
    console.log('[HarperWrapper] WORKER_UPGRADE: Initialization already in progress, waiting...');
    return initializationPromise;
  }

  console.log('[HarperWrapper] WORKER_UPGRADE: Initializing Harper.js WorkerLinter...');

  initializationPromise = (async () => {
    try {
      console.log('[HarperWrapper] WORKER_UPGRADE: Starting dynamic import of harper.js...');
      
      // Dynamic import to handle WASM loading in Next.js environment
      const harperModuleImport = await import('harper.js');
      console.log('[HarperWrapper] WORKER_UPGRADE: Harper.js module imported:', Object.keys(harperModuleImport));
      
      const { binary, WorkerLinter, Dialect } = harperModuleImport;
      
      console.log('[HarperWrapper] WORKER_UPGRADE: Harper.js module loaded successfully');
      console.log('[HarperWrapper] WORKER_UPGRADE: Available exports:', { 
        hasBinary: !!binary,
        hasWorkerLinter: !!WorkerLinter, 
        hasDialect: !!Dialect 
      });
      
      console.log('[HarperWrapper] WORKER_UPGRADE: Creating WorkerLinter (non-blocking)...');
      
      // UPGRADE: Use WorkerLinter for better web performance with binary
      harperLinter = new WorkerLinter({
        binary: binary,
        dialect: Dialect.American,
      });
      
      // Configure Harper.js with optimized settings for our use case
      console.log('[HarperWrapper] WORKER_UPGRADE: Configuring Harper.js lint rules...');
      await harperLinter.setLintConfig({
        // Enable core grammar checking
        SpellCheck: true,
        ExplanationMarks: true,
        // Disable verbose rules that might be too aggressive for writing flow
        SentenceLength: false,
        // Keep important rules for professional writing
        Repetition: true,
        Redundancy: true,
        WordChoice: true,
        Clarity: true,
        Grammar: true,
        Punctuation: true,
        Capitalization: true,
      });
      
      console.log('[HarperWrapper] WORKER_UPGRADE: Harper.js WorkerLinter created and configured successfully');
      console.log('[HarperWrapper] WORKER_UPGRADE: Linter type:', typeof harperLinter);
      
      // Store the module reference
      harperModule = { binary, WorkerLinter, Dialect };
      isInitialized = true;
      
      console.log('[HarperWrapper] WORKER_UPGRADE: ✅ Harper.js WorkerLinter initialization complete');
      console.log('[HarperWrapper] WORKER_UPGRADE: Final state - isInitialized:', isInitialized, 'hasLinter:', !!harperLinter);
      
    } catch (error) {
      console.error('[HarperWrapper] WORKER_UPGRADE: ❌ Failed to initialize Harper.js:', error);
      console.error('[HarperWrapper] WORKER_UPGRADE: Error details:', {
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
 * FIXED: Using correct Harper.js API methods for suggestions and error text
 */
function convertHarperLintToGrammarError(lint: any, index: number, originalText: string): GrammarError {
  const span = lint.span();
  const lintKind = lint.lint_kind();
  
  // Track this category for analysis
  detectedHarperCategories.add(lintKind);
  
  // Log the original Harper.js lint_kind for analysis
  console.log(`[HarperWrapper] FIXED: Raw Harper lint_kind: "${lintKind}"`);
  
  // Map Harper.js lint kind to our error type
  const errorType = HARPER_ERROR_TYPE_MAP[lintKind] || 'grammar';
  
  // Log any unmapped categories
  if (!HARPER_ERROR_TYPE_MAP[lintKind]) {
    console.warn(`[HarperWrapper] FIXED: ⚠️ UNMAPPED Harper lint_kind: "${lintKind}" - defaulting to 'grammar'`);
  } else {
    console.log(`[HarperWrapper] FIXED: Mapped "${lintKind}" to "${errorType}".`);
  }
  
  // FIXED: Extract error text from original text using span (Harper.js doesn't have get_problem_text())
  const errorText = originalText.substring(span.start, span.end);
  
  // FIXED: Extract suggestions using correct Harper.js API
  const suggestions: string[] = [];
  console.log(`[HarperWrapper] FIXED: Extracting suggestions for lint (count: ${lint.suggestion_count()})`);
  
  for (let i = 0; i < lint.suggestion_count(); i++) {
    try {
      const suggestion = lint.suggestions()[i];
      console.log(`[HarperWrapper] FIXED: Processing suggestion ${i}:`, {
        kind: suggestion.kind(),
        isRemove: suggestion.kind() === 1,
        replacementText: suggestion.get_replacement_text()
      });
      
      // FIXED: Use get_replacement_text() method per Harper.js documentation
      const replacementText = suggestion.get_replacement_text();
      if (replacementText && replacementText.trim()) {
        suggestions.push(replacementText);
      }
    } catch (suggestionError) {
      console.error(`[HarperWrapper] FIXED: Error extracting suggestion ${i}:`, suggestionError);
    }
  }
  
  console.log(`[HarperWrapper] FIXED: Converting Harper lint - Kind: "${lintKind}" → Type: "${errorType}", Span: ${span.start}-${span.end}, Suggestions: ${suggestions.length}`);
  console.log(`[HarperWrapper] FIXED: Error text: "${errorText}", Suggestions:`, suggestions);
  
  return {
    id: `harper-${Date.now()}-${index}`, // Generate unique ID
    start: span.start,
    end: span.end,
    error: errorText, // FIXED: Use extracted text from span
    suggestions: suggestions, // FIXED: Use properly extracted suggestions
    explanation: lint.message(),
    type: errorType,
    shownAt: Date.now(),
  };
}

/**
 * Check grammar using Harper.js
 * FIXED: Using correct Harper.js lint() method without unsupported options
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
  
  console.log(`[HarperWrapper] WORKER_UPGRADE: Starting grammar check - Text length: ${text.length}, Language: ${language}`);
  console.log(`[HarperWrapper] WORKER_UPGRADE: Text content (first 200 chars):`, text.substring(0, 200));
  
  // Skip very short text
      if (text.length < minTextLength) {
      console.log(`[HarperWrapper] WORKER_UPGRADE: Text too short (${text.length} < ${minTextLength}), skipping check.`);
      return [];
    }

    try {
      // Ensure Harper.js is initialized
      await initializeHarper();
      
      if (!harperLinter) {
        console.error('[HarperWrapper] WORKER_UPGRADE: Harper linter not available after initialization attempt.');
        return [];
      }

      console.log('[HarperWrapper] WORKER_UPGRADE: Running Harper.js WorkerLinter on text...');
      const startTime = performance.now();
      
      // WORKER_UPGRADE: Run Harper.js linting with WorkerLinter (non-blocking)
      const lints = await harperLinter.lint(text);
      console.log(`[HarperWrapper] WORKER_UPGRADE: Harper.js WorkerLinter returned ${lints.length} lints.`);
      
      // Log detailed information about each lint for debugging
      lints.forEach((lint: any, index: number) => {
        const span = lint.span();
        console.log(`[HarperWrapper] WORKER_UPGRADE: Lint ${index}: kind="${lint.lint_kind()}", span=${span.start}-${span.end}, message="${lint.message()}", suggestions=${lint.suggestion_count()}`);
      });
      
      console.log(`[HarperWrapper] WORKER_UPGRADE: ✅ Harper.js WorkerLinter found ${lints.length} errors`);
    
    // FIXED: Convert Harper.js lints to our GrammarError format with original text for extraction
    const errors = lints.map((lint: any, index: number) => convertHarperLintToGrammarError(lint, index, text));
    
    // **ANALYSIS: Log Harper.js category analysis after each check**
    const categoryAnalysis = getHarperCategoryAnalysis();
    console.log(`[HarperWrapper] FIXED: 📊 Harper.js Category Analysis:`, {
      totalDetected: categoryAnalysis.totalCategoriesDetected,
      mappingCoverage: `${Math.round(categoryAnalysis.mappingCoverage * 100)}%`,
      detectedCategories: categoryAnalysis.detectedCategories,
      unmappedCategories: categoryAnalysis.unmappedCategories
    });
    
    if (categoryAnalysis.unmappedCategories.length > 0) {
      console.warn(`[HarperWrapper] FIXED: ⚠️ Found ${categoryAnalysis.unmappedCategories.length} unmapped Harper.js categories:`, categoryAnalysis.unmappedCategories);
      console.warn(`[HarperWrapper] FIXED: 💡 Consider adding these to HARPER_ERROR_TYPE_MAP for better error classification.`);
    }
    
    const endTime = performance.now();
    console.log(`[HarperWrapper] WORKER_UPGRADE: ✅ Grammar check completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`[HarperWrapper] WORKER_UPGRADE: Final errors returned:`, errors.map((e: GrammarError) => ({ 
      id: e.id, 
      type: e.type, 
      span: `${e.start}-${e.end}`, 
      error: e.error, 
      suggestions: e.suggestions.length,
      suggestionsText: e.suggestions 
    })));
    
    return errors;
    
  } catch (error) {
    console.error('[HarperWrapper] WORKER_UPGRADE: ❌ Error during Harper.js grammar check:', error);
    console.error('[HarperWrapper] WORKER_UPGRADE: Error stack:', error instanceof Error ? error.stack : 'No stack');
    
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
  console.log(`[HarperWrapper] FIXED: Applying suggestion for error ID ${error.id} at index ${suggestionIndex}.`);
  console.log(`[HarperWrapper] FIXED: Original text length: ${text.length}, Error span: ${error.start}-${error.end}`);
  console.log(`[HarperWrapper] FIXED: Error text: "${error.error}", Available suggestions:`, error.suggestions);
  
  const suggestion = error.suggestions[suggestionIndex];
  
  if (typeof suggestion !== 'string') {
    console.error(`[HarperWrapper] FIXED: Invalid suggestion at index ${suggestionIndex} for error:`, error);
    return text;
  }
  
  if (!suggestion.trim()) {
    console.warn(`[HarperWrapper] FIXED: Empty suggestion at index ${suggestionIndex}, returning original text`);
    return text;
  }
  
  const { start, end } = error;
  
  // Validate span bounds
  if (start < 0 || end > text.length || start >= end) {
    console.error(`[HarperWrapper] FIXED: Invalid error span [${start}, ${end}] for text length ${text.length}`);
    return text;
  }
  
  // Extract the problematic text to verify it matches
  const problemText = text.substring(start, end);
  console.log(`[HarperWrapper] FIXED: Problem text from span: "${problemText}"`);
  
  // Apply the suggestion by replacing the error span with the suggestion
  const newText = text.substring(0, start) + suggestion + text.substring(end);
  
  console.log(`[HarperWrapper] FIXED: ✅ Suggestion "${suggestion}" applied successfully.`);
  console.log(`[HarperWrapper] FIXED: New text length: ${newText.length} (change: ${newText.length - text.length})`);
  
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
  console.log('[HarperWrapper] WORKER_UPGRADE: Resetting Harper.js WorkerLinter state.');
  harperModule = null;
  harperLinter = null;
  isInitialized = false;
  initializationPromise = null;
}

/**
 * Pre-warms the Harper.js module without performing a check
 * @returns {Promise<boolean>} - True if initialization was successful, false otherwise
 */
export async function preWarmHarper(): Promise<boolean> {
  console.log('[HarperWrapper] WORKER_UPGRADE: Pre-warming Harper.js WorkerLinter...');
  try {
    await initializeHarper();
    console.log('[HarperWrapper] WORKER_UPGRADE: ✅ Pre-warming successful.');
    return isInitialized;
  } catch (error) {
    console.error('[HarperWrapper] WORKER_UPGRADE: ❌ Error during pre-warming:', error);
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

/**
 * Position mapping utility to convert plain text positions to TipTap editor positions
 * This solves the critical position misalignment issue between Harper.js and TipTap editor
 */
export interface PositionMap {
  plainTextToEditorPosition: (plainTextPos: number) => number;
  editorToPlainTextPosition: (editorPos: number) => number;
}

/**
 * Create a position mapping between plain text and TipTap editor content
 * This is essential for accurate grammar error positioning
 */
export function createPositionMapping(editor: any, plainText: string): PositionMap {
  console.log('[HarperWrapper] POSITION_FIX: Creating position mapping');
  console.log('[HarperWrapper] POSITION_FIX: Plain text length:', plainText.length);
  console.log('[HarperWrapper] POSITION_FIX: Editor doc size:', editor.state.doc.content.size);
  
  // Build mapping arrays by walking through both representations
  const plainToEditor: number[] = [];
  const editorToPlain: number[] = [];
  
  let plainIndex = 0;
  
  // Walk through the editor document node by node
  editor.state.doc.descendants((node: any, pos: number) => {
    if (node.isText) {
      const text = node.text;
      for (let i = 0; i < text.length; i++) {
        if (plainIndex < plainText.length) {
          // Map plain text position to editor position
          plainToEditor[plainIndex] = pos + i;
          editorToPlain[pos + i] = plainIndex;
          plainIndex++;
        }
      }
    }
    // For non-text nodes, editor position advances but plain text doesn't
    if (!node.isText && node.nodeSize > 0) {
      // Record current plain position for these editor positions
      for (let i = 0; i < node.nodeSize; i++) {
        editorToPlain[pos + i] = plainIndex;
      }
    }
  });
  
  console.log('[HarperWrapper] POSITION_FIX: Position mapping created');
  console.log('[HarperWrapper] POSITION_FIX: Plain->Editor mappings:', plainToEditor.length);
  console.log('[HarperWrapper] POSITION_FIX: Editor->Plain mappings:', editorToPlain.length);
  
  return {
    plainTextToEditorPosition: (plainPos: number): number => {
      const editorPos = plainToEditor[plainPos];
      console.log(`[HarperWrapper] POSITION_FIX: Plain ${plainPos} -> Editor ${editorPos}`);
      return editorPos !== undefined ? editorPos : plainPos; // Fallback to original position
    },
    editorToPlainTextPosition: (editorPos: number): number => {
      const plainPos = editorToPlain[editorPos];
      console.log(`[HarperWrapper] POSITION_FIX: Editor ${editorPos} -> Plain ${plainPos}`);
      return plainPos !== undefined ? plainPos : editorPos; // Fallback to original position
    }
  };
}

/**
 * Undo stack for grammar suggestions
 */
interface GrammarUndoAction {
  id: string;
  type: 'grammar_suggestion';
  timestamp: number;
  originalText: string;
  replacementText: string;
  startPosition: number;
  endPosition: number;
  errorId: string;
}

let grammarUndoStack: GrammarUndoAction[] = [];
const MAX_UNDO_ACTIONS = 50;

/**
 * Add an undo action to the stack
 */
export function addGrammarUndoAction(action: Omit<GrammarUndoAction, 'id' | 'timestamp'>): void {
  const undoAction: GrammarUndoAction = {
    ...action,
    id: `undo-${Date.now()}-${Math.random()}`,
    timestamp: Date.now()
  };
  
  grammarUndoStack.push(undoAction);
  
  // Keep only the most recent actions
  if (grammarUndoStack.length > MAX_UNDO_ACTIONS) {
    grammarUndoStack = grammarUndoStack.slice(-MAX_UNDO_ACTIONS);
  }
  
  console.log('[HarperWrapper] UNDO: Added action to stack:', undoAction.id);
  console.log('[HarperWrapper] UNDO: Stack size:', grammarUndoStack.length);
}

/**
 * Undo the last grammar suggestion
 * CTRL_Z_FIX: Works with both TipTap editor and ProseMirror EditorView
 */
export function undoLastGrammarSuggestion(editorOrView: any): boolean {
  if (grammarUndoStack.length === 0) {
    console.log('[HarperWrapper] UNDO: No actions to undo');
    return false;
  }
  
  const lastAction = grammarUndoStack.pop()!;
  console.log('[HarperWrapper] UNDO: Undoing action:', lastAction.id);
  
  try {
    // Determine if we have a TipTap editor or ProseMirror EditorView
    const isTipTapEditor = editorOrView.chain && typeof editorOrView.chain === 'function';
    const isEditorView = editorOrView.state && editorOrView.dispatch && !isTipTapEditor;
    
    console.log('[HarperWrapper] UNDO: Editor type detection:', { isTipTapEditor, isEditorView });
    
    if (isTipTapEditor) {
      // Handle TipTap editor (has .chain() method)
      console.log('[HarperWrapper] UNDO: Using TipTap editor API');
      
      const currentText = editorOrView.state.doc.textBetween(
        lastAction.startPosition, 
        lastAction.startPosition + lastAction.replacementText.length
      );
      
      if (currentText === lastAction.replacementText) {
        editorOrView
          .chain()
          .focus()
          .setTextSelection({ 
            from: lastAction.startPosition, 
            to: lastAction.startPosition + lastAction.replacementText.length 
          })
          .insertContent(lastAction.originalText)
          .run();
          
        console.log('[HarperWrapper] UNDO: ✅ Successfully undone grammar suggestion via TipTap');
        return true;
      }
      
    } else if (isEditorView) {
      // Handle ProseMirror EditorView (from keyboard handler)
      console.log('[HarperWrapper] UNDO: Using ProseMirror EditorView API');
      
      const { state, dispatch } = editorOrView;
      const currentText = state.doc.textBetween(
        lastAction.startPosition, 
        lastAction.startPosition + lastAction.replacementText.length
      );
      
      if (currentText === lastAction.replacementText) {
        // Create ProseMirror transaction to replace text
        const tr = state.tr.replaceWith(
          lastAction.startPosition,
          lastAction.startPosition + lastAction.replacementText.length,
          state.schema.text(lastAction.originalText)
        );
        
        // Apply the transaction
        dispatch(tr);
        
        console.log('[HarperWrapper] UNDO: ✅ Successfully undone grammar suggestion via ProseMirror');
        return true;
      }
      
    } else {
      console.error('[HarperWrapper] UNDO: ❌ Unknown editor type, cannot undo');
      return false;
    }
    
    // If we reach here, text didn't match
    console.warn('[HarperWrapper] UNDO: ⚠️ Text mismatch, cannot safely undo');
    console.warn('[HarperWrapper] UNDO: Expected:', lastAction.replacementText);
    console.warn('[HarperWrapper] UNDO: Found:', 'text check failed');
    return false;
    
  } catch (error) {
    console.error('[HarperWrapper] UNDO: ❌ Error undoing suggestion:', error);
    return false;
  }
}

/**
 * Get the number of available undo actions
 */
export function getUndoStackSize(): number {
  return grammarUndoStack.length;
}

/**
 * Clear the undo stack
 */
export function clearGrammarUndoStack(): void {
  grammarUndoStack = [];
  console.log('[HarperWrapper] UNDO: Undo stack cleared');
} 