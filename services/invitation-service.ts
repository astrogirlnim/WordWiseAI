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

/**
 * Normalizes an email address for consistent comparison
 * @param email - The email to normalize
 * @returns Normalized email (lowercase, trimmed)
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
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
    console.log('[InvitationService.createInvitations] Starting invitation creation', {
      documentId,
      emails,
      role,
      invitedBy
    });

    const result: CreateInvitationsResult = {
      newlyInvited: [],
      alreadyInvited: [],
      alreadyMember: [],
    };

    const invitationsCollection = collection(firestore, 'invitations');
    const documentRef = doc(firestore, 'documents', documentId);
    const documentSnap = await getDoc(documentRef);

    if (!documentSnap.exists()) {
      console.error('[InvitationService.createInvitations] Document not found:', documentId);
      throw new Error("Document not found.");
    }

    const documentData = documentSnap.data() as Document;
    console.log('[InvitationService.createInvitations] Document data loaded', {
      documentId,
      title: documentData.title,
      sharedWithCount: documentData.sharedWith?.length || 0
    });

    for (const email of emails) {
      const normalizedEmail = normalizeEmail(email);
      console.log('[InvitationService.createInvitations] Processing email', {
        originalEmail: email,
        normalizedEmail
      });

      // Check if user is already a member
      const isAlreadyMember = documentData.sharedWith?.some(
        member => normalizeEmail(member.email) === normalizedEmail
      );

      if (isAlreadyMember) {
        console.log('[InvitationService.createInvitations] User already a member:', normalizedEmail);
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
        console.log('[InvitationService.createInvitations] Pending invitation already exists:', normalizedEmail);
        result.alreadyInvited.push(email);
        continue; // Skip creating a new invitation
      }

      // If no duplicates, create a new invitation
      const token = uuidv4();
      const invitationData: Omit<Invitation, 'id'> = {
        documentId,
        email: normalizedEmail, // Store normalized email
        role,
        status: 'pending',
        token,
        createdAt: serverTimestamp(),
        invitedBy,
      };

      console.log('[InvitationService.createInvitations] Creating invitation', {
        email: normalizedEmail,
        role,
        token
      });

      await addDoc(invitationsCollection, invitationData);
      
      const invitationLink = `${window.location.origin}/doc/${documentId}?inviteToken=${token}`;
      result.newlyInvited.push({ email, link: invitationLink });
      
      console.log('[InvitationService.createInvitations] Invitation created successfully', {
        email: normalizedEmail,
        link: invitationLink
      });
    }

    console.log('[InvitationService.createInvitations] Invitation creation completed', {
      newlyInvited: result.newlyInvited.length,
      alreadyInvited: result.alreadyInvited.length,
      alreadyMember: result.alreadyMember.length
    });

    return result;
  }

  /**
   * Fetches all pending invitations for a specific document.
   * @param documentId The ID of the document.
   * @returns A promise that resolves with an array of pending Invitation objects.
   */
  static async getPendingInvitations(documentId: string): Promise<Invitation[]> {
    console.log('[InvitationService.getPendingInvitations] Fetching pending invitations for document:', documentId);
    
    const invitationsCollection = collection(firestore, 'invitations');
    const q = query(
      invitationsCollection,
      where('documentId', '==', documentId),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    const invitations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
    
    console.log('[InvitationService.getPendingInvitations] Found invitations:', invitations.length);
    return invitations;
  }

  /**
   * Deletes a pending invitation from Firestore.
   * @param invitationId The ID of the invitation to delete.
   */
  static async revokeInvitation(invitationId: string): Promise<void> {
    console.log('[InvitationService.revokeInvitation] Revoking invitation:', invitationId);
    
    const invitationRef = doc(firestore, 'invitations', invitationId);
    await deleteDoc(invitationRef);
    
    console.log('[InvitationService.revokeInvitation] Invitation revoked successfully');
  }
} 