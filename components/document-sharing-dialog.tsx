'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { DocumentSharingService } from '@/services/document-sharing-service'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
import {
  Copy,
  Mail,
  Shield,
  Eye,
  MessageSquare,
  Edit,
  Crown,
  Link,
  Trash2,
  Users,
  Clock,
} from 'lucide-react'
import type { Document, DocumentAccess, FirestoreTimestamp } from '@/types/document'

interface DocumentSharingDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
}

interface ShareToken {
  id: string
  documentId: string
  createdBy: string
  email: string
  role: 'viewer' | 'commenter' | 'editor'
  expiresAt?: FirestoreTimestamp
  isUsed: boolean
  usedAt?: FirestoreTimestamp
  createdAt: FirestoreTimestamp
}

export function DocumentSharingDialog({
  isOpen,
  onOpenChange,
  document,
}: DocumentSharingDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Form state for generating new share links
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'commenter' | 'editor'>('viewer')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Current sharing state
  const [shareTokens, setShareTokens] = useState<ShareToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Permission management state
  const [userToRemove, setUserToRemove] = useState<string | null>(null)
  const [updatingPermissions, setUpdatingPermissions] = useState<string | null>(null)

  console.log('[DocumentSharingDialog] Rendered with document:', document?.id, 'isOpen:', isOpen)

  const loadSharingInfo = useCallback(async () => {
    if (!document || !user) {
      console.log('[DocumentSharingDialog] Missing document or user for loading sharing info')
      return
    }

    console.log('[DocumentSharingDialog] Loading sharing info for document:', document.id)
    setIsLoading(true)
    
    try {
      const { activeTokens } = await DocumentSharingService.getDocumentSharingInfo(
        document.id,
        user.uid
      )
      
      console.log('[DocumentSharingDialog] Loaded', activeTokens.length, 'active share tokens')
      setShareTokens(activeTokens as unknown as ShareToken[])
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

  // Load sharing information when dialog opens
  useEffect(() => {
    if (isOpen && document && user) {
      loadSharingInfo()
    }
  }, [isOpen, document, user, loadSharingInfo])

  const handleGenerateLink = async () => {
    if (!document || !user || !email.trim()) {
      console.log('[DocumentSharingDialog] Missing required data for link generation')
      return
    }

    console.log('[DocumentSharingDialog] Generating share link for:', { email, role, documentId: document.id })
    setIsGenerating(true)
    
    try {
      const { url } = await DocumentSharingService.generateShareLink(
        document.id,
        email.trim(),
        role,
        user.uid
      )
      
      console.log('[DocumentSharingDialog] Share link generated:', url)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url)
      
      // Reset form
      setEmail('')
      setRole('viewer')
      
      // Reload sharing info to show new token
      await loadSharingInfo()
      
      toast({
        title: 'Share Link Generated!',
        description: `Link copied to clipboard. Send it to ${email} to grant ${role} access.`,
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
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com'
    const shareUrl = `${baseUrl}/share/${token.id}`
    
    console.log('[DocumentSharingDialog] Copying share URL to clipboard:', shareUrl)
    
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
    if (!document || !user) {
      console.log('[DocumentSharingDialog] Missing document or user for token revocation')
      return
    }

    console.log('[DocumentSharingDialog] Revoking share token:', tokenId)
    
    try {
      await DocumentSharingService.revokeShareToken(tokenId, user.uid)
      
      // Reload sharing info
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

  const handleUpdatePermissions = async (userId: string, newRole: 'viewer' | 'commenter' | 'editor') => {
    if (!document || !user) {
      console.log('[DocumentSharingDialog] Missing document or user for permission update')
      return
    }

    console.log('[DocumentSharingDialog] Updating permissions for user:', userId, 'to role:', newRole)
    setUpdatingPermissions(userId)
    
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
      
      // In a real app, we'd need to refresh the document data to see updated sharedWith array
      // For now, we'll just show the success message
    } catch (error) {
      console.error('[DocumentSharingDialog] Error updating permissions:', error)
      toast({
        title: 'Error Updating Permissions',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingPermissions(null)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!document || !user) {
      console.log('[DocumentSharingDialog] Missing document or user for user removal')
      return
    }

    console.log('[DocumentSharingDialog] Removing user access:', userId)
    
    try {
      await DocumentSharingService.removeUserAccess(document.id, userId, user.uid)
      
      toast({
        title: 'Access Removed',
        description: 'User access has been removed from this document.',
      })
      
      // In a real app, we'd need to refresh the document data
      setUserToRemove(null)
    } catch (error) {
      console.error('[DocumentSharingDialog] Error removing user:', error)
      toast({
        title: 'Error Removing Access',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'commenter':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'editor':
        return 'secondary'
      case 'commenter':
        return 'outline'
      case 'viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatDate = (timestamp: FirestoreTimestamp) => {
    if (!timestamp) return 'N/A'
    
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp)
    } else if (typeof (timestamp as any)?.toMillis === 'function') {
      date = new Date((timestamp as any).toMillis())
    } else {
      return 'Invalid date'
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!document) {
    return null
  }

  const isOwner = document.ownerId === user?.uid

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share &quot;{document.title}&quot;
          </DialogTitle>
          <DialogDescription>
            Manage who can access this document and their permission levels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate New Share Link Section */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Generate Share Link
                </CardTitle>
                <CardDescription>
                  Create a secure link to invite someone to collaborate on this document.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Permission Level</Label>
                    <Select value={role} onValueChange={(value: any) => setRole(value)} disabled={isGenerating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Viewer - Can read only
                          </div>
                        </SelectItem>
                        <SelectItem value="commenter">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Commenter - Can read and comment
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Editor - Can read, comment, and edit
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleGenerateLink}
                  disabled={!email.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating Link...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Generate & Copy Link
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Active Share Tokens Section */}
          {isOwner && shareTokens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Pending Invitations ({shareTokens.length})
                </CardTitle>
                <CardDescription>
                  Links that have been generated but not yet used.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shareTokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(token.role)}
                          <div>
                            <p className="font-medium">{token.email}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Created {formatDate(token.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(token.role)}>
                          {token.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Share Link?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will prevent the link from being used. If {token.email} has already 
                                used the link, you&apos;ll need to remove their access separately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevokeToken(token.id)}>
                                Revoke Link
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Collaborators Section */}
          {(document.sharedWith.length > 0 || isOwner) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Current Collaborators ({document.sharedWith.length + 1})
                </CardTitle>
                <CardDescription>
                  People who currently have access to this document.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Document Owner */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="font-medium">
                            {user?.uid === document.ownerId ? 'You' : 'Document Owner'}
                          </p>
                          <p className="text-sm text-muted-foreground">Owner of this document</p>
                        </div>
                      </div>
                      <Badge variant="default">owner</Badge>
                    </div>
                  </div>

                  {/* Shared Users */}
                  {document.sharedWith.map((access: DocumentAccess) => (
                    <div key={access.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(access.role)}
                          <div>
                            <p className="font-medium">{access.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Added {formatDate(access.addedAt)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(access.role)}>
                          {access.role}
                        </Badge>
                      </div>
                      
                      {isOwner && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={access.role}
                            onValueChange={(newRole: any) => handleUpdatePermissions(access.userId, newRole)}
                            disabled={updatingPermissions === access.userId}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="commenter">Commenter</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <AlertDialog open={userToRemove === access.userId} onOpenChange={(open: boolean) => !open && setUserToRemove(null)}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserToRemove(access.userId)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Access?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove {access.email}&apos;s access to this document. 
                                  They will no longer be able to view, comment, or edit.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveUser(access.userId)}>
                                  Remove Access
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading sharing information...</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}