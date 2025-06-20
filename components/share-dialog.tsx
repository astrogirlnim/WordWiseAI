"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import type { Invitation } from '@/types/invitation'
import { InvitationService, CreateInvitationsResult } from '@/services/invitation-service'
import { X, Copy, Link as LinkIcon, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ShareDialogProps {
  document: Document
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onRemoveAccess: (userId: string) => Promise<void>
  onUpdateRole: (userId: string, role: 'editor' | 'commenter' | 'viewer') => Promise<void>
  onUpdatePublicAccess: (isPublic: boolean, publicViewMode: 'view' | 'comment' | 'disabled') => Promise<void>
}

const getInitials = (email: string) => {
  return email.substring(0, 2).toUpperCase()
}

export function ShareDialog({
  document,
  isOpen,
  onOpenChange,
  onRemoveAccess,
  onUpdateRole,
  onUpdatePublicAccess,
}: ShareDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [emailInput, setEmailInput] = useState('')
  const [role, setRole] = useState<'editor' | 'commenter' | 'viewer'>('viewer')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedInvitations, setGeneratedInvitations] = useState<CreateInvitationsResult['newlyInvited']>([])
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([])
  const [view, setView] = useState<'idle' | 'link_generated'>('idle')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const fetchPendingInvitations = async () => {
    if (document.id) {
      const invites = await InvitationService.getPendingInvitations(document.id)
      setPendingInvitations(invites)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchPendingInvitations()
      setView('idle')
      setGeneratedInvitations([])
      setEmailInput('')
    }
  }, [isOpen, document.id])

  const handleCreateInvitationLink = async () => {
    if (!emailInput || !user) return
    const emails = emailInput.split(',').map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) return

    setIsGenerating(true)
    try {
      const result = await InvitationService.createInvitations(document.id, emails, role, user.uid)
      
      if (result.newlyInvited.length > 0) {
        setGeneratedInvitations(result.newlyInvited)
        setView('link_generated')
      }

      let toastDescription = '';
      if (result.newlyInvited.length > 0) {
        toastDescription += `Invitation links created for: ${result.newlyInvited.map(i => i.email).join(', ')}. `;
      }
      if (result.alreadyInvited.length > 0) {
        toastDescription += `Already invited: ${result.alreadyInvited.join(', ')}. `;
      }
      if (result.alreadyMember.length > 0) {
        toastDescription += `Already members: ${result.alreadyMember.join(', ')}. `;
      }

      toast({
        title: 'Invitation Process Complete',
        description: toastDescription.trim(),
      })

      setEmailInput('')
      fetchPendingInvitations()
    } catch (error) {
      console.error('Failed to create invitation link', error)
      toast({
        title: 'Error',
        description: 'Failed to create invitation link.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await InvitationService.revokeInvitation(invitationId)
      toast({
        title: 'Invitation Revoked',
        description: 'The invitation has been successfully revoked.',
      })
      fetchPendingInvitations()
    } catch (error) {
      console.error('Failed to revoke invitation', error)
      toast({
        title: 'Error',
        description: 'Failed to revoke the invitation.',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string, link: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
    toast({
      title: 'Link copied!',
      description: 'Copied to your clipboard.',
    });
  };
  
  const handleDone = () => {
    onOpenChange(false);
  };

  const handleInviteAnother = () => {
    setView('idle');
    setGeneratedInvitations([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Share &quot;{document.title}&quot;</DialogTitle>
        </DialogHeader>

        {/* Section 1: Public Access */}
        <div className="pt-2">
            <h4 className="text-sm font-medium">Public Access</h4>
            <p className="text-sm text-muted-foreground pt-1">
              Publish your document and get a shareable link.
            </p>
          <div className="flex items-center justify-between mt-4">
            <Label htmlFor="public-access" className="flex flex-col gap-1 cursor-pointer">
              <span>Anyone with the link can...</span>
            </Label>
            <div className="flex items-center gap-2">
              <Select
                disabled={!document.isPublic}
                value={document.isPublic ? document.publicViewMode : 'disabled'}
                onValueChange={(value) => onUpdatePublicAccess(true, value as 'view' | 'comment' | 'disabled')}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">view</SelectItem>
                  <SelectItem value="comment">comment</SelectItem>
                </SelectContent>
              </Select>
              <Switch
                id="public-access"
                checked={document.isPublic}
                onCheckedChange={(checked) =>
                  onUpdatePublicAccess(checked, checked ? 'view' : 'disabled')
                }
              />
            </div>
          </div>
           {document.isPublic && (
            <div className="mt-4 flex items-center gap-2">
                <Input value={`${window.location.origin}/doc/${document.id}`} readOnly className="flex-1 bg-muted/50" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(`${window.location.origin}/doc/${document.id}`, 'public')}>
                  {copiedLink === 'public' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
           )}
        </div>

        <div className="border-t -mx-6 my-4"></div>

        {/* Section 2: Invite by Link */}
        <div className="pt-2">
           <h4 className="text-sm font-medium">Invite by Link</h4>
            <p className="text-sm text-muted-foreground pt-1">
              Generate a secure, private link for specific people.
            </p>
          {view === 'idle' ? (
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
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="commenter">Commenter</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreateInvitationLink} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Get Link'}
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 rounded-md border bg-muted/50 p-4">
              <h4 className="text-sm font-medium">Invitation Links Generated</h4>
              {generatedInvitations.map((invite, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={invite.link} readOnly className="flex-1" placeholder={invite.email}/>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(invite.link, invite.link)}>
                    {copiedLink === invite.link ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
               <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={handleInviteAnother}>Invite Another</Button>
                <Button onClick={handleDone}>Done</Button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t -mx-6 my-4"></div>

        {/* Section 3: People with Access */}
        <div className="pt-2 flex-1 overflow-y-auto max-h-60">
          <h4 className="text-sm font-medium">People with access</h4>
           <div className="mt-4 space-y-3">
             {/* Display Owner */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar><AvatarFallback>{user?.email ? getInitials(user.email) : 'ME'}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.email} (You)</p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground pr-4">Owner</span>
              </div>

             {/* Active Collaborators */}
             {document.sharedWith
              .filter(access => access.userId !== document.ownerId)
              .map((access) => (
              <div key={access.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar><AvatarFallback>{getInitials(access.email)}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{access.email}</p>
                    <p className="text-xs text-muted-foreground">Member</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={access.role} onValueChange={(newRole) => onUpdateRole(access.userId, newRole as 'editor' | 'commenter' | 'viewer')}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="commenter">Commenter</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  {user?.uid === document.ownerId && (
                    <Button variant="ghost" size="icon" onClick={() => onRemoveAccess(access.userId)}><X className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            ))}
            {/* Pending Invitations */}
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar><AvatarFallback><LinkIcon className="h-4 w-4 text-muted-foreground" /></AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">Pending Invitation</p>
                  </div>
                </div>
                {user?.uid === document.ownerId && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm capitalize text-muted-foreground w-[120px] text-center">{invitation.role}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRevokeInvitation(invitation.id)}><X className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
} 