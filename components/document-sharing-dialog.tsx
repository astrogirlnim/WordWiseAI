'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { DocumentSharingService } from '@/services/document-sharing-service'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Copy,
  Eye,
  MessageSquare,
  Edit,
  Link as LinkIcon,
  Trash2,
  Users,
  MoreVertical,
  Loader2,
} from 'lucide-react'
import type { Document, ShareToken } from '@/types/document'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DocumentSharingDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
}

export function DocumentSharingDialog({
  isOpen,
  onOpenChange,
  document,
}: DocumentSharingDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'commenter' | 'editor'>('viewer')
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareTokens, setShareTokens] = useState<ShareToken[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadSharingInfo = useCallback(async () => {
    if (!document || !user) return
    setIsLoading(true)
    try {
      const { activeTokens } = await DocumentSharingService.getDocumentSharingInfo(
        document.id,
        user.uid
      )
      setShareTokens(activeTokens)
    } catch (error) {
      console.error('[DocumentSharingDialog] Error loading sharing info:', error)
      toast({
        title: 'Error Loading Sharing Information',
        description: 'Failed to load current sharing settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [document, user, toast])

  useEffect(() => {
    if (isOpen && document && user) {
      loadSharingInfo()
    }
  }, [isOpen, document, user, loadSharingInfo])

  const handleGenerateLink = async () => {
    if (!document || !user || !email.trim()) return
    setIsGenerating(true)
    try {
      const { url } = await DocumentSharingService.generateShareLink(
        document.id,
        email.trim(),
        role,
        user.uid
      )
      await navigator.clipboard.writeText(url)
      setEmail('')
      setRole('viewer')
      await loadSharingInfo()
      toast({
        title: 'Share Link Generated!',
        description: `Link for ${email} copied to clipboard.`,
      })
    } catch (error) {
      console.error('[DocumentSharingDialog] Error generating share link:', error)
      toast({
        title: 'Error Generating Share Link',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async (token: ShareToken) => {
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://your-app.com'
    const shareUrl = `${baseUrl}/share/${token.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link Copied!',
        description: `Share link for ${token.email} copied to clipboard.`,
      })
    } catch (error) {
      console.error('[DocumentSharingDialog] Error copying to clipboard:', error)
      toast({
        title: 'Error Copying Link',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    if (!document || !user) return
    try {
      await DocumentSharingService.revokeShareToken(tokenId, user.uid)
      await loadSharingInfo()
      toast({
        title: 'Link Revoked',
        description: 'The share link has been revoked and can no longer be used.',
      })
    } catch (error) {
      console.error('[DocumentSharingDialog] Error revoking token:', error)
      toast({
        title: 'Error Revoking Link',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdatePermissions = async (
    userId: string,
    newRole: 'viewer' | 'commenter' | 'editor'
  ) => {
    if (!document || !user) return
    try {
      await DocumentSharingService.updateUserPermissions(
        document.id,
        userId,
        newRole,
        user.uid
      )
      toast({
        title: 'Permissions Updated',
        description: `User permissions have been updated to ${newRole}.`,
      })
      // This part would ideally trigger a refresh of the document data from the parent component
    } catch (error) {
      console.error('[DocumentSharingDialog] Error updating permissions:', error)
      toast({
        title: 'Error Updating Permissions',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveAccess = async (userId: string) => {
    if (!document || !user) return
    try {
      await DocumentSharingService.removeUserAccess(document.id, userId, user.uid)
      toast({
        title: 'Access Removed',
        description: `User access has been successfully removed.`,
      })
      // This part would ideally trigger a refresh of the document data from the parent component
    } catch (error) {
      console.error('[DocumentSharingDialog] Error removing access:', error)
      toast({
        title: 'Error Removing Access',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">
            Share &quot;{document?.title}&quot;
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Left Section: Generate Link */}
          <div className="col-span-1 md:col-span-1 p-6 border-r border-border">
            <h3 className="text-lg font-semibold mb-4">Generate a New Share Link</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Permission Level</Label>
                <Select
                  value={role}
                  onValueChange={(value: 'viewer' | 'commenter' | 'editor') =>
                    setRole(value)
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Viewer
                      </div>
                    </SelectItem>
                    <SelectItem value="commenter">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Commenter
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center">
                        <Edit className="h-4 w-4 mr-2" />
                        Editor
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateLink} disabled={isGenerating || !email.trim()} className="w-full">
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="mr-2 h-4 w-4" />
                )}
                Generate & Copy Link
              </Button>
            </div>
          </div>
          
          {/* Right Section: Manage Access */}
          <div className="col-span-1 md:col-span-2 p-6">
            <div className="space-y-6">
              {/* People with Access */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-3 text-primary" />
                  People with Access
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {document?.sharedWith && document.sharedWith.length > 0 ? (
                    document.sharedWith.map(access => (
                      <div key={access.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={`https://avatar.vercel.sh/${access.email}.png`} />
                            <AvatarFallback>{access.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{access.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {access.userId === document.ownerId ? 'Owner' : access.role}
                            </p>
                          </div>
                        </div>
                        {access.userId === document.ownerId ? (
                          <Badge variant="secondary" className="text-xs">Owner</Badge>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8">
                                <span className="capitalize">{access.role}</span>
                                <MoreVertical className="h-4 w-4 ml-2" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdatePermissions(access.userId, 'viewer')}>Viewer</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdatePermissions(access.userId, 'commenter')}>Commenter</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdatePermissions(access.userId, 'editor')}>Editor</DropdownMenuItem>
                              <Separator />
                              <DropdownMenuItem className="text-red-500" onClick={() => handleRemoveAccess(access.userId)}>
                                Remove Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground p-2">Only you have access to this document.</p>
                  )}
                </div>
              </div>

              {/* Active Share Links */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <LinkIcon className="h-5 w-5 mr-3 text-primary" />
                  Active Share Links
                </h3>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : shareTokens.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {shareTokens.map(token => (
                      <div key={token.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                             <AvatarFallback>
                              <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{token.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{token.role} Link</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCopyLink(token)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy Link</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke Share Link?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke this link for {token.email}? They will no longer be able to access the document with this link.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRevokeToken(token.id)}>
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-2">No active share links have been generated.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}