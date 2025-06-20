/**
 * @fileoverview A sidebar component for displaying and managing comments.
 */

'use client'

import type { FC } from 'react'
import { useState, useEffect } from 'react'
import type { Comment } from '@/types/comment'
import type { UserProfile as User } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, X, Trash2, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CommentsSidebarProps {
  isOpen: boolean
  onClose: () => void
  comments: Comment[]
  currentUser: User | null
  onAddComment: (commentData: Pick<Comment, 'content' | 'anchorStart' | 'anchorEnd' | 'anchoredText'>) => void
  onResolveComment: (commentId: string) => void
  onDeleteComment: (commentId: string) => void
  onReactivateComment: (commentId: string) => void
  activeCommentId?: string | null
  setActiveCommentId?: (id: string | null) => void
  className?: string
  isDocumentOwner?: boolean
}

const getInitials = (name: string = 'Anonymous') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const CommentThread: FC<{
  comment: Comment
  currentUser: User | null
  onResolve: (id: string) => void
  onDelete: (id: string) => void
  onReactivate: (id: string) => void
  isDocumentOwner?: boolean
}> = ({ comment, currentUser, onResolve, onDelete, onReactivate, isDocumentOwner }) => {
  const isAuthor = currentUser?.id === comment.authorId
  const canDelete = isAuthor || isDocumentOwner
  const canResolve = isAuthor || isDocumentOwner

  return (
    <Card className="mb-4 bg-card/70 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {/* Assuming author might have an avatar, otherwise fallback to initials */}
            <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{comment.authorName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {comment.status === 'active' && canResolve && (
            <Button variant="ghost" size="sm" onClick={() => onResolve(comment.id)}>
              Resolve
            </Button>
          )}
          {comment.status === 'resolved' && canResolve && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onReactivate(comment.id)}
              title="Reactivate comment"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(comment.id)}
              className="text-destructive hover:text-destructive"
              title="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 text-sm">
        <p>{comment.content}</p>
        {comment.anchoredText && comment.anchoredText !== 'General comment' && (
            <p className="mt-2 border-l-2 border-muted pl-2 text-muted-foreground italic text-xs">
                {`"${comment.anchoredText}"`}
            </p>
        )}
      </CardContent>
      {comment.status === 'resolved' && (
        <CardFooter className="p-3 text-xs text-muted-foreground">
            Resolved {comment.resolvedAt ? formatDistanceToNow(new Date(comment.resolvedAt), { addSuffix: true }) : ''}
        </CardFooter>
      )}
    </Card>
  )
}


export const CommentsSidebar: FC<CommentsSidebarProps> = ({
  isOpen,
  onClose,
  comments,
  currentUser,
  onAddComment,
  onResolveComment,
  onDeleteComment,
  onReactivateComment,
  isDocumentOwner = false,
}) => {
  const [newComment, setNewComment] = useState('')

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Create a general document comment (not anchored to specific text)
      onAddComment({ 
        content: newComment, 
        anchorStart: 0, 
        anchorEnd: 0, 
        anchoredText: 'General comment' 
      })
      setNewComment('')
    }
  }

  const handleReactivateComment = (commentId: string) => {
    onReactivateComment(commentId)
  }
  
  const activeComments = comments.filter(c => c.status === 'active');
  const resolvedComments = comments.filter(c => c.status === 'resolved');

  useEffect(() => {
    if (activeComments.length === 0) {
      console.log('No active comments. Prompting user to add a comment.');
    }
  }, [activeComments.length]);

  return (
    <aside className={`fixed top-0 right-0 z-40 h-full w-96 bg-background/80 backdrop-blur-sm border-l border-border/60 transform transition-transform duration-300 ease-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border/60 p-4">
          <h2 className="text-lg font-semibold">Comments ({activeComments.length})</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {activeComments.length > 0 ? (
              activeComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onResolve={onResolveComment}
                  onDelete={onDeleteComment}
                  onReactivate={handleReactivateComment}
                  isDocumentOwner={isDocumentOwner}
                />
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-10">
                No active comments. Select text in the editor and click &quot;Add Comment&quot; to start a discussion.
              </div>
            )}
            
            {resolvedComments.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mt-6 mb-2">Resolved ({resolvedComments.length})</h3>
                    {resolvedComments.map((comment) => (
                        <CommentThread
                          key={comment.id}
                          comment={comment}
                          currentUser={currentUser}
                          onResolve={onResolveComment}
                          onDelete={onDeleteComment}
                          onReactivate={handleReactivateComment}
                          isDocumentOwner={isDocumentOwner}
                        />
                    ))}
                </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border/60 p-4">
          <Card>
            <CardContent className="p-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a general comment about this document..."
                className="w-full border-0 focus:ring-0 resize-none shadow-none"
                rows={3}
              />
            </CardContent>
            <CardFooter className="flex justify-end p-2">
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </aside>
  )
} 