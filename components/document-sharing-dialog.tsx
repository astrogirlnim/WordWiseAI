'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { DocumentSharingService } from '@/services/document-sharing-service'
import { useToast } from '@/hooks/use-toast'
import { validateUserEmail, normalizeEmail, formatFirestoreTimestamp } from '@/lib/utils'
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
  AlertCircle,
  Lock,
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
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [role, setRole] = useState<'viewer' | 'commenter' | 'editor'>('viewer')
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareTokens, setShareTokens] = useState<ShareToken[]>([])
  const [isLoading, setIsLoading] = useState(false)

  console.log('[DocumentSharingDialog] Component state:', {
    isOpen,
    documentId: document?.id,
    userId: user?.uid,
    userEmail: user?.email,
    authLoading,
    isLoading,
    isOwner: document?.ownerId === user?.uid
  })

  // Check if user is the document owner
  const isOwner = useCallback(() => {
    return document?.ownerId === user?.uid
  }, [document?.ownerId, user?.uid])

  // Authentication guard - ensure user is authenticated, has email, AND is the owner
  const isUserAuthorized = useCallback(() => {
    if (authLoading) {
      console.log('[DocumentSharingDialog] Authentication still loading')
      return false
    }
    if (!user) {
      console.log('[DocumentSharingDialog] No authenticated user')
      return false
    }
    if (!user.email) {
      console.log('[DocumentSharingDialog] User has no email address')
      return false
    }
    if (!isOwner()) {
      console.log('[DocumentSharingDialog] User is not the document owner')
      return false
    }
    return true
  }, [user, authLoading, isOwner])

  // Validate email input in real-time
  const handleEmailChange = useCallback((value: string) => {
    console.log('[DocumentSharingDialog] Email input changed:', value)
    setEmail(value)
    
    if (value.trim().length === 0) {
      setEmailError(null)
      return
    }
    
    const validation = validateUserEmail(value)
    if (!validation.isValid) {
      setEmailError(validation.error || 'Invalid email')
    } else {
      setEmailError(null)
    }
  }, [])

  const loadSharingInfo = useCallback(async () => {
    if (!document || !isUserAuthorized()) {
      console.log('[DocumentSharingDialog] Cannot load sharing info - missing requirements or not authorized')
      return
    }
    
    console.log('[DocumentSharingDialog] Loading sharing info for document:', document.id)
    setIsLoading(true)
    try {
      const { activeTokens } = await DocumentSharingService.getDocumentSharingInfo(
        document.id,
        user!.uid
      )
      console.log('[DocumentSharingDialog] Loaded sharing tokens:', activeTokens.length)
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
  }, [document, user, isUserAuthorized, toast])

  useEffect(() => {
    console.log('[DocumentSharingDialog] useEffect triggered:', {
      isOpen,
      hasDocument: !!document,
      isUserAuthorized: isUserAuthorized()
    })
    
    if (isOpen && document && isUserAuthorized()) {
      loadSharingInfo()
    } else if (isOpen && !isUserAuthorized() && !authLoading) {
      // User is not authorized, close dialog and show error
      console.log('[DocumentSharingDialog] User not authorized, closing dialog')
      onOpenChange(false)
      
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to share documents.',
          variant: 'destructive',
        })
      } else if (!isOwner()) {
        toast({
          title: 'Access Denied',
          description: 'Only the document owner can manage sharing settings.',
          variant: 'destructive',
        })
      }
    }
  }, [
    isOpen, 
    document, 
    isUserAuthorized, 
    authLoading, 
    loadSharingInfo, 
    onOpenChange, 
    toast, 
    user, 
    isOwner
  ])

  const handleGenerateLink = async () => {
    if (!document || !isUserAuthorized()) {
      console.log('[DocumentSharingDialog] Cannot generate link - authorization check failed')
      return
    }
    
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setEmailError('Email address is required')
      return
    }
    
    const validation = validateUserEmail(trimmedEmail)
    if (!validation.isValid) {
      setEmailError(validation.error || 'Invalid email')
      return
    }
    
    // Prevent sharing with self
    if (normalizeEmail(trimmedEmail) === normalizeEmail(user!.email!)) {
      setEmailError('You cannot share a document with yourself')
      return
    }
    
    console.log('[DocumentSharingDialog] Generating share link for:', {
      documentId: document.id,
      email: trimmedEmail,
      role,
      ownerId: user!.uid
    })
    
    setIsGenerating(true)
    setEmailError(null)
    
    try {
      const { url } = await DocumentSharingService.generateShareLink(
        document.id,
        normalizeEmail(trimmedEmail),
        role,
        user!.uid
      )
      await navigator.clipboard.writeText(url)
      setEmail('')
      setRole('viewer')
      await loadSharingInfo()
      toast({
        title: 'Share Link Generated!',
        description: `Link for ${trimmedEmail} copied to clipboard.`,
      })
    } catch (error) {
      console.error('[DocumentSharingDialog] Error generating share link:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again.'
      setEmailError(errorMessage)
      toast({
        title: 'Error Generating Share Link',
        description: errorMessage,
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
    if (!document || !isUserAuthorized()) {
      console.log('[DocumentSharingDialog] Cannot revoke token - authorization check failed')
      return
    }
    
    try {
      await DocumentSharingService.revokeShareToken(tokenId, user!.uid)
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

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Show error state if user is not authorized (not authenticated or not owner)
  if (!isUserAuthorized()) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {!user ? 'Authentication Required' : 'Access Denied'}
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {!user 
                ? 'You must be signed in to share documents.' 
                : !user.email
                ? 'Your account does not have an email address associated with it.'
                : 'Only the document owner can manage sharing settings.'}
            </AlertDescription>
          </Alert>
          {!user && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Sharing is restricted to document owners for security.
              </span>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share &ldquo;{document?.title}&rdquo;
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Generate New Links */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Generate Share Link</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={emailError ? 'border-destructive' : ''}
                    disabled={isGenerating}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive mt-1">{emailError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="role">Permission Level</Label>
                  <Select 
                    value={role} 
                    onValueChange={(value: 'viewer' | 'commenter' | 'editor') => setRole(value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Viewer
                        </div>
                      </SelectItem>
                      <SelectItem value="commenter">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Commenter
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Editor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleGenerateLink} 
                  className="w-full" 
                  disabled={isGenerating || !!emailError || !email.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Generate Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Current Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Access</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {shareTokens.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No active shares
                  </p>
                ) : (
                  shareTokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${token.email}`} />
                          <AvatarFallback>
                            {token.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{token.email}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {token.role}
                            </Badge>
                            {token.isUsed && (
                               <Badge variant="outline" className="text-xs">
                                 Used
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLink(token)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy Link</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRevokeToken(token.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Revoke Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Document Access Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Document Access Summary</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Active share links: {shareTokens.length}</p>
            <p>• Document owner: {user?.email}</p>
            <p>• Created: {formatFirestoreTimestamp(document?.createdAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}