import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import type { DocumentAccess } from '@/types/document'

export interface ShareInvitation {
  id: string
  documentId: string
  documentTitle: string
  inviterEmail: string
  inviterName: string
  inviteeEmail: string
  role: 'editor' | 'commenter' | 'viewer'
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: number
  expiresAt: number
  acceptedAt?: number
  message?: string
}

export class DocumentSharingService {
  /**
   * Share a document with a user by email
   * @param documentId - The document ID
   * @param inviterUserId - User ID of the person sharing
   * @param inviteeEmail - Email of the person to share with
   * @param role - Access role to grant
   * @param message - Optional message to include
   */
  static async shareDocument(
    documentId: string,
    inviterUserId: string,
    inviterName: string,
    inviterEmail: string,
    documentTitle: string,
    inviteeEmail: string,
    role: 'editor' | 'commenter' | 'viewer',
    message?: string
  ): Promise<string> {
    console.log('[DocumentSharingService] Sharing document:', {
      documentId,
      inviterUserId,
      inviteeEmail,
      role
    })

    try {
      // Check if user is already shared with
      const docRef = doc(firestore, 'documents', documentId)
      const documentData = (await getDocs(query(collection(firestore, 'documents'), where('id', '==', documentId)))).docs[0]?.data()
      
      if (documentData?.sharedWith?.some((access: DocumentAccess) => access.email === inviteeEmail)) {
        throw new Error('Document is already shared with this user')
      }

      // Create invitation record
      const invitationsRef = collection(firestore, 'shareInvitations')
      const invitation: Omit<ShareInvitation, 'id'> = {
        documentId,
        documentTitle,
        inviterEmail,
        inviterName,
        inviteeEmail,
        role,
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        message
      }

      const invitationDoc = await addDoc(invitationsRef, invitation)
      console.log('[DocumentSharingService] Invitation created:', invitationDoc.id)

      // TODO: Send email notification to invitee
      console.log('[DocumentSharingService] Would send email to:', inviteeEmail)

      return invitationDoc.id
    } catch (error) {
      console.error('[DocumentSharingService] Error sharing document:', error)
      throw error
    }
  }

  /**
   * Accept a share invitation
   * @param invitationId - The invitation ID
   * @param userId - User ID accepting the invitation
   */
  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    console.log('[DocumentSharingService] Accepting invitation:', invitationId, 'by user:', userId)

    try {
      // Get invitation details
      const invitationDoc = doc(firestore, 'shareInvitations', invitationId)
      const invitationData = (await getDocs(query(collection(firestore, 'shareInvitations'), where('__name__', '==', invitationId)))).docs[0]?.data() as ShareInvitation

      if (!invitationData || invitationData.status !== 'pending') {
        throw new Error('Invalid or expired invitation')
      }

      if (invitationData.expiresAt < Date.now()) {
        throw new Error('Invitation has expired')
      }

      // Add user to document's shared list
      const documentRef = doc(firestore, 'documents', invitationData.documentId)
      const newAccess: DocumentAccess = {
        userId,
        email: invitationData.inviteeEmail,
        role: invitationData.role,
        addedAt: serverTimestamp(),
        addedBy: 'invitation'
      }

      await updateDoc(documentRef, {
        sharedWith: arrayUnion(newAccess)
      })

      // Update invitation status
      await updateDoc(invitationDoc, {
        status: 'accepted',
        acceptedAt: Date.now()
      })

      console.log('[DocumentSharingService] Invitation accepted successfully')
    } catch (error) {
      console.error('[DocumentSharingService] Error accepting invitation:', error)
      throw error
    }
  }

  /**
   * Remove a user's access to a document
   * @param documentId - The document ID
   * @param userEmail - Email of the user to remove
   */
  static async removeAccess(documentId: string, userEmail: string): Promise<void> {
    console.log('[DocumentSharingService] Removing access for:', userEmail, 'from document:', documentId)

    try {
      const documentRef = doc(firestore, 'documents', documentId)
      
      // Get current shared list
      const documentData = (await getDocs(query(collection(firestore, 'documents'), where('id', '==', documentId)))).docs[0]?.data()
      
      if (!documentData?.sharedWith) {
        throw new Error('Document not found or no shared access')
      }

      // Find and remove the access entry
      const accessToRemove = documentData.sharedWith.find((access: DocumentAccess) => access.email === userEmail)
      
      if (!accessToRemove) {
        throw new Error('User does not have access to this document')
      }

      await updateDoc(documentRef, {
        sharedWith: arrayRemove(accessToRemove)
      })

      console.log('[DocumentSharingService] Access removed successfully')
    } catch (error) {
      console.error('[DocumentSharingService] Error removing access:', error)
      throw error
    }
  }

  /**
   * Update a user's role for a document
   * @param documentId - The document ID
   * @param userEmail - Email of the user
   * @param newRole - New role to assign
   */
  static async updateUserRole(
    documentId: string, 
    userEmail: string, 
    newRole: 'editor' | 'commenter' | 'viewer'
  ): Promise<void> {
    console.log('[DocumentSharingService] Updating role for:', userEmail, 'to:', newRole)

    try {
      // Remove old access and add new one
      await this.removeAccess(documentId, userEmail)
      
      const documentRef = doc(firestore, 'documents', documentId)
      const newAccess: DocumentAccess = {
        userId: 'updated', // This would need proper user ID lookup
        email: userEmail,
        role: newRole,
        addedAt: serverTimestamp(),
        addedBy: 'role_update'
      }

      await updateDoc(documentRef, {
        sharedWith: arrayUnion(newAccess)
      })

      console.log('[DocumentSharingService] Role updated successfully')
    } catch (error) {
      console.error('[DocumentSharingService] Error updating role:', error)
      throw error
    }
  }

  /**
   * Get all pending invitations for a user
   * @param userEmail - User's email
   */
  static async getPendingInvitations(userEmail: string): Promise<ShareInvitation[]> {
    console.log('[DocumentSharingService] Getting pending invitations for:', userEmail)

    try {
      const invitationsRef = collection(firestore, 'shareInvitations')
      const q = query(
        invitationsRef,
        where('inviteeEmail', '==', userEmail),
        where('status', '==', 'pending')
      )

      const snapshot = await getDocs(q)
      const invitations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShareInvitation[]

      // Filter out expired invitations
      const validInvitations = invitations.filter(inv => inv.expiresAt > Date.now())

      console.log('[DocumentSharingService] Found', validInvitations.length, 'pending invitations')
      return validInvitations
    } catch (error) {
      console.error('[DocumentSharingService] Error getting pending invitations:', error)
      throw error
    }
  }

  /**
   * Check if user has access to a document
   * @param documentId - The document ID
   * @param userId - User ID to check
   * @param userEmail - User email to check
   */
  static async checkAccess(
    documentId: string, 
    userId: string, 
    userEmail: string
  ): Promise<{ hasAccess: boolean; role?: 'owner' | 'editor' | 'commenter' | 'viewer' }> {
    console.log('[DocumentSharingService] Checking access for user:', userId, 'to document:', documentId)

    try {
      const documentData = (await getDocs(query(collection(firestore, 'documents'), where('id', '==', documentId)))).docs[0]?.data()
      
      if (!documentData) {
        return { hasAccess: false }
      }

      // Check if user is owner
      if (documentData.ownerId === userId) {
        return { hasAccess: true, role: 'owner' }
      }

      // Check if user is in shared list
      const userAccess = documentData.sharedWith?.find((access: DocumentAccess) => 
        access.userId === userId || access.email === userEmail
      )

      if (userAccess) {
        return { hasAccess: true, role: userAccess.role }
      }

      // Check if document is public
      if (documentData.isPublic && documentData.publicViewMode !== 'disabled') {
        return { hasAccess: true, role: 'viewer' }
      }

      return { hasAccess: false }
    } catch (error) {
      console.error('[DocumentSharingService] Error checking access:', error)
      return { hasAccess: false }
    }
  }
}