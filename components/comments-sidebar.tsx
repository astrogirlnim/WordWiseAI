import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  MessageSquare, 
  Check, 
  RotateCcw, 
  Edit, 
  Trash2, 
  Send,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useComments } from '@/hooks/use-comments'
import { useAuth } from '@/lib/auth-context'
import type { Comment } from '@/types/comment'

interface CommentsSidebarProps {
  documentId: string | null
  isOpen: boolean
  onClose: () => void
}

export function CommentsSidebar({ documentId, isOpen, onClose }: CommentsSidebarProps) {
  const { user } = useAuth()
  const {
    comments,
    commentStats,
    loading,
    addingComment,
    resolveComment,
    unresolveComment,
    deleteComment,
    updateComment,
    showResolved,
    setShowResolved
  } = useComments(documentId)

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  console.log('[CommentsSidebar] Rendering with:', {
    isOpen,
    documentId,
    commentsCount: comments.length,
    loading
  })

  if (!isOpen) return null

  const handleStartEdit = (comment: Comment) => {
    console.log('[CommentsSidebar] Starting edit for comment:', comment.id)
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async () => {
    if (!editingCommentId) return

    console.log('[CommentsSidebar] Saving edit for comment:', editingCommentId)
    await updateComment(editingCommentId, editContent)
    setEditingCommentId(null)
    setEditContent('')
  }

  const handleCancelEdit = () => {
    console.log('[CommentsSidebar] Canceling edit')
    setEditingCommentId(null)
    setEditContent('')
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed right-0 top-14 bottom-0 w-80 border-l bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-semibold">Comments</h2>
            {commentStats.total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {commentStats.active} active
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Stats and Controls */}
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total: {commentStats.total}</span>
            <span>Resolved: {commentStats.resolved}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-resolved" className="text-sm">
              Show resolved comments
            </Label>
            <Switch
              id="show-resolved"
              checked={showResolved}
              onCheckedChange={setShowResolved}
            />
          </div>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              </div>
            </div>
          )}

          {!loading && comments.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No comments yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select text in the document to add a comment
                </p>
              </div>
            </div>
          )}

          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={user?.uid}
              isEditing={editingCommentId === comment.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onStartEdit={() => handleStartEdit(comment)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onResolve={() => resolveComment(comment.id)}
              onUnresolve={() => unresolveComment(comment.id)}
              onDelete={() => deleteComment(comment.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface CommentCardProps {
  comment: Comment
  currentUserId?: string
  isEditing: boolean
  editContent: string
  onEditContentChange: (content: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onResolve: () => void
  onUnresolve: () => void
  onDelete: () => void
  formatDate: (timestamp: number) => string
}

function CommentCard({
  comment,
  currentUserId,
  isEditing,
  editContent,
  onEditContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onResolve,
  onUnresolve,
  onDelete,
  formatDate
}: CommentCardProps) {
  const isAuthor = comment.authorId === currentUserId
  const isResolved = comment.status === 'resolved'

  return (
    <Card className={`${isResolved ? 'opacity-60' : ''} transition-opacity`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://avatar.vercel.sh/${comment.authorEmail}`} />
              <AvatarFallback className="text-xs">
                {comment.authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{comment.authorName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
                {comment.isEdited && (
                  <span className="ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {isResolved ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
          </div>
        </div>

        {/* Anchored Text */}
        {comment.anchoredText && (
          <div className="mt-2 p-2 bg-muted rounded text-xs">
            <p className="text-muted-foreground mb-1">Referenced text:</p>
            <p className="italic">"{comment.anchoredText}"</p>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              placeholder="Edit your comment..."
              className="min-h-20"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSaveEdit}>
                <Send className="mr-1 h-3 w-3" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{comment.content}</p>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {isResolved ? (
                <Button size="sm" variant="outline" onClick={onUnresolve}>
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reopen
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onResolve}>
                  <Check className="mr-1 h-3 w-3" />
                  Resolve
                </Button>
              )}
              
              {isAuthor && !isResolved && (
                <>
                  <Button size="sm" variant="ghost" onClick={onStartEdit}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onDelete}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Resolution Info */}
        {isResolved && comment.resolvedAt && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Resolved on {formatDate(comment.resolvedAt)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}