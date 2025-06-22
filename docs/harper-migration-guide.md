# Harper.js Migration Guide

## Overview

This guide covers the complete migration from Firebase Cloud Function + OpenAI grammar checking to Harper.js client-side grammar checking. This migration provides better performance, enhanced privacy, and reduced operational costs.

## Pre-Migration Checklist

### 1. Environment Assessment
- [ ] Verify target browsers support WASM (Chrome 90+, Firefox 89+, Safari 14+, Edge 90+)
- [ ] Confirm network connectivity to unpkg.com CDN for initial Harper.js loading
- [ ] Backup existing grammar checking configuration and error data
- [ ] Document current cloud function usage and costs for comparison

### 2. Dependency Review
- [ ] Audit current OpenAI API usage specific to grammar checking
- [ ] Identify all files that import grammar-related cloud functions
- [ ] Review environment variables related to grammar checking
- [ ] Document current error types and categorization system

### 3. Testing Preparation
- [ ] Prepare test documents with various grammar errors
- [ ] Set up browser testing environment for WASM compatibility
- [ ] Create performance benchmarks for comparison
- [ ] Prepare rollback plan if migration issues occur

## Migration Steps

### Step 1: Install Harper.js Dependency

Add Harper.js to your project dependencies:

```bash
npm install harper.js@^0.44.0
```

Verify the dependency is correctly added to `package.json`:

```json
{
  "dependencies": {
    "harper.js": "^0.44.0"
  }
}
```

### Step 2: Create Harper.js Wrapper

Create `utils/harper-wrapper.ts` with the following content:

```typescript
'use client';

import type { GrammarError } from '@/types/grammar';

// Dynamic import for Harper.js to handle WASM loading
let harperModule: any = null;
let harperLinter: any = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Track Harper.js categories for analysis
const detectedHarperCategories = new Set<string>();

// Map Harper.js lint types to our error types
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
 * Initialize Harper.js WorkerLinter via unpkg CDN
 */
async function initializeHarper(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      // Load Harper.js from CDN
      const harperScript = document.createElement('script');
      harperScript.src = 'https://unpkg.com/harper.js@latest/dist/harper.js';
      document.head.appendChild(harperScript);

      // Wait for Harper.js to load
      await new Promise((resolve, reject) => {
        harperScript.onload = resolve;
        harperScript.onerror = reject;
      });

      // Initialize WorkerLinter
      const { WorkerLinter } = (window as any).Harper;
      harperLinter = new WorkerLinter();

      // Configure lint rules
      await harperLinter.setLintConfig({
        SpellCheck: true,
        ExplanationMarks: true,
        SentenceLength: false, // Disabled for writing flow
        Repetition: true,
        Redundancy: true,
        WordChoice: true,
        Clarity: true,
        Grammar: true,
        Punctuation: true,
        Capitalization: true,
      });

      isInitialized = true;
      console.log('[HarperWrapper] Harper.js initialized successfully');
      
    } catch (error) {
      console.error('[HarperWrapper] Harper.js initialization failed:', error);
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Convert Harper.js Lint object to our GrammarError interface
 */
function convertHarperLintToGrammarError(lint: any, index: number, originalText: string): GrammarError {
  const span = lint.span();
  const lintKind = lint.lint_kind();
  
  detectedHarperCategories.add(lintKind);
  
  const errorType = HARPER_ERROR_TYPE_MAP[lintKind] || 'grammar';
  const errorText = originalText.substring(span.start, span.end);
  
  // Extract suggestions
  const suggestions: string[] = [];
  for (let i = 0; i < lint.suggestion_count(); i++) {
    const suggestion = lint.suggestion(i);
    const replacementText = suggestion.get_replacement_text();
    if (replacementText && replacementText.trim()) {
      suggestions.push(replacementText);
    }
  }
  
  return {
    id: `harper-${index}-${span.start}-${span.end}`,
    start: span.start,
    end: span.end,
    error: errorText,
    suggestions,
    explanation: lint.message(),
    type: errorType,
    shownAt: Date.now(),
  };
}

/**
 * Check grammar using Harper.js
 */
export async function checkGrammarWithHarper(
  text: string,
  options: {
    language?: 'plaintext' | 'markdown';
    minTextLength?: number;
  } = {}
): Promise<GrammarError[]> {
  const { minTextLength = 10 } = options;
  
  if (text.length < minTextLength) return [];

  try {
    await initializeHarper();
    
    if (!harperLinter) {
      console.error('[HarperWrapper] Harper linter not available');
      return [];
    }

    const startTime = performance.now();
    const lints = await harperLinter.lint(text);
    const errors = lints.map((lint: any, index: number) => 
      convertHarperLintToGrammarError(lint, index, text)
    );
    
    const duration = performance.now() - startTime;
    console.log(`[HarperWrapper] Grammar check completed in ${duration.toFixed(2)}ms - Found ${errors.length} errors`);
    
    return errors;
    
  } catch (error) {
    console.error('[HarperWrapper] Error during grammar check:', error);
    return [];
  }
}

/**
 * Apply a grammar suggestion to text
 */
export async function applySuggestionWithHarper(
  text: string, 
  error: GrammarError, 
  suggestionIndex: number = 0
): Promise<string> {
  const suggestion = error.suggestions[suggestionIndex];
  
  if (!suggestion?.trim()) return text;
  
  const { start, end } = error;
  
  if (start < 0 || end > text.length || start >= end) {
    console.error('[HarperWrapper] Invalid error span');
    return text;
  }
  
  return text.substring(0, start) + suggestion + text.substring(end);
}

/**
 * Get Harper.js category analysis for monitoring
 */
export function getHarperCategoryAnalysis() {
  const detectedCategories = Array.from(detectedHarperCategories);
  const mappedCategories = detectedCategories.filter(cat => HARPER_ERROR_TYPE_MAP[cat]);
  const unmappedCategories = detectedCategories.filter(cat => !HARPER_ERROR_TYPE_MAP[cat]);
  
  return {
    totalCategoriesDetected: detectedCategories.length,
    mappingCoverage: detectedCategories.length > 0 ? mappedCategories.length / detectedCategories.length : 1,
    detectedCategories,
    mappedCategories,
    unmappedCategories,
  };
}
```

### Step 3: Update Grammar Checker Hook

Modify `hooks/use-grammar-checker.ts` to use Harper.js:

```typescript
import { checkGrammarWithHarper, applySuggestionWithHarper } from '@/utils/harper-wrapper';

// Replace cloud function calls with Harper.js calls
const performGrammarCheck = useCallback(async (textToCheck: string): Promise<GrammarError[]> => {
  try {
    setIsChecking(true);
    
    const grammarErrors = await checkGrammarWithHarper(textToCheck, {
      language: 'plaintext',
      minTextLength: 10
    });
    
    console.log(`[useGrammarChecker] Found ${grammarErrors.length} errors`);
    return grammarErrors;
    
  } catch (error) {
    console.error('[useGrammarChecker] Harper.js grammar check failed:', error);
    return [];
  } finally {
    setIsChecking(false);
  }
}, []);

// Update applySuggestion to use Harper.js
const applySuggestion = applySuggestionWithHarper;
```

### Step 4: Update Grammar Error Types

Clean up `types/grammar.ts` to remove chunking-related properties:

```typescript
export interface GrammarError {
  id: string;
  start: number;
  end: number;
  error: string;
  suggestions: string[];
  explanation: string;
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'punctuation';
  shownAt?: number;
  // Remove: chunkId, originalChunkStart, originalChunkEnd
}

// Remove: ChunkedGrammarError interface (no longer needed)
```

### Step 5: Simplify TipTap Grammar Extension

Update `components/tiptap-grammar-extension.ts` to remove complex validation:

```typescript
// Replace complex validation with simple filtering
const validErrors = grammarErrors.filter((error: GrammarError) => {
  return error.start >= 0 && 
         error.end <= doc.content.size && 
         error.start < error.end;
});

console.log(`[GrammarExtension] Creating decorations for ${validErrors.length} valid errors`);
```

### Step 6: Update Document Editor Integration

Modify `components/document-editor.tsx` to support immediate grammar checking:

```typescript
// Add separate grammar text stream
const [grammarPlainText, setGrammarPlainText] = useState('')

// Update immediately in onUpdate callback
const onUpdate = useCallback(({ editor, transaction }: { editor: Editor; transaction: Transaction }) => {
  // ... existing update logic ...
  
  // Extract plain text immediately for grammar checking
  const updatedFullContent = /* reconstruct full content */;
  const div = document.createElement('div');
  div.innerHTML = updatedFullContent;
  const updatedPlainText = div.textContent || '';
  setGrammarPlainText(updatedPlainText); // Immediate update
  
  // ... rest of update logic ...
}, [/* dependencies */]);

// Use immediate text for grammar checking
const { errors, removeError, checkFullDocument } = useGrammarChecker(
  documentId, 
  grammarCheckEnabled ? grammarPlainText : '', // Use immediate text
  visibleRange,
  contentCoordinatorRef
)
```

### Step 7: Remove Cloud Function Dependencies

#### A. Clean up `services/ai-service.ts`:

```typescript
// Remove these methods:
// - static async checkGrammar()
// - static async checkGrammarChunk()

// Keep other methods intact:
// - generateSuggestion()
// - generateStyleSuggestions()  
// - generateFunnelSuggestions()
```

#### B. Update `functions/index.js`:

```javascript
// Remove or comment out:
// exports.checkGrammar = onCall(...)

// Keep other functions:
// exports.generateSuggestions = onCall(...)
// exports.generateStyleSuggestions = onCall(...)
// exports.generateFunnelSuggestions = onCall(...)
```

### Step 8: Update Environment Configuration

#### A. Make OpenAI optional in `lib/env.ts`:

```typescript
export const env = {
  // Make OpenAI optional since grammar checking no longer requires it
  hasOpenAiApiKey: !!process.env.OPENAI_API_KEY,
  
  // Other required environment variables
  firebase: {
    // ... firebase config
  }
};

// Update validation to make OpenAI optional for grammar features
export const serverEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY, // Optional, not validated
  // ... other required variables
};
```

#### B. Update `env.example`:

```bash
# OpenAI API Key (Optional - only needed for style suggestions and funnel generation)
# Grammar checking now uses Harper.js client-side and doesn't require OpenAI
OPENAI_API_KEY=""
```

#### C. Update `scripts/validate-env.js`:

```javascript
// Remove OPENAI_API_KEY from required variables array
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  // Remove: 'OPENAI_API_KEY' (now optional)
];
```

### Step 9: Update CI/CD Pipeline

#### A. Update `.github/workflows/firebase-hosting-merge.yml`:

```yaml
# Make OPENAI_API_KEY optional in environment variables
- name: Deploy to Firebase Hosting
  run: npm run build && firebase deploy --only hosting
  env:
    FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
    # OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} # Optional for grammar checking
```

#### B. Update `.github/workflows/firebase-hosting-pull-request.yml`:

```yaml
# Similar changes - make OPENAI_API_KEY optional
```

### Step 10: Add WASM Asset Support

Ensure `public/harper_wasm_bg.wasm` is included in your deployment:

#### A. Update `.gitignore`:

```gitignore
# Ensure WASM files are included
!public/*.wasm
```

#### B. Verify Firebase hosting includes WASM files:

```json
// firebase.json
{
  "hosting": {
    "source": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
      // Don't ignore *.wasm files
    ]
  }
}
```

## Testing & Validation

### 1. Browser Compatibility Testing

Test Harper.js initialization across target browsers:

```javascript
// Test script to run in browser console
async function testHarperInit() {
  try {
    // Load Harper.js from CDN
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/harper.js@latest/dist/harper.js';
    document.head.appendChild(script);
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    });
    
    const { WorkerLinter } = window.Harper;
    const linter = new WorkerLinter();
    
    const errors = await linter.lint('This is a test sentence.');
    console.log('✅ Harper.js working:', errors.length, 'errors found');
    
  } catch (error) {
    console.error('❌ Harper.js failed:', error);
  }
}

testHarperInit();
```

### 2. Performance Benchmarking

Compare performance before and after migration:

```typescript
// Performance test utility
export async function benchmarkGrammarChecking() {
  const testTexts = [
    'Short text with error.',
    'Medium length text with several grammar errors and spelling mistakes that should be detected.',
    // Add longer texts for comprehensive testing
  ];
  
  for (const text of testTexts) {
    const startTime = performance.now();
    const errors = await checkGrammarWithHarper(text);
    const duration = performance.now() - startTime;
    
    console.log(`Text length: ${text.length}, Errors: ${errors.length}, Time: ${duration.toFixed(2)}ms`);
  }
}
```

### 3. Error Category Coverage Testing

Verify all Harper.js categories are properly mapped:

```typescript
// Test comprehensive error detection
const testDocument = `
This sentence have grammar errors. Their are spelling mistakes too.
The clarity of this sentence could be better, and word choice is poor.
Repetitive repetitive words. Redundant and unnecessary redundancy.
Punctuation errors, improper capitalization of Words.
Style issues and formatting problems.
`;

const errors = await checkGrammarWithHarper(testDocument);
const analysis = getHarperCategoryAnalysis();

console.log('Category Analysis:', analysis);
console.log('Mapping Coverage:', `${Math.round(analysis.mappingCoverage * 100)}%`);
```

### 4. Integration Testing

Test complete grammar checking workflow:

```typescript
// End-to-end grammar checking test
async function testGrammarWorkflow() {
  const editor = /* your TipTap editor instance */;
  
  // 1. Insert text with errors
  editor.commands.setContent('This text have errors.');
  
  // 2. Wait for grammar checking
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 3. Verify errors are highlighted
  const decorations = editor.view.state.doc.content.content;
  console.log('Decorations applied:', decorations.length > 0);
  
  // 4. Test suggestion application
  // Apply first suggestion and verify text changes
}
```

## Rollback Plan

If issues occur during migration, follow this rollback procedure:

### 1. Immediate Rollback Steps

1. **Disable Harper.js**: Set feature flag to disable grammar checking
2. **Restore Cloud Functions**: Re-enable checkGrammar cloud function
3. **Restore Environment Variables**: Add back required OpenAI API key
4. **Revert Code Changes**: Use git to revert to pre-migration state

### 2. Rollback Commands

```bash
# Revert to previous version
git revert HEAD~n  # where n is number of migration commits

# Restore environment variables
export OPENAI_API_KEY="your_api_key"

# Redeploy cloud functions
firebase deploy --only functions

# Verify rollback
npm run test
```

### 3. Post-Rollback Verification

- [ ] Grammar checking works with cloud functions
- [ ] OpenAI API calls are functioning
- [ ] Error highlighting appears correctly
- [ ] No console errors or warnings
- [ ] Performance is acceptable

## Common Migration Issues & Solutions

### Issue 1: Harper.js WASM Loading Failures

**Symptoms**: Console errors about WASM module loading failures

**Solutions**:
- Verify network connectivity to unpkg.com
- Check Content Security Policy settings
- Ensure browser supports WASM (update browser if needed)
- Test with different CDN URLs if needed

### Issue 2: Performance Degradation

**Symptoms**: Slower grammar checking compared to cloud functions

**Solutions**:
- Verify Harper.js is using WorkerLinter (non-blocking)
- Check for memory leaks in error arrays
- Optimize document size for grammar checking
- Add performance monitoring and logging

### Issue 3: Position Mapping Errors

**Symptoms**: Grammar errors highlighted in wrong positions

**Solutions**:
- Verify plain text extraction is accurate
- Check for rich text formatting conflicts
- Add position validation in grammar extension
- Monitor fuzzy matching fallbacks

### Issue 4: Category Mapping Issues

**Symptoms**: Harper.js errors not properly categorized

**Solutions**:
- Update HARPER_ERROR_TYPE_MAP with new categories
- Monitor category analysis logs
- Add fallback categorization for unmapped types
- Review Harper.js documentation for new categories

## Post-Migration Monitoring

### 1. Key Metrics to Monitor

- **Performance**: Grammar checking response times
- **Accuracy**: Error detection coverage and precision  
- **Browser Compatibility**: Success rates across different browsers
- **User Experience**: Typing lag, decoration rendering smoothness
- **Error Rates**: Harper.js initialization failures, WASM loading issues

### 2. Monitoring Implementation

```typescript
// Performance monitoring
const grammarPerformanceMonitor = {
  trackCheckDuration: (duration: number, textLength: number) => {
    console.log(`Grammar check: ${duration}ms for ${textLength} characters`);
    // Send to analytics if needed
  },
  
  trackInitialization: (success: boolean, error?: Error) => {
    console.log(`Harper.js initialization: ${success ? 'success' : 'failed'}`, error);
    // Send to analytics if needed
  },
  
  trackCategoryMapping: (analysis: any) => {
    if (analysis.mappingCoverage < 1.0) {
      console.warn('Incomplete category mapping:', analysis.unmappedCategories);
      // Alert if new categories detected
    }
  }
};
```

### 3. Success Criteria

The migration is considered successful when:

- [ ] Grammar checking performance matches or exceeds cloud function performance
- [ ] 100% Harper.js category mapping coverage maintained
- [ ] No increase in user-reported grammar checking issues
- [ ] Browser compatibility maintained across all target browsers
- [ ] Cost reduction from eliminated cloud function calls confirmed
- [ ] User privacy improved (no text sent to external APIs)

## Conclusion

The Harper.js migration provides significant benefits in terms of performance, privacy, and cost reduction. Following this guide ensures a smooth transition from cloud function-based grammar checking to the new client-side architecture.

For additional support:
- Review `docs/harper-architecture.md` for detailed system documentation
- Check `docs/harper-api-reference.md` for API documentation
- Monitor console logs for Harper.js-specific debugging information
- Test thoroughly in your target browser environments before full deployment 