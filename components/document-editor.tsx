'use client'

import type React from 'react'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAutoSave } from '@/hooks/use-auto-save'
import { getWordCount, getCharacterCount } from '@/utils/document-utils'
import { DocumentStatusBar } from './document-status-bar'
import type { Document } from '@/types/document'
import type { AISuggestion } from '@/types/ai-features'
import { Button } from './ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  syncDocument,
  syncPresence,
  getPresence,
  UserPresence,
} from '@/services/collaboration-service'
import { RemoteCursor } from './remote-cursor'
import { useAuth } from '@/lib/auth-context'
import { CollaboratorAvatars } from './collaborator-avatars'
import { CommentPopup } from './comment-popup'
import { CommentThread } from './comment-thread'
import { getComments, addComment, resolveComment } from '@/services/comment-service'
import type { Comment } from '@/types/comment'
import { VersionHistorySidebar } from './version-history-sidebar'
import { DocumentService } from '@/services/document-service'
import { ToneAnalysis } from './tone-analysis'

interface DocumentEditorProps {
  initialDocument?: Partial<Document> & { id: string } // id is required for collaboration
  onSave?: (content: string) => Promise<void>
  onContentChange?: (content: string) => void
  suggestions?: AISuggestion[]
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
}

export function DocumentEditor({
  initialDocument = { id: 'default-id', content: '', title: 'Untitled Document' },
  onSave = async (content: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('Document saved:', content.slice(0, 50) + '...')
  },
  onContentChange,
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialDocument.content || '')
  const [title, setTitle] = useState(
    initialDocument.title || 'Untitled Document',
  )
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const [remoteUsers, setRemoteUsers] = useState<UserPresence[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [showCommentPopup, setShowCommentPopup] = useState<{top: number, left: number} | null>(null)
  const [selection, setSelection] = useState<{start: number, end: number} | null>(null)

  useEffect(() => {
    if (!initialDocument.id || !user) return

    const unsubscribeComments = getComments(initialDocument.id, setComments)

    const updateContent = syncDocument(initialDocument.id, (newContent) => {
      setContent(newContent)
    })

    const updateMyPresence = syncPresence(initialDocument.id, {
      id: user.uid,
      name: user.displayName || 'Anonymous',
      color: '#FF0000', // This should be dynamic
      cursorPosition: 0,
    })

    getPresence(initialDocument.id, (users) => {
      setRemoteUsers(users.filter((u) => u.id !== user.uid))
    })

    const handleCursorChange = () => {
        if(textareaRef.current) {
            updateMyPresence(textareaRef.current.selectionStart)
        }
    }

    textareaRef.current?.addEventListener('keyup', handleCursorChange)
    textareaRef.current?.addEventListener('click', handleCursorChange)


    return () => {
        textareaRef.current?.removeEventListener('keyup', handleCursorChange)
        textareaRef.current?.removeEventListener('click', handleCursorChange)
        unsubscribeComments()
    }

  }, [initialDocument.id, user])

  const handleRestoreVersion = async (versionId: string) => {
    // This is a simplified implementation. A real implementation would
    // probably fetch the version content and update the current document.
    console.log('Restoring version:', versionId)
  }

  const { saveStatus } = useAutoSave({
    content,
    onSave,
    delay: 2000,
  })

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setContent(newContent)
      // This should be handled by the syncDocument function
      // onContentChange?.(newContent)
    },
    [onContentChange],
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value)
    },
    [],
  )

  const wordCount = getWordCount(content)
  const characterCount = getCharacterCount(content)

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current
      if (selectionEnd > selectionStart) {
        const rect = textareaRef.current.getBoundingClientRect()
        // This is a very simplified position calculation
        setShowCommentPopup({ top: rect.top + window.scrollY, left: rect.right + window.scrollX })
        setSelection({ start: selectionStart, end: selectionEnd })
      } else {
        setShowCommentPopup(null)
        setSelection(null)
      }
    }
  }

  const handleAddComment = (commentContent: string) => {
    if (selection && user) {
        addComment({
            docId: initialDocument.id,
            userId: user.uid,
            content: commentContent,
            anchorStart: selection.start,
            anchorEnd: selection.end,
        })
    }
    setShowCommentPopup(null)
  }

  // Mock data for readability metrics
  const fleschKincaidScore = 12.5
  const sentenceLengths = [12, 15, 8, 22, 18, 14, 16, 12, 25, 10, 11, 13]

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-6 py-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full border-none bg-transparent text-xl font-medium outline-none"
          placeholder="Untitled Document"
        />
        <div className="flex items-center gap-4">
          <CollaboratorAvatars users={remoteUsers} />
          <VersionHistorySidebar documentId={initialDocument.id} onRestoreVersion={handleRestoreVersion} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative mx-auto max-w-3xl px-6 py-8">
          {remoteUsers.map((u) => (
            <RemoteCursor key={u.id} user={u} textareaRef={textareaRef} />
          ))}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className="h-full min-h-[calc(100vh-200px)] w-full resize-none border-none bg-transparent text-lg leading-relaxed outline-none"
            placeholder="Start writing..."
            spellCheck={true}
          />
        </div>
        {showCommentPopup && (
            <CommentPopup 
                position={showCommentPopup}
                onAddComment={handleAddComment}
                onCancel={() => setShowCommentPopup(null)}
            />
        )}
      </div>

      <div className="mt-8">
        <ToneAnalysis fleschKincaidScore={fleschKincaidScore} sentenceLengths={sentenceLengths} />
      </div>

      {/* Status Bar */}
      <DocumentStatusBar
        saveStatus={saveStatus}
        wordCount={wordCount}
        characterCount={characterCount}
      />
    </div>
  )
}
