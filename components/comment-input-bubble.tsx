/**
 * @fileoverview A stylish floating bubble for comment input
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { MessageSquarePlus, X, Send } from 'lucide-react'

interface CommentInputBubbleProps {
  isVisible: boolean
  position: { x: number; y: number }
  selectedText: string
  onSubmit: (content: string) => void
  onCancel: () => void
}

export function CommentInputBubble({
  isVisible,
  position,
  selectedText,
  onSubmit,
  onCancel,
}: CommentInputBubbleProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isVisible])

  useEffect(() => {
    if (isVisible) {
      setContent('')
    }
  }, [isVisible])

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim())
      setContent('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y + 10, window.innerHeight - 200),
      }}
    >
      <Card className="w-80 shadow-lg border-2 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquarePlus className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Add Comment</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
              onClick={onCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {selectedText && (
            <div className="mb-3 p-2 bg-muted/50 rounded text-xs border-l-2 border-primary/50">
              <span className="text-muted-foreground">Commenting on:</span>
              <p className="italic mt-1 line-clamp-2">&quot;{selectedText}&quot;</p>
            </div>
          )}
          
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your comment..."
            className="min-h-[80px] resize-none"
            onKeyDown={handleKeyDown}
          />
          
          <div className="text-xs text-muted-foreground mt-2">
            Press Ctrl+Enter to submit, Esc to cancel
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2 p-4 pt-0">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            <Send className="h-3 w-3 mr-2" />
            Comment
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 