'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Share, Users, Lock } from 'lucide-react'
import { DocumentSharingDialog } from './document-sharing-dialog'
import type { Document } from '@/types/document'

interface DocumentSharingButtonProps {
  document: Document | null
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showCollaboratorCount?: boolean
  className?: string
}

export function DocumentSharingButton({
  document,
  variant = 'outline',
  size = 'default',
  showCollaboratorCount = true,
  className,
}: DocumentSharingButtonProps) {
  const { user } = useAuth()
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false)

  console.log('[DocumentSharingButton] Rendered with document:', document?.id, 'collaborators:', document?.sharedWith?.length || 0)

  if (!document || !user) {
    return null
  }

  const isOwner = document.ownerId === user.uid
  const collaboratorCount = document.sharedWith?.length || 0
  const hasCollaborators = collaboratorCount > 0

  console.log('[DocumentSharingButton] User permissions:', {
    isOwner,
    userId: user.uid,
    ownerId: document.ownerId,
    collaboratorCount
  })

  const handleClick = () => {
    if (!isOwner) {
      console.log('[DocumentSharingButton] Non-owner attempted to access sharing - should not happen')
      return
    }
    
    console.log('[DocumentSharingButton] Opening sharing dialog for document:', document.id)
    setIsSharingDialogOpen(true)
  }

  // Only show the share button for document owners
  if (!isOwner) {
    // For shared documents, show a disabled indicator instead
    if (hasCollaborators) {
      return (
        <Button
          variant="ghost"
          size={size}
          disabled
          className={`opacity-50 cursor-not-allowed ${className}`}
          title="Only the document owner can manage sharing"
        >
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {size !== 'icon' && showCollaboratorCount && (
              <>
                Shared
                <Badge variant="secondary" className="ml-1">
                  {collaboratorCount}
                </Badge>
              </>
            )}
          </div>
        </Button>
      )
    }
    return null // Don't show anything for non-shared, non-owned documents
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        <div className="flex items-center gap-2">
          {hasCollaborators ? (
            <Users className="h-4 w-4" />
          ) : (
            <Share className="h-4 w-4" />
          )}
          
          {size !== 'icon' && (
            <>
              {hasCollaborators ? 'Manage Access' : 'Share'}
              
              {showCollaboratorCount && hasCollaborators && (
                <Badge variant="secondary" className="ml-1">
                  {collaboratorCount}
                </Badge>
              )}
            </>
          )}
        </div>
      </Button>

      <DocumentSharingDialog
        isOpen={isSharingDialogOpen}
        onOpenChange={setIsSharingDialogOpen}
        document={document}
      />
    </>
  )
}