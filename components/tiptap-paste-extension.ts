import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

interface PasteExtensionOptions {
  onPaste?: (content: string) => void
}

/**
 * TipTap extension that intercepts paste events and triggers callbacks
 * This ensures that all paste operations (keyboard shortcuts, context menu, etc.)
 * are properly handled and trigger auto-save/version history
 */
export const PasteExtension = Extension.create<PasteExtensionOptions>({
  name: 'paste-handler',

  addOptions() {
    return {
      onPaste: undefined,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('paste-handler'),
        props: {
          handlePaste: (view: any, event: ClipboardEvent, slice: any) => {
            console.log('[PasteExtension] Paste event detected in TipTap editor')
            
            // Let TipTap handle the paste operation first
            // We'll trigger our callback after the content is inserted
            setTimeout(() => {
              console.log('[PasteExtension] Triggering post-paste callback')
              const newContent = view.state.doc.textContent
              console.log('[PasteExtension] New content length after paste:', newContent.length)
              
              if (this.options.onPaste) {
                this.options.onPaste(newContent)
              }
            }, 50) // Short delay to ensure paste operation completes
            
            // Return false to let TipTap handle the paste normally
            return false
          },
          
          // Also handle paste via transformPastedHTML for HTML content
          transformPastedHTML: (html: string) => {
            console.log('[PasteExtension] HTML paste detected, content length:', html.length)
            
            // Trigger callback after paste
            setTimeout(() => {
              console.log('[PasteExtension] Triggering post-HTML-paste callback')
              if (this.options.onPaste) {
                // We need to get the latest content from the editor
                // This will be handled by the handlePaste hook above
              }
            }, 50)
            
            return html
          }
        }
      })
    ]
  }
})