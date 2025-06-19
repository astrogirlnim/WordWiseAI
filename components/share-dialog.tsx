"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import type { Document } from '@/types/document'
import { X, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ShareDialogProps {
  document: Document
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onShare: (emails: string[], role: 'editor' | 'commenter' | 'viewer') => Promise<void>
  onRemoveAccess: (userId: string) => Promise<void>
  onUpdateRole: (userId: string, role: 'editor' | 'commenter' | 'viewer') => Promise<void>
}

const getInitials = (email: string) => {
  return email.substring(0, 2).toUpperCase()
}

export function ShareDialog({
  document,
  isOpen,
  onOpenChange,
  onShare,
  onRemoveAccess,
  onUpdateRole,
}: ShareDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [emailInput, setEmailInput] = useState('')
  const [role, setRole] = useState<'editor' | 'commenter' | 'viewer'>('editor')
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (!emailInput) return
    const emails = emailInput.split(',').map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) return

    setIsSharing(true)
    try {
      await onShare(emails, role)
      setEmailInput('')
      toast({
        title: 'Document shared',
        description: `Successfully shared with ${emails.join(', ')}.`,
      })
    } catch (error) {
      console.error('Failed to share document', error)
      toast({
        title: 'Error',
        description: 'Failed to share document. The user might not exist or you may not have permission.',
        variant: 'destructive',
      })
    } finally {
      setIsSharing(false)
    }
  }
  
  const handleCopyLink = () => {
    const link = `${window.location.origin}/doc/${document.id}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link copied',
      description: 'Shareable link has been copied to your clipboard.',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Share &quot;{document.title}&quot;</DialogTitle>
          <DialogDescription>
            Share this document with others. They&apos;ll receive access based on the role you assign.
          </DialogDescription>
        </DialogHeader>
        <div className="flex space-x-2 pt-4">
          <Input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter one or more emails..."
            className="flex-1"
          />
          <Select value={role} onValueChange={(value) => setRole(value as 'editor' | 'commenter' | 'viewer')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="commenter">Commenter</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleShare} disabled={isSharing}>
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>
        </div>
        
        <div className="py-4">
          <h4 className="text-sm font-medium">People with access</h4>
          <div className="space-y-2 mt-2">
            {document.sharedWith.map((access) => (
              <div key={access.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(access.email)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{access.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {access.userId === document.ownerId ? 'Owner' : 'Member'}
                    </p>
                  </div>
                </div>
                {access.userId !== document.ownerId ? (
                  <Select
                    value={access.role}
                    onValueChange={(newRole) => onUpdateRole(access.userId, newRole as 'editor' | 'commenter' | 'viewer')}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="editor">Editor</SelectItem>
                       <SelectItem value="commenter">Commenter</SelectItem>
                       <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm text-muted-foreground">Owner</span>
                )}
                {access.userId !== document.ownerId && user?.uid === document.ownerId && (
                  <Button variant="ghost" size="icon" onClick={() => onRemoveAccess(access.userId)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
            <div className='flex gap-2'>
                <Button variant="secondary" onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy link
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 