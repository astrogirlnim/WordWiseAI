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
            console.log('[GrammarExtension] Phase 5: Initializing plugin state with empty decorations.');
            return { decorations: DecorationSet.empty };
          },
          apply: (tr: Transaction, pluginState: { decorations: DecorationSet }, oldState: EditorState, newState: EditorState) => {
            const newErrors = tr.getMeta('grammarErrors') as GrammarError[] | undefined;
            const isComposingUpdate = isComposing(newState) && !isComposing(oldState);

            // If the transaction doesn't contain new grammar errors, we just map the old decorations.
            // This is efficient and handles regular text edits.
            if (newErrors === undefined) {
              // If the user starts composing, clear decorations to avoid jank.
              if (isComposingUpdate) {
                console.log('[GrammarExtension] Phase 5: User is composing, clearing decorations temporarily.');
                return { decorations: DecorationSet.empty };
              }
              return { decorations: pluginState.decorations.map(tr.mapping, tr.doc) };
            }

            // If newErrors is present but not a valid array (e.g., null), clear the decorations.
            if (!Array.isArray(newErrors)) {
              console.warn('[GrammarExtension] Phase 5: Received invalid "grammarErrors" metadata. Clearing decorations.');
              return { decorations: DecorationSet.empty };
            }

            console.log(`[GrammarExtension] Phase 5: Received ${newErrors.length} new grammar errors from hook.`);

            // With Harper.js running client-side, we expect error positions to be accurate.
            // We perform a basic validation to filter out any errors with positions outside the document bounds,
            // which might occur in rare edge cases or race conditions.
            const validErrors = newErrors.filter(error => {
              const isValid = error &&
                typeof error.start === 'number' &&
                typeof error.end === 'number' &&
                error.start >= 0 &&
                error.end > error.start &&
                error.end <= newState.doc.content.size;
              
              if (!isValid) {
                console.warn(`[GrammarExtension] Phase 5: Filtering out invalid or out-of-bounds error:`, error, `Doc size: ${newState.doc.content.size}`);
              }
              
              return isValid;
            });

            if (validErrors.length === 0) {
              console.log('[GrammarExtension] Phase 5: No valid errors remain after filtering. Clearing decorations.');
              return { decorations: DecorationSet.empty };
            }

            console.log(`[GrammarExtension] Phase 5: Creating decorations for ${validErrors.length} valid errors.`);

            const decorations = DecorationSet.create(newState.doc, validErrors.flatMap((error: GrammarError) => {
              const suggestions = error.suggestions || [];
              
              // Create the inline decoration for the error
              return Decoration.inline(error.start, error.end, {
                class: `grammar-error ${error.type}`,
                'data-error-id': error.id,
                'data-error-json': JSON.stringify(error), // Store full error object for UI tooltips/popups
                'aria-label': `Potential ${error.type} error: "${error.error}". Suggestion: "${suggestions[0] || ''}".`,
              });
            }));
            
            console.log(`[GrammarExtension] Phase 5: Successfully created ${decorations.find().length} decorations.`);
            
            return { decorations };
          },
        },
        props: {
          decorations(state) {
            // While the user is in composition mode (e.g., typing with an IME), hide decorations
            // to prevent a jarring experience. We now handle this inside the `apply` function
            // for more robust state management, but keep this as a final guardrail.
            if (isComposing(state)) {
              const currentDecorations = this.getState(state)?.decorations;
              if (currentDecorations && currentDecorations.find().length > 0) {
                console.log('[GrammarExtension] Phase 5: isComposing guard cleared decorations.');
                return DecorationSet.empty;
              }
            }
            const pluginState = this.getState(state);
            return pluginState ? pluginState.decorations : DecorationSet.empty;
          },
        },
      }),
    ];
  },
}); 