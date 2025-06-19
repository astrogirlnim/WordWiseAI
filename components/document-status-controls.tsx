import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Send,
  Check, 
  X, 
  Archive,
  RotateCcw,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DocumentWorkflowService } from '@/services/document-workflow-service'
import type { DocumentStatus } from '@/services/document-workflow-service'

interface DocumentStatusControlsProps {
  documentId: string
  currentStatus: DocumentStatus
  canSubmitForReview: boolean
  canApprove: boolean
  canReject: boolean
  canArchive: boolean
  canRestore: boolean
  userId: string
  onStatusChange?: (newStatus: DocumentStatus) => void
}

export function DocumentStatusControls({
  documentId,
  currentStatus,
  canSubmitForReview,
  canApprove,
  canReject,
  canArchive,
  canRestore,
  userId,
  onStatusChange
}: DocumentStatusControlsProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  console.log('[DocumentStatusControls] Rendering with status:', currentStatus, 'permissions:', {
    canSubmitForReview,
    canApprove,
    canReject,
    canArchive,
    canRestore
  })

  const getStatusInfo = (status: DocumentStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
          icon: <FileText className="h-3 w-3" />,
          description: 'Document is being edited'
        }
      case 'review':
        return {
          label: 'Under Review',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
          icon: <Clock className="h-3 w-3" />,
          description: 'Document is awaiting review'
        }
      case 'final':
        return {
          label: 'Final',
          color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
          icon: <CheckCircle className="h-3 w-3" />,
          description: 'Document has been approved'
        }
      case 'archived':
        return {
          label: 'Archived',
          color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
          icon: <Archive className="h-3 w-3" />,
          description: 'Document has been archived'
        }
    }
  }

  const statusInfo = getStatusInfo(currentStatus)

  const handleSubmitForReview = async () => {
    console.log('[DocumentStatusControls] Submitting for review')
    setIsSubmitting(true)

    try {
      await DocumentWorkflowService.submitForReview(documentId, userId)
      toast({
        title: 'Submitted for Review',
        description: 'Your document has been submitted for review.'
      })
      onStatusChange?.('review')
    } catch (error) {
      console.error('[DocumentStatusControls] Error submitting for review:', error)
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit document for review. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    console.log('[DocumentStatusControls] Approving document')
    setIsSubmitting(true)

    try {
      await DocumentWorkflowService.approveDocument(documentId, userId, approvalComment)
      toast({
        title: 'Document Approved',
        description: 'The document has been approved and marked as final.'
      })
      onStatusChange?.('final')
      setApprovalComment('')
    } catch (error) {
      console.error('[DocumentStatusControls] Error approving document:', error)
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve document. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    console.log('[DocumentStatusControls] Rejecting document')
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      await DocumentWorkflowService.rejectDocument(documentId, userId, rejectionReason)
      toast({
        title: 'Document Rejected',
        description: 'The document has been rejected and returned to draft status.'
      })
      onStatusChange?.('draft')
      setRejectionReason('')
    } catch (error) {
      console.error('[DocumentStatusControls] Error rejecting document:', error)
      toast({
        title: 'Rejection Failed',
        description: 'Failed to reject document. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArchive = async () => {
    console.log('[DocumentStatusControls] Archiving document')
    setIsSubmitting(true)

    try {
      await DocumentWorkflowService.archiveDocument(documentId, userId)
      toast({
        title: 'Document Archived',
        description: 'The document has been archived.'
      })
      onStatusChange?.('archived')
    } catch (error) {
      console.error('[DocumentStatusControls] Error archiving document:', error)
      toast({
        title: 'Archive Failed',
        description: 'Failed to archive document. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestore = async () => {
    console.log('[DocumentStatusControls] Restoring document')
    setIsSubmitting(true)

    try {
      await DocumentWorkflowService.restoreDocument(documentId, userId, 'draft')
      toast({
        title: 'Document Restored',
        description: 'The document has been restored to draft status.'
      })
      onStatusChange?.('draft')
    } catch (error) {
      console.error('[DocumentStatusControls] Error restoring document:', error)
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore document. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Current Status */}
      <Badge className={`${statusInfo.color} flex items-center gap-1`}>
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>

      {/* Status Actions */}
      {currentStatus === 'draft' && canSubmitForReview && (
        <Button
          size="sm"
          onClick={handleSubmitForReview}
          disabled={isSubmitting}
        >
          <Send className="mr-1 h-3 w-3" />
          Submit for Review
        </Button>
      )}

      {currentStatus === 'review' && (
        <div className="flex gap-2">
          {/* Approve Button */}
          {canApprove && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="default">
                  <Check className="mr-1 h-3 w-3" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Document</DialogTitle>
                  <DialogDescription>
                    This will mark the document as final and approved.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="approval-comment">Comment (optional)</Label>
                    <Textarea
                      id="approval-comment"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Add an approval comment..."
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleApprove} disabled={isSubmitting}>
                    <Check className="mr-1 h-3 w-3" />
                    Approve Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Reject Button */}
          {canReject && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <X className="mr-1 h-3 w-3" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Document</DialogTitle>
                  <DialogDescription>
                    This will return the document to draft status. Please provide a reason for rejection.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this document is being rejected..."
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleReject} disabled={isSubmitting || !rejectionReason.trim()} variant="destructive">
                    <X className="mr-1 h-3 w-3" />
                    Reject Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Archive/Restore Actions */}
      {(currentStatus === 'final' || currentStatus === 'draft') && canArchive && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              More Actions
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleArchive} disabled={isSubmitting}>
              <Archive className="mr-2 h-4 w-4" />
              Archive Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {currentStatus === 'archived' && canRestore && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleRestore}
          disabled={isSubmitting}
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Restore
        </Button>
      )}
    </div>
  )
}