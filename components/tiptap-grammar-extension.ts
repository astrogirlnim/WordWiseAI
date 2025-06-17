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
            return { decorations: DecorationSet.empty };
          },
          apply: (tr: Transaction, pluginState: { decorations: DecorationSet }, oldState: EditorState, newState: EditorState) => {
            const newErrors = tr.getMeta('grammarErrors') as GrammarError[] | undefined;
            console.log('[GrammarExtension] apply called. Document size:', newState.doc.content.size, 'newErrors:', newErrors);
            
            // If a transaction isn't related to grammar, we map existing decorations through the transaction
            if (newErrors === undefined) {
              return { decorations: pluginState.decorations.map(tr.mapping, tr.doc) };
            }

            if (!Array.isArray(newErrors)) {
              console.warn('[GrammarExtension] newErrors is not a valid array. Clearing decorations. Value:', newErrors);
              return { decorations: DecorationSet.empty };
            }

            for (const error of newErrors) {
              if (
                !error ||
                typeof error.start !== 'number' ||
                typeof error.end !== 'number' ||
                error.start >= error.end ||
                error.end > newState.doc.content.size
              ) {
                console.warn('[GrammarExtension] Invalid error detected. Skipping all decorations. Error:', error, 'Document size:', newState.doc.content.size);
                return { decorations: DecorationSet.empty };
              }
            }

            const decorations = DecorationSet.create(newState.doc, newErrors.flatMap((error: GrammarError) => {
              const suggestions = error.suggestions || [];
              return Decoration.inline(error.start, error.end, {
                class: `grammar-error ${error.type}`,
                'data-error-id': error.id,
                'data-error-json': JSON.stringify(error),
                'aria-label': `Potential ${error.type} error: “${error.error}”. Suggestion: “${suggestions[0] || ''}”.`,
              });
            }));
            console.log('[GrammarExtension] Created decorations:', decorations.find());
            return { decorations };
          },
        },
        props: {
          decorations(state) {
            if (isComposing(state)) {
              return DecorationSet.empty;
            }
            const pluginState = this.getState(state);
            return pluginState ? pluginState.decorations : DecorationSet.empty;
          },
        },
      }),
    ];
  },
}); 