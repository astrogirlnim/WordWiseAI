import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type {
  Document as DocumentType,
  FirestoreTimestamp,
} from '@/types/document'
import { DocumentSharingService } from './document-sharing-service'

const getMillis = (timestamp: FirestoreTimestamp | undefined): number => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis()
  }
  if (typeof timestamp === 'number') {
    return timestamp
  }
  return 0 // Or handle as an error, depending on requirements
}

export class DocumentService {
  static async createDocument(
    ownerId: string,
    title: string,
  ): Promise<string> {
    try {
      const docData: Omit<DocumentType, 'id'> = {
        title,
        content: '',
        ownerId,
        orgId: '', // Default empty for MVP
        status: 'draft',
        sharedWith: [],
        isPublic: false,
        publicViewMode: 'view',
        workflowState: {
          currentStatus: 'draft',
          submittedForReview: false,
          reviewedBy: [],
        },
        analysisSummary: {
          overallScore: 0,
          brandAlignmentScore: 0,
          lastAnalyzedAt: serverTimestamp(),
          suggestionCount: 0,
        },
        lastSaved: serverTimestamp(),
        wordCount: 0,
        characterCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(firestore, 'documents'), docData)
      console.log('[DocumentService] Created new document with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error creating document:', error)
      throw new Error('Failed to create document')
    }
  }

  static async updateDocument(
    documentId: string,
    updates: Partial<DocumentType>,
  ): Promise<void> {
    try {
      const docRef = doc(firestore, 'documents', documentId)
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastSaved: serverTimestamp(),
      }
      await updateDoc(docRef, updateData)
      console.log('[DocumentService] Updated document:', documentId)
    } catch (error) {
      console.error('Error updating document:', error)
      throw new Error('Failed to update document')
    }
  }

  static async getDocument(documentId: string): Promise<DocumentType | null> {
    try {
      const docRef = doc(firestore, 'documents', documentId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        console.log('[DocumentService] Retrieved document:', documentId)
        return { id: docSnap.id, ...docSnap.data() } as DocumentType
      }

      console.log('[DocumentService] Document not found:', documentId)
      return null
    } catch (error) {
      console.error('Error getting document:', error)
      return null
    }
  }

  /**
   * Check if a user has access to a document and return their permission level
   * @param documentId - Document ID to check
   * @param userId - User ID to check access for
   * @returns Permission level or null if no access
   */
  static async getUserDocumentAccess(
    documentId: string, 
    userId: string
  ): Promise<'owner' | 'editor' | 'commenter' | 'viewer' | null> {
    try {
      const document = await this.getDocument(documentId)
      
      if (!document) {
        console.log('[DocumentService] Document not found for access check:', documentId)
        return null
      }

      // Check if user is the owner
      if (document.ownerId === userId) {
        console.log('[DocumentService] User is owner of document:', documentId)
        return 'owner'
      }

      // Check if user is in sharedWith array
      const sharedAccess = document.sharedWith.find(access => access.userId === userId)
      if (sharedAccess) {
        console.log('[DocumentService] User has shared access to document:', documentId, 'role:', sharedAccess.role)
        return sharedAccess.role
      }

      console.log('[DocumentService] User has no access to document:', documentId)
      return null
    } catch (error) {
      console.error('Error checking user document access:', error)
      return null
    }
  }

  static async getUserDocuments(ownerId: string): Promise<DocumentType[]> {
    try {
      console.log('[DocumentService] Fetching documents owned by user:', ownerId)
      
      const q = query(
        collection(firestore, 'documents'),
        where('ownerId', '==', ownerId),
      )
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as DocumentType),
      )
      
      // Sort by updatedAt descending
      documents.sort((a, b) => {
        const timeA = getMillis(a.updatedAt)
        const timeB = getMillis(b.updatedAt)
        return timeB - timeA
      })
      
      console.log('[DocumentService] Found', documents.length, 'owned documents')
      return documents
    } catch (error) {
      console.error('Error getting user documents:', error)
      return []
    }
  }

  /**
   * Get all documents accessible to a user (owned + shared)
   * @param userId - User ID
   * @returns Object with owned and shared documents
   */
  static async getAllUserDocuments(userId: string): Promise<{
    owned: DocumentType[]
    shared: DocumentType[]
  }> {
    console.log('[DocumentService] Fetching all documents accessible to user:', userId)
    
    try {
      // Fetch owned documents
      const ownedPromise = this.getUserDocuments(userId)
      
      // Fetch shared documents
      const sharedPromise = DocumentSharingService.getSharedDocuments(userId)
      
      const [owned, shared] = await Promise.all([ownedPromise, sharedPromise])
      
      console.log('[DocumentService] User has access to', owned.length, 'owned and', shared.length, 'shared documents')
      
      return { owned, shared }
    } catch (error) {
      console.error('Error getting all user documents:', error)
      return { owned: [], shared: [] }
    }
  }

  static subscribeToDocument(
    documentId: string,
    callback: (document: DocumentType | null) => void,
  ): () => void {
    console.log('[DocumentService] Subscribing to document updates:', documentId)
    
    const docRef = doc(firestore, 'documents', documentId)
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const document = { id: docSnap.id, ...docSnap.data() } as DocumentType
        console.log('[DocumentService] Document updated:', documentId)
        callback(document)
      } else {
        console.log('[DocumentService] Document deleted or not found:', documentId)
        callback(null)
      }
    })
    return unsubscribe
  }

  static async deleteDocument(documentId: string): Promise<void> {
    try {
      console.log('[DocumentService] Deleting document:', documentId)
      const docRef = doc(firestore, 'documents', documentId)
      await deleteDoc(docRef)
      console.log('[DocumentService] Document deleted successfully:', documentId)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
  }

  /**
   * Check if user can edit a document based on their permissions
   * @param document - Document to check
   * @param userId - User ID
   * @returns true if user can edit
   */
  static canUserEditDocument(document: DocumentType, userId: string): boolean {
    // Owner can always edit
    if (document.ownerId === userId) {
      return true
    }

    // Check shared permissions
    const sharedAccess = document.sharedWith.find(access => access.userId === userId)
    return sharedAccess?.role === 'editor'
  }

  /**
   * Check if user can comment on a document based on their permissions
   * @param document - Document to check
   * @param userId - User ID
   * @returns true if user can comment
   */
  static canUserCommentOnDocument(document: DocumentType, userId: string): boolean {
    // Owner can always comment
    if (document.ownerId === userId) {
      return true
    }

    // Check shared permissions
    const sharedAccess = document.sharedWith.find(access => access.userId === userId)
    return sharedAccess?.role === 'editor' || sharedAccess?.role === 'commenter'
  }

  /**
   * Check if user can view a document based on their permissions
   * @param document - Document to check
   * @param userId - User ID
   * @returns true if user can view
   */
  static canUserViewDocument(document: DocumentType, userId: string): boolean {
    // Owner can always view
    if (document.ownerId === userId) {
      return true
    }

    // Check shared permissions
    const sharedAccess = document.sharedWith.find(access => access.userId === userId)
    return sharedAccess !== undefined // Any role allows viewing
  }
}
