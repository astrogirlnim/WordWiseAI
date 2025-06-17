'use client'

import type { Comment } from '@/types/comment'
import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { formatDistanceToNow } from 'date-fns'

interface CommentThreadProps {
  comments: Comment[]
  onAddComment: (content: string) => void
  onResolve: () => void
  isResolved: boolean
}

export function CommentThread({
  comments,
  onAddComment,
  onResolve,
  isResolved,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment)
      setNewComment('')
    }
  }

  return (
    <div className="absolute z-10 w-80 rounded-lg border bg-card p-4 text-card-foreground shadow-lg">
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://avatar.vercel.sh/${comment.userId}.png`} />
              <AvatarFallback>{/* User initials */}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{/* User name */}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
      {!isResolved && (
        <div className="mt-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Reply..."
            className="mb-2"
          />
          <div className="flex justify-between">
            <Button size="sm" onClick={handleSubmit}>
              Reply
            </Button>
            <Button size="sm" variant="outline" onClick={onResolve}>
              Resolve
            </Button>
          </div>
        </div>
      )}
      {isResolved && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Thread resolved.
        </div>
      )}
    </div>
  )
} 