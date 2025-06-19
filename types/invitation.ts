/**
 * This file defines the types related to user invitations for accessing documents.
 * An invitation is created when a document owner wants to share a document
 * with a specific person via a unique, secure link.
 */

import type { FirestoreTimestamp } from './document'

/**
 * @interface Invitation
 * @description Represents a pending or accepted invitation for a user to access a document.
 * These are stored in a separate 'invitations' collection in Firestore.
 */
export interface Invitation {
  id: string
  documentId: string
  /**
   * The email of the user who is being invited.
   */
  email: string
  /**
   * The role assigned to the user upon accepting the invitation.
   */
  role: 'editor' | 'commenter' | 'viewer'
  /**
   * The status of the invitation.
   * 'pending': The link has been created but not yet used.
   * 'accepted': The user has clicked the link and gained access.
   */
  status: 'pending' | 'accepted'
  /**
   * A unique, secure token that is part of the invitation link.
   * This is used to claim the invitation.
   */
  token: string
  /**
   * The timestamp of when the invitation was created.
   */
  createdAt: FirestoreTimestamp
  /**
   * The ID of the user who sent the invitation.
   */
  invitedBy: string
  /**
   * The timestamp of when the invitation was accepted.
   * This is optional and only present when the status is 'accepted'.
   */
  acceptedAt?: FirestoreTimestamp
} 