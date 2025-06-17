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

interface GrammarPluginState {
  decorations: DecorationSet;
}

export const GrammarExtension = Extension.create({
  name: 'grammar',

  addProseMirrorPlugins() {
    return [
      new Plugin<GrammarPluginState>({
        key: new PluginKey('grammar'),
        state: {
          init: (): GrammarPluginState => {
            return { decorations: DecorationSet.empty };
          },
          apply: (tr: Transaction, pluginState: GrammarPluginState, oldState: EditorState, newState: EditorState): GrammarPluginState => {
            const newErrors = tr.getMeta('grammarErrors') as GrammarError[] | undefined;
            
            if (newErrors !== undefined) {
              const decorations = DecorationSet.create(newState.doc, newErrors.flatMap((error: GrammarError) => {
                if (error.start >= error.end || error.end > newState.doc.content.size) {
                  console.warn('[GrammarExtension] Invalid error range, skipping:', error);
                  return [];
                }
                const suggestions = error.suggestions || [];
                return Decoration.inline(error.start, error.end, {
                  class: `grammar-error ${error.type}`,
                  'data-error-id': error.id,
                  'data-error-json': JSON.stringify(error),
                  'aria-label': `Potential ${error.type} error: “${error.error}”. Suggestion: “${suggestions[0] || ''}”.`,
                });
              }));
              return { decorations };
            }

            if (tr.docChanged) {
              return { decorations: pluginState.decorations.map(tr.mapping, newState.doc) };
            }

            return pluginState;
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