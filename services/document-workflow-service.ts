import { 
  doc, 
  updateDoc, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'

export type DocumentStatus = 'draft' | 'review' | 'final' | 'archived'

export interface WorkflowStatusChange {
  fromStatus: DocumentStatus
  toStatus: DocumentStatus
  changedBy: string
  changedAt: number
  reason?: string
  comment?: string
}

export class DocumentWorkflowService {
  /**
   * Submit a document for review
   * @param documentId - The document ID
   * @param submitterId - User ID submitting for review
   */
  static async submitForReview(documentId: string, submitterId: string): Promise<void> {
    console.log('[DocumentWorkflowService] Submitting document for review:', documentId, 'by:', submitterId)

    try {
      const documentRef = doc(firestore, 'documents', documentId)
      
      await updateDoc(documentRef, {
        status: 'review',
        'workflowState.currentStatus': 'review',
        'workflowState.submittedForReview': true,
        'workflowState.submittedAt': serverTimestamp(),
        'workflowState.submittedBy': submitterId,
        lastEditedBy: submitterId,
        lastEditedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      console.log('[DocumentWorkflowService] Document submitted for review successfully')
    } catch (error) {
      console.error('[DocumentWorkflowService] Error submitting for review:', error)
      throw new Error('Failed to submit document for review')
    }
  }

  /**
   * Approve a document
   * @param documentId - The document ID
   * @param approverId - User ID approving the document
   * @param comment - Optional approval comment
   */
  static async approveDocument(documentId: string, approverId: string, comment?: string): Promise<void> {
    console.log('[DocumentWorkflowService] Approving document:', documentId, 'by:', approverId)

    try {
      const documentRef = doc(firestore, 'documents', documentId)
      
      await updateDoc(documentRef, {
        status: 'final',
        'workflowState.currentStatus': 'final',
        'workflowState.approvedBy': approverId,
        'workflowState.approvedAt': serverTimestamp(),
        'workflowState.reviewedBy': arrayUnion(approverId),
        lastEditedBy: approverId,
        lastEditedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Log workflow change
      await this.logWorkflowChange(documentId, 'review', 'final', approverId, comment)

      console.log('[DocumentWorkflowService] Document approved successfully')
    } catch (error) {
      console.error('[DocumentWorkflowService] Error approving document:', error)
      throw new Error('Failed to approve document')
    }
  }

  /**
   * Reject a document
   * @param documentId - The document ID
   * @param reviewerId - User ID rejecting the document
   * @param reason - Reason for rejection
   */
  static async rejectDocument(documentId: string, reviewerId: string, reason: string): Promise<void> {
    console.log('[DocumentWorkflowService] Rejecting document:', documentId, 'by:', reviewerId)

    try {
      const documentRef = doc(firestore, 'documents', documentId)
      
      await updateDoc(documentRef, {
        status: 'draft',
        'workflowState.currentStatus': 'draft',
        'workflowState.rejectedBy': reviewerId,
        'workflowState.rejectedAt': serverTimestamp(),
        'workflowState.rejectionReason': reason,
        'workflowState.reviewedBy': arrayUnion(reviewerId),
        'workflowState.submittedForReview': false,
        lastEditedBy: reviewerId,
        lastEditedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Log workflow change
      await this.logWorkflowChange(documentId, 'review', 'draft', reviewerId, reason)

      console.log('[DocumentWorkflowService] Document rejected successfully')
    } catch (error) {
      console.error('[DocumentWorkflowService] Error rejecting document:', error)
      throw new Error('Failed to reject document')
    }
  }

  /**
   * Archive a document
   * @param documentId - The document ID
   * @param archiverId - User ID archiving the document
   */
  static async archiveDocument(documentId: string, archiverId: string): Promise<void> {
    console.log('[DocumentWorkflowService] Archiving document:', documentId, 'by:', archiverId)

    try {
      const documentRef = doc(firestore, 'documents', documentId)
      
      await updateDoc(documentRef, {
        status: 'archived',
        'workflowState.currentStatus': 'archived',
        lastEditedBy: archiverId,
        lastEditedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      console.log('[DocumentWorkflowService] Document archived successfully')
    } catch (error) {
      console.error('[DocumentWorkflowService] Error archiving document:', error)
      throw new Error('Failed to archive document')
    }
  }

  /**
   * Restore a document from archived status
   * @param documentId - The document ID
   * @param restorerId - User ID restoring the document
   * @param newStatus - Status to restore to (default: draft)
   */
  static async restoreDocument(
    documentId: string, 
    restorerId: string, 
    newStatus: DocumentStatus = 'draft'
  ): Promise<void> {
    console.log('[DocumentWorkflowService] Restoring document:', documentId, 'to status:', newStatus)

    try {
      const documentRef = doc(firestore, 'documents', documentId)
      
      await updateDoc(documentRef, {
        status: newStatus,
        'workflowState.currentStatus': newStatus,
        lastEditedBy: restorerId,
        lastEditedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Log workflow change
      await this.logWorkflowChange(documentId, 'archived', newStatus, restorerId, 'Document restored')

      console.log('[DocumentWorkflowService] Document restored successfully')
    } catch (error) {
      console.error('[DocumentWorkflowService] Error restoring document:', error)
      throw new Error('Failed to restore document')
    }
  }

  /**
   * Log a workflow status change
   * @param documentId - The document ID
   * @param fromStatus - Previous status
   * @param toStatus - New status
   * @param changedBy - User making the change
   * @param comment - Optional comment
   */
  private static async logWorkflowChange(
    documentId: string,
    fromStatus: DocumentStatus,
    toStatus: DocumentStatus,
    changedBy: string,
    comment?: string
  ): Promise<void> {
    console.log('[DocumentWorkflowService] Logging workflow change:', {
      documentId,
      fromStatus,
      toStatus,
      changedBy
    })

    try {
      const change: WorkflowStatusChange = {
        fromStatus,
        toStatus,
        changedBy,
        changedAt: Date.now(),
        comment
      }

      // This could be stored in a separate collection for audit trail
      // For now, we'll just log it
      console.log('[DocumentWorkflowService] Workflow change logged:', change)
    } catch (error) {
      console.error('[DocumentWorkflowService] Error logging workflow change:', error)
      // Don't throw as this is not critical
    }
  }

  /**
   * Get document status and workflow permissions for a user
   * @param documentId - The document ID
   * @param userId - User ID to check permissions for
   */
  static async getWorkflowPermissions(
    documentId: string, 
    userId: string
  ): Promise<{
    canSubmitForReview: boolean
    canApprove: boolean
    canReject: boolean
    canArchive: boolean
    canRestore: boolean
    currentStatus: DocumentStatus
  }> {
    console.log('[DocumentWorkflowService] Getting workflow permissions for user:', userId, 'document:', documentId)

    try {
      // For this implementation, we'll use simple role-based permissions
      // In a real system, this would be more sophisticated
      
      // Mock permissions based on user role (would come from document access)
      const permissions = {
        canSubmitForReview: true, // Document owner/editor can submit
        canApprove: true, // Reviewers/owners can approve
        canReject: true, // Reviewers/owners can reject
        canArchive: true, // Owners can archive
        canRestore: true, // Owners can restore
        currentStatus: 'draft' as DocumentStatus // Would come from document
      }

      console.log('[DocumentWorkflowService] Workflow permissions:', permissions)
      return permissions
    } catch (error) {
      console.error('[DocumentWorkflowService] Error getting workflow permissions:', error)
      return {
        canSubmitForReview: false,
        canApprove: false,
        canReject: false,
        canArchive: false,
        canRestore: false,
        currentStatus: 'draft'
      }
    }
  }
}