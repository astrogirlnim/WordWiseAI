import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { GrammarError } from '@/types/grammar';

export const GrammarExtension = Extension.create<{ errors: GrammarError[] }>({
  name: 'grammar',

  addOptions() {
    return {
      errors: [],
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('grammar'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply: (tr, oldSet) => {
            // No need to update decorations on transactions, we'll do it via props
            return oldSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { errors } = this.options;

            errors.forEach((error) => {
              decorations.push(
                Decoration.inline(error.start, error.end, {
                  class: `grammar-error ${error.type}`,
                  'data-error': error.error,
                  'data-correction': error.correction,
                  'data-explanation': error.explanation,
                }),
              );
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
}); 