/**
 * @fileoverview Tiptap extension for highlighting and interacting with comments.
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Comment } from '@/types/comment'

interface CommentExtensionOptions {
  onCommentClick: (commentId: string) => void
}

export const CommentHighlightExtension = Extension.create<CommentExtensionOptions>({
  name: 'commentHighlight',

  addOptions() {
    return {
      onCommentClick: () => {},
    }
  },

  addProseMirrorPlugins() {
    const { onCommentClick } = this.options

    return [
      new Plugin({
        key: new PluginKey('commentHighlight'),
        state: {
          init: (): DecorationSet => DecorationSet.empty,
          apply: (tr, old) => {
            const comments = tr.getMeta('comments') as Comment[] | undefined
            if (comments === undefined) {
              // No comment metadata in this transaction, just map existing decorations
              return old.map(tr.mapping, tr.doc)
            }
            
            console.log(`[CommentExtension] Processing ${comments.length} comments for decorations`)
            const activeComments = comments.filter(c => c.status === 'active')
            console.log(`[CommentExtension] ${activeComments.length} active comments will be highlighted`)
            console.log(`[CommentExtension] Active comment IDs:`, activeComments.map(c => c.id))
            
            // Always create a completely fresh decoration set when we have comment metadata
            // This ensures deleted comments are properly removed and highlights are accurate
            const decorations = activeComments
              .filter(comment => {
                // Validate comment positions to avoid invalid decorations
                const isValid = comment.anchorStart >= 0 && 
                               comment.anchorEnd <= tr.doc.content.size && 
                               comment.anchorStart < comment.anchorEnd
                if (!isValid) {
                  console.warn(`[CommentExtension] Invalid comment position for ${comment.id}: [${comment.anchorStart}, ${comment.anchorEnd}] (doc size: ${tr.doc.content.size})`)
                }
                return isValid
              })
              .map((comment) => {
                console.log(`[CommentExtension] Creating highlight for comment ${comment.id} at [${comment.anchorStart}, ${comment.anchorEnd}]`)
                return Decoration.inline(comment.anchorStart, comment.anchorEnd, {
                  class: 'comment-highlight',
                  'data-comment-id': comment.id,
                })
              })
            
            const decorationSet = DecorationSet.create(tr.doc, decorations)
            console.log(`[CommentExtension] Created fresh decoration set with ${decorations.length} decorations`)
            
            // Force a view update to ensure DOM is properly refreshed
            if (decorations.length !== old.find().length) {
              console.log(`[CommentExtension] Decoration count changed from ${old.find().length} to ${decorations.length}, forcing view refresh`)
            }
            
            return decorationSet
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
          handleClickOn(view, pos, node, nodePos, event) {
            const target = event.target as HTMLElement | null
            if (!target) return false

            const commentSpan = target.closest('.comment-highlight')
            if (commentSpan) {
              const commentId = commentSpan.getAttribute('data-comment-id')
              if (commentId) {
                onCommentClick(commentId)
                return true // Mark as handled
              }
            }
            return false
          },
        },
      }),
    ]
  },
}) 