'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface CommentPopupProps {
  onAddComment: (content: string) => void
  onCancel: () => void
  position: { top: number; left: number }
}

export function CommentPopup({ onAddComment, onCancel, position }: CommentPopupProps) {
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (comment.trim()) {
      onAddComment(comment)
    }
  }

  return (
    <div
      className="absolute z-20 w-80 rounded-lg border bg-card p-4 text-card-foreground shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        className="mb-2"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit}>
          Comment
        </Button>
      </div>
    </div>
  )
} 