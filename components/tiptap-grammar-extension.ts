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
            console.log('[GrammarExtension] Phase 6.1: Apply called. Document size:', newState.doc.content.size, 'newErrors received:', newErrors ? newErrors.length : 'undefined');
            
            // If a transaction isn't related to grammar, we map existing decorations through the transaction
            if (newErrors === undefined) {
              const mappedDecorations = pluginState.decorations.map(tr.mapping, tr.doc);
              console.log('[GrammarExtension] Phase 6.1: No new errors, mapping existing decorations through transaction');
              return { decorations: mappedDecorations };
            }

            if (!Array.isArray(newErrors)) {
              console.warn('[GrammarExtension] Phase 6.1: newErrors is not a valid array. Clearing decorations. Value:', newErrors);
              return { decorations: DecorationSet.empty };
            }

            console.log(`[GrammarExtension] Phase 6.1: Processing ${newErrors.length} errors for decoration`);

            // Validate each error before creating decorations
            for (let i = 0; i < newErrors.length; i++) {
              const error = newErrors[i];
              console.log(`[GrammarExtension] Phase 6.1: Validating error ${i + 1}/${newErrors.length} - ID: ${error?.id}, pos: ${error?.start}-${error?.end}`);
              
              if (
                !error ||
                typeof error.start !== 'number' ||
                typeof error.end !== 'number' ||
                error.start >= error.end ||
                error.end > newState.doc.content.size ||
                error.start < 0
              ) {
                console.warn(`[GrammarExtension] Phase 6.1: Invalid error detected at index ${i}. Skipping all decorations. Error:`, error, 'Document size:', newState.doc.content.size);
                return { decorations: DecorationSet.empty };
              }
            }

            console.log('[GrammarExtension] Phase 6.1: All errors validated, creating decorations');

            const decorations = DecorationSet.create(newState.doc, newErrors.flatMap((error: GrammarError, index: number) => {
              const suggestions = error.suggestions || [];
              console.log(`[GrammarExtension] Phase 6.1: Creating decoration ${index + 1}/${newErrors.length} for error ${error.id} at ${error.start}-${error.end}`);
              
              return Decoration.inline(error.start, error.end, {
                class: `grammar-error ${error.type}`,
                'data-error-id': error.id,
                'data-error-json': JSON.stringify(error),
                'aria-label': `Potential ${error.type} error: "${error.error}". Suggestion: "${suggestions[0] || ''}".`,
              });
            }));
            
            const decorationCount = decorations.find().length;
            console.log(`[GrammarExtension] Phase 6.1: Successfully created ${decorationCount} decorations from ${newErrors.length} errors`);
            
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