/**
 * This service handles all Firestore operations related to document invitations.
 * It provides methods for creating, retrieving, and managing invitations.
 */
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type { Invitation } from '@/types/invitation'
import { v4 as uuidv4 } from 'uuid'
import type { Document } from '@/types/document'

export interface CreateInvitationsResult {
  newlyInvited: { email: string; link: string }[]
  alreadyInvited: string[]
  alreadyMember: string[]
}

export class InvitationService {
  /**
   * Creates one or more invitations for a document and returns the generated links.
   * @param documentId The ID of the document to invite users to.
   * @param emails An array of emails to invite.
   * @param role The role to assign to the invited users.
   * @param invitedBy The ID of the user creating the invitation.
   * @returns A promise that resolves with an object containing new links and lists of skipped emails.
   */
  static async createInvitations(
    documentId: string,
    emails: string[],
    role: 'editor' | 'commenter' | 'viewer',
    invitedBy: string
  ): Promise<CreateInvitationsResult> {
    const result: CreateInvitationsResult = {
      newlyInvited: [],
      alreadyInvited: [],
      alreadyMember: [],
    };

    const invitationsCollection = collection(firestore, 'invitations');
    const documentRef = doc(firestore, 'documents', documentId);
    const documentSnap = await getDoc(documentRef);

    if (!documentSnap.exists()) {
      throw new Error("Document not found.");
    }

    const documentData = documentSnap.data() as Document;

    for (const email of emails) {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user is already a member
      if (documentData.sharedWith.some(member => member.email.toLowerCase() === normalizedEmail)) {
        result.alreadyMember.push(email);
        continue;
      }
      
      // Check for existing pending invitation
      const q = query(
        invitationsCollection,
        where('documentId', '==', documentId),
        where('email', '==', normalizedEmail),
        where('status', '==', 'pending')
      );
      const existingInvites = await getDocs(q);

      if (!existingInvites.empty) {
        result.alreadyInvited.push(email);
        continue; // Skip creating a new invitation
      }

      // If no duplicates, create a new invitation
      const token = uuidv4();
      const invitationData: Omit<Invitation, 'id'> = {
        documentId,
        email: normalizedEmail,
        role,
        status: 'pending',
        token,
        createdAt: serverTimestamp(),
        invitedBy,
      };

      await addDoc(invitationsCollection, invitationData);
      
      const invitationLink = `${window.location.origin}/doc/${documentId}?inviteToken=${token}`;
      result.newlyInvited.push({ email, link: invitationLink });
    }

    return result;
  }

  /**
   * Fetches all pending invitations for a specific document.
   * @param documentId The ID of the document.
   * @returns A promise that resolves with an array of pending Invitation objects.
   */
  static async getPendingInvitations(documentId: string): Promise<Invitation[]> {
    const invitationsCollection = collection(firestore, 'invitations');
    const q = query(
      invitationsCollection,
      where('documentId', '==', documentId),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
  }

  /**
   * Deletes a pending invitation from Firestore.
   * @param invitationId The ID of the invitation to delete.
   */
  static async revokeInvitation(invitationId: string): Promise<void> {
    const invitationRef = doc(firestore, 'invitations', invitationId);
    await deleteDoc(invitationRef);
  }
} 