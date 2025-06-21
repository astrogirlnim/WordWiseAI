'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Share, Users } from 'lucide-react'
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
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false)

  console.log('[DocumentSharingButton] Rendered with document:', document?.id, 'collaborators:', document?.sharedWith?.length || 0)

  if (!document) {
    return null
  }

  const collaboratorCount = document.sharedWith?.length || 0
  const hasCollaborators = collaboratorCount > 0

  const handleClick = () => {
    console.log('[DocumentSharingButton] Opening sharing dialog for document:', document.id)
    setIsSharingDialogOpen(true)
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