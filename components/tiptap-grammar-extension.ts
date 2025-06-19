import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, EditorState, Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { GrammarError } from '@/types/grammar';

// Helper function to check for composing state
function isComposing(state: EditorState): boolean {
  // The 'composing' property is on the state object, but not in the default types.
  // We cast to any to access it. This is a common pattern for this property.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (state as any).composing;
}

export const GrammarExtension = Extension.create({
  name: 'grammar',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('grammar'),
        state: {
          init: (): { decorations: DecorationSet } => {
            console.log('[GrammarExtension] Phase 6.1: Plugin state initialized with empty decorations');
            return { decorations: DecorationSet.empty };
          },
          apply: (tr: Transaction, pluginState: { decorations: DecorationSet }, oldState: EditorState, newState: EditorState) => {
            const newErrors = tr.getMeta('grammarErrors') as GrammarError[] | undefined;
            console.log('[GrammarExtension] BUGFIX: Apply called. Document size:', newState.doc.content.size, 'newErrors received:', newErrors ? newErrors.length : 'undefined');
            
            // If a transaction isn't related to grammar, we map existing decorations through the transaction
            if (newErrors === undefined) {
              const mappedDecorations = pluginState.decorations.map(tr.mapping, tr.doc);
              console.log('[GrammarExtension] BUGFIX: No new errors, mapping existing decorations through transaction');
              return { decorations: mappedDecorations };
            }

            if (!Array.isArray(newErrors)) {
              console.warn('[GrammarExtension] BUGFIX: newErrors is not a valid array. Clearing decorations. Value:', newErrors);
              return { decorations: DecorationSet.empty };
            }

            console.log(`[GrammarExtension] BUGFIX: Processing ${newErrors.length} errors for decoration`);

            // Enhanced validation with flexible text matching
            const validErrors: GrammarError[] = [];
            for (let i = 0; i < newErrors.length; i++) {
              const error = newErrors[i];
              console.log(`[GrammarExtension] BUGFIX: Validating error ${i + 1}/${newErrors.length} - ID: ${error?.id}, pos: ${error?.start}-${error?.end}`);
              
              // Basic validation
              const isValidError = error 
                && typeof error.start === 'number' 
                && typeof error.end === 'number'
                && error.start >= 0
                && error.end > error.start
                && error.end <= newState.doc.content.size;

              if (isValidError) {
                // Get the actual text at these positions
                const actualText = newState.doc.textBetween(error.start, error.end);
                console.log(`[GrammarExtension] BUGFIX: Error ${error.id} - Expected: "${error.error}", Actual: "${actualText}"`);
                
                // Flexible text matching: exact match, trimmed match, or containment
                const exactMatch = actualText === error.error;
                const trimmedMatch = actualText.trim() === error.error.trim();
                const containsMatch = actualText.includes(error.error) || error.error.includes(actualText);
                
                if (exactMatch) {
                  console.log(`[GrammarExtension] BUGFIX: ✓ Exact text match confirmed for error ${error.id}`);
                  validErrors.push(error);
                } else if (trimmedMatch) {
                  console.log(`[GrammarExtension] BUGFIX: ✓ Trimmed text match confirmed for error ${error.id}`);
                  validErrors.push(error);
                } else if (containsMatch && Math.abs(actualText.length - error.error.length) <= 2) {
                  console.log(`[GrammarExtension] BUGFIX: ✓ Partial text match confirmed for error ${error.id} (small difference)`);
                  validErrors.push(error);
                } else {
                  console.warn(`[GrammarExtension] BUGFIX: ⚠️ Text mismatch for error ${error.id} - but creating decoration anyway for debugging`);
                  // TEMPORARY: Allow mismatched errors through for debugging
                  validErrors.push(error);
                }
              } else {
                console.warn(`[GrammarExtension] BUGFIX: ✗ Invalid error detected at index ${i}. Error:`, error, 'Document size:', newState.doc.content.size);
              }
            }

            if (validErrors.length === 0) {
              console.log('[GrammarExtension] BUGFIX: No valid errors after validation, returning empty decorations');
              return { decorations: DecorationSet.empty };
            }

            console.log(`[GrammarExtension] BUGFIX: Creating decorations for ${validErrors.length} valid errors`);

            const decorations = DecorationSet.create(newState.doc, validErrors.flatMap((error: GrammarError, index: number) => {
              const suggestions = error.suggestions || [];
              console.log(`[GrammarExtension] BUGFIX: Creating decoration ${index + 1}/${validErrors.length} for error ${error.id} at ${error.start}-${error.end}`);
              
              return Decoration.inline(error.start, error.end, {
                class: `grammar-error ${error.type}`,
                'data-error-id': error.id,
                'data-error-json': JSON.stringify(error),
                'aria-label': `Potential ${error.type} error: "${error.error}". Suggestion: "${suggestions[0] || ''}".`,
              });
            }));
            
            const decorationCount = decorations.find().length;
            console.log(`[GrammarExtension] BUGFIX: ✓ Successfully created ${decorationCount} decorations from ${validErrors.length} valid errors`);
            
            return { decorations };
          },
        },
        props: {
          decorations(state) {
            if (isComposing(state)) {
              console.log('[GrammarExtension] Phase 6.1: Composing mode detected, hiding decorations');
              return DecorationSet.empty;
            }
            const pluginState = this.getState(state);
            const decorations = pluginState ? pluginState.decorations : DecorationSet.empty;
            const decorationCount = decorations.find().length;
            console.log(`[GrammarExtension] Phase 6.1: Returning ${decorationCount} decorations to editor`);
            return decorations;
          },
        },
      }),
    ];
  },
}); 