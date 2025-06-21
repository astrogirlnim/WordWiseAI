import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { toJSDate } from '../lib/utils'
import type {
  Document,
  DocumentAccess,
  ShareToken,
  ShareTokenData,
  DocumentSharingInfo,
} from '@/types/document'

// Share token interface for link-based sharing

export class DocumentSharingService {
  /**
   * Generate a shareable link for a document with specific email and role
   * @param documentId - The document to share
   * @param email - Email address of the person to share with
   * @param role - Permission level for the shared user
   * @param ownerId - ID of the document owner
   * @returns Share token and URL
   */
  static async generateShareLink(
    documentId: string,
    email: string,
    role: 'viewer' | 'commenter' | 'editor',
    ownerId: string
  ): Promise<{ token: string; url: string }> {
    console.log('[DocumentSharingService] Generating share link:', { documentId, email, role, ownerId })
    
    try {
      // Verify the user owns the document
      const docRef = doc(firestore, 'documents', documentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Document not found')
      }
      
      const docData = docSnap.data() as Document
      if (docData.ownerId !== ownerId) {
        throw new Error('Access denied: You do not own this document')
      }
      
      // Check if a share token already exists for this email and document
      const existingTokenQuery = query(
        collection(firestore, 'shareTokens'),
        where('documentId', '==', documentId),
        where('email', '==', email),
        where('isUsed', '==', false)
      )
      const existingTokens = await getDocs(existingTokenQuery)
      
      // If token exists, delete it first (we'll create a new one with updated permissions)
      if (!existingTokens.empty) {
        console.log('[DocumentSharingService] Found existing token, removing it first')
        for (const tokenDoc of existingTokens.docs) {
          await deleteDoc(doc(firestore, 'shareTokens', tokenDoc.id))
        }
      }
      
      // Create new share token
      const shareTokenData: ShareTokenData = {
        documentId,
        createdBy: ownerId,
        email,
        role,
        isUsed: false,
        createdAt: serverTimestamp(),
      }
      
      const tokenRef = await addDoc(collection(firestore, 'shareTokens'), shareTokenData)
      const token = tokenRef.id
      
      console.log('[DocumentSharingService] Share token created:', token)
      
      // Generate the share URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com'
      const shareUrl = `${baseUrl}/share/${token}`
      
      console.log('[DocumentSharingService] Share URL generated:', shareUrl)
      
      return { token, url: shareUrl }
    } catch (error) {
      console.error('[DocumentSharingService] Error generating share link:', error)
      throw new Error('Failed to generate share link')
    }
  }
  
  /**
   * Accept a share invitation using a token
   * @param token - The share token from the URL
   * @param userId - ID of the user accepting the invite
   * @returns Document information if successful
   */
  static async acceptShareInvitation(
    token: string,
    userId: string,
    userEmail: string
  ): Promise<{ documentId: string; role: string; document: Document }> {
    console.log('[DocumentSharingService] Accepting share invitation:', { token, userId, userEmail })
    
    try {
      // Get the share token
      const tokenRef = doc(firestore, 'shareTokens', token)
      const tokenSnap = await getDoc(tokenRef)
      
      if (!tokenSnap.exists()) {
        throw new Error('Invalid or expired share link')
      }
      
      const tokenData = tokenSnap.data() as ShareToken
      
      if (tokenData.isUsed) {
        throw new Error('This share link has already been used')
      }
      
      if (tokenData.email !== userEmail) {
        throw new Error('This share link was not created for your email address')
      }
      
      // Check if token has expired (if expiry was set)
      if (tokenData.expiresAt) {
        const now = Date.now()
        const expiresAt = toJSDate(tokenData.expiresAt)
        
        if (expiresAt && now > expiresAt.getTime()) {
          throw new Error('This share link has expired')
        }
      }
      
      // Get the document
      const docRef = doc(firestore, 'documents', tokenData.documentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Document not found')
      }
      
      const document = { id: docSnap.id, ...docSnap.data() } as Document
      
      // Check if user already has access
      const existingAccess = document.sharedWith.find(access => access.userId === userId)
      
      if (existingAccess) {
        console.log('[DocumentSharingService] User already has access, updating role if different')
        if (existingAccess.role !== tokenData.role) {
          await this.updateUserPermissions(tokenData.documentId, userId, tokenData.role, document.ownerId)
        }
      } else {
        // Add user to document's sharedWith array
        const newAccess: DocumentAccess = {
          userId,
          email: userEmail,
          role: tokenData.role,
          addedAt: serverTimestamp(),
          addedBy: tokenData.createdBy,
        }
        
        await updateDoc(docRef, {
          sharedWith: arrayUnion(newAccess),
          sharedWithUids: arrayUnion(userId),
          updatedAt: serverTimestamp(),
        })
        
        console.log('[DocumentSharingService] User added to document sharing list')
      }
      
      // Mark token as used
      await updateDoc(tokenRef, {
        isUsed: true,
        usedAt: serverTimestamp(),
      })
      
      console.log('[DocumentSharingService] Share invitation accepted successfully')
      
      return {
        documentId: tokenData.documentId,
        role: tokenData.role,
        document,
      }
    } catch (error) {
      console.error('[DocumentSharingService] Error accepting share invitation:', error)
      throw error
    }
  }
  
  /**
   * Get all documents shared with a specific user
   * @param userId - User ID to get shared documents for
   * @returns Array of shared documents
   */
  static async getSharedDocuments(userId: string): Promise<Document[]> {
    console.log('[DocumentSharingService] Getting shared documents for user:', userId)
    
    try {
      // First try the efficient query using sharedWithUids
      const q = query(
        collection(firestore, 'documents'),
        where('sharedWithUids', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      let sharedDocs = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Document)
      );

      // If no results from the efficient query, fall back to client-side filtering
      // This handles the case where documents don't have sharedWithUids field yet
      if (sharedDocs.length === 0) {
        console.log('[DocumentSharingService] No results from sharedWithUids query, falling back to client-side filtering')
        
        const allDocsQuery = query(collection(firestore, 'documents'))
        const allDocsSnapshot = await getDocs(allDocsQuery)
        
        sharedDocs = allDocsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Document))
          .filter((docData) => {
            // Check if user is in sharedWith array and not the owner
            const hasAccess = docData.sharedWith?.some(access => access.userId === userId)
            const isOwner = docData.ownerId === userId
            return hasAccess && !isOwner
          })
      }

      // Sort by updatedAt descending
      sharedDocs.sort((a, b) => {
        const timeA = toJSDate(a.updatedAt)?.getTime() ?? 0
        const timeB = toJSDate(b.updatedAt)?.getTime() ?? 0
        return timeB - timeA
      })
      
      console.log('[DocumentSharingService] Found', sharedDocs.length, 'shared documents')
      return sharedDocs
    } catch (error) {
      console.error('[DocumentSharingService] Error getting shared documents:', error)
      return []
    }
  }
  
  /**
   * Update a user's permissions for a document
   * @param documentId - ID of the document to update
   * @param userId - ID of the user to update
   * @param newRole - The new role to assign
   * @param ownerId - ID of the user making the change (must be owner)
   */
  static async updateUserPermissions(
    documentId: string,
    userId: string,
    newRole: 'viewer' | 'commenter' | 'editor',
    ownerId: string
  ): Promise<void> {
    console.log('[DocumentSharingService] Updating permissions:', { documentId, userId, newRole, ownerId })
    
    try {
      const docRef = doc(firestore, 'documents', documentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Document not found')
      }
      
      const document = docSnap.data() as Document
      if (document.ownerId !== ownerId) {
        throw new Error('Access denied')
      }
      
      const userAccess = document.sharedWith.find(access => access.userId === userId)
      if (!userAccess) {
        throw new Error('User does not have access to this document')
      }
      
      const updatedAccess: DocumentAccess = { ...userAccess, role: newRole }
      
      // Atomically remove the old access entry and add the new one
      await updateDoc(docRef, {
        sharedWith: arrayRemove(userAccess),
      })
      await updateDoc(docRef, {
        sharedWith: arrayUnion(updatedAccess),
        updatedAt: serverTimestamp(),
      })
      
      console.log('[DocumentSharingService] Permissions updated successfully')
    } catch (error) {
      console.error('[DocumentSharingService] Error updating permissions:', error)
      throw error
    }
  }
  
  /**
   * Remove a user's access from a document
   * @param documentId - ID of the document
   * @param userId - ID of the user to remove
   * @param ownerId - ID of the user making the change (must be owner)
   */
  static async removeUserAccess(
    documentId: string,
    userId: string,
    ownerId: string
  ): Promise<void> {
    console.log('[DocumentSharingService] Removing user access:', { documentId, userId })
    
    try {
      const docRef = doc(firestore, 'documents', documentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Document not found')
      }
      
      const document = docSnap.data() as Document
      
      // Only the document owner can remove access
      if (document.ownerId !== ownerId) {
        throw new Error('Access denied: You do not own this document')
      }
      
      const accessToRemove = document.sharedWith.find(access => access.userId === userId)
      
      if (!accessToRemove) {
        console.warn('[DocumentSharingService] User to remove was not found in sharedWith list')
        return
      }
      
      await updateDoc(docRef, {
        sharedWith: arrayRemove(accessToRemove),
        sharedWithUids: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      })
      
      console.log('[DocumentSharingService] User access removed successfully')
    } catch (error) {
      console.error('[DocumentSharingService] Error removing user access:', error)
      throw new Error('Failed to remove user access')
    }
  }
  
  /**
   * Get all sharing information for a document (shared users and active links)
   * @param documentId - ID of the document
   * @param ownerId - ID of the user requesting info (must be owner)
   * @returns Document sharing info
   */
  static async getDocumentSharingInfo(
    documentId: string,
    ownerId: string
  ): Promise<DocumentSharingInfo> {
    console.log('[DocumentSharingService] Getting document sharing info:', { documentId, ownerId })
    
    try {
      const docRef = doc(firestore, 'documents', documentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Document not found')
      }
      
      const docData = { id: docSnap.id, ...docSnap.data() } as Document
      
      if (docData.ownerId !== ownerId) {
        throw new Error('Access denied: You do not own this document')
      }
      
      // Get active share tokens for this document
      const activeTokensQuery = query(
        collection(firestore, 'shareTokens'),
        where('documentId', '==', documentId)
      )
      const tokenSnap = await getDocs(activeTokensQuery)
      const activeTokens = tokenSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ShareToken[]
      
      console.log('[DocumentSharingService] Retrieved sharing info with', activeTokens.length, 'active tokens')
      
      return {
        document: docData,
        sharedWith: docData.sharedWith,
        activeTokens,
      }
    } catch (error) {
      console.error('[DocumentSharingService] Error getting document sharing info:', error)
      throw new Error('Failed to retrieve sharing information')
    }
  }
  
  /**
   * Revoke a share token
   * @param tokenId - ID of the token to revoke
   * @param ownerId - ID of the user requesting (must match doc owner)
   */
  static async revokeShareToken(tokenId: string, ownerId: string): Promise<void> {
    console.log('[DocumentSharingService] Revoking share token:', { tokenId, ownerId })
    
    try {
      const tokenRef = doc(firestore, 'shareTokens', tokenId)
      const tokenSnap = await getDoc(tokenRef)
      
      if (!tokenSnap.exists()) {
        throw new Error('Share token not found')
      }
      
      const tokenData = tokenSnap.data() as ShareToken
      
      // Verify ownership before revoking
      const docRef = doc(firestore, 'documents', tokenData.documentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists() || (docSnap.data() as Document).ownerId !== ownerId) {
        throw new Error('Access denied to revoke this token')
      }
      
      await deleteDoc(tokenRef)
      console.log('[DocumentSharingService] Share token revoked successfully')
    } catch (error) {
      console.error('[DocumentSharingService] Error revoking share token:', error)
      throw new Error('Failed to revoke share token')
    }
  }
} 