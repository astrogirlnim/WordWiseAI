import {
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  limit,
  deleteDoc,
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import type { Version } from '@/types/version'
import type { UserProfile } from '@/types/user'

export class VersionService {
  static async getVersions(documentId: string): Promise<Version[]> {
    try {
      console.log('[VersionService.getVersions] Getting versions for document:', documentId)
      console.log('[VersionService.getVersions] Collection path:', `documents/${documentId}/versions`)
      const versionsRef = collection(
        firestore,
        `documents/${documentId}/versions`,
      )
      const q = query(versionsRef, orderBy('createdAt', 'desc'))
      console.log('[VersionService.getVersions] Executing query...')
      const querySnapshot = await getDocs(q)
      console.log('[VersionService.getVersions] Query completed, raw docs count:', querySnapshot.docs.length)
      const versions = querySnapshot.docs.map(
        (doc) => {
          console.log('[VersionService.getVersions] Processing doc:', doc.id, 'data:', doc.data())
          return { id: doc.id, ...doc.data() } as Version
        },
      )
      console.log('[VersionService.getVersions] Found', versions.length, 'versions for document:', documentId)
      console.log('[VersionService.getVersions] Versions:', versions.map(v => ({ id: v.id, authorName: v.authorName, contentLength: v.content?.length })))
      return versions
    } catch (error) {
      console.error('[VersionService.getVersions] Error getting versions:', error)
      console.error('[VersionService.getVersions] Error details:', error)
      return []
    }
  }

  static async getVersion(
    documentId: string,
    versionId: string,
  ): Promise<Version | null> {
    try {
      console.log('[VersionService.getVersion] Getting version:', versionId, 'for document:', documentId)
      const versionRef = doc(
        firestore,
        `documents/${documentId}/versions`,
        versionId,
      )
      const docSnap = await getDoc(versionRef)

      if (docSnap.exists()) {
        const version = { id: docSnap.id, ...docSnap.data() } as Version
        console.log('[VersionService.getVersion] Version found with content length:', version.content.length)
        return version
      }
      console.log('[VersionService.getVersion] Version not found')
      return null
    } catch (error) {
      console.error('[VersionService.getVersion] Error getting version:', error)
      throw new Error('Failed to get version')
    }
  }

  /**
   * Create a new version with enhanced user tracking for collaboration
   * @param documentId - Document ID to create version for
   * @param content - Document content at time of version
   * @param authorId - User ID of the author
   * @param authorName - Display name of the author
   * @param title - Optional title of the document at time of version
   * @returns Promise<string | null> - Version ID if successful
   */
  static async createVersion(
    documentId: string,
    content: string,
    authorId: string,
    authorName: string,
    title?: string
  ): Promise<string | null> {
    try {
      console.log('[VersionService.createVersion] Creating version for document:', documentId)
      console.log('[VersionService.createVersion] Author:', authorName, '(ID:', authorId, ')')
      console.log('[VersionService.createVersion] Content length:', content.length)
      console.log('[VersionService.createVersion] Title:', title)

      const versionsRef = collection(firestore, `documents/${documentId}/versions`)
      
      const versionData = {
        content,
        authorId,
        authorName,
        title: title || 'Untitled Document',
        createdAt: serverTimestamp(),
        // Additional metadata for collaboration tracking
        contentLength: content.length,
        wordCount: content.trim().split(/\s+/).filter(Boolean).length,
        changeType: 'manual_save', // Could be expanded to track different types of changes
      }

      console.log('[VersionService.createVersion] Version data prepared:', {
        ...versionData,
        content: `${content.substring(0, 100)}...`,
      })

      const docRef = await addDoc(versionsRef, versionData)
      
      console.log('[VersionService.createVersion] Version created successfully with ID:', docRef.id)
      console.log('[VersionService.createVersion] Collection path was:', `documents/${documentId}/versions`)
      
      return docRef.id
    } catch (error) {
      console.error('[VersionService.createVersion] Error creating version:', error)
      console.error('[VersionService.createVersion] Document ID:', documentId)
      console.error('[VersionService.createVersion] Author ID:', authorId)
      console.error('[VersionService.createVersion] Author Name:', authorName)
      console.error('[VersionService.createVersion] Content length:', content?.length)
      return null
    }
  }

  /**
   * Permanently deletes a single version document from Firestore.
   * @param documentId The parent document identifier
   * @param versionId  The version identifier to delete
   */
  static async deleteVersion(documentId: string, versionId: string): Promise<void> {
    try {
      console.log('[VersionService.deleteVersion] Deleting version:', versionId, 'from document:', documentId)
      
      const versionRef = doc(firestore, `documents/${documentId}/versions/${versionId}`)
      await deleteDoc(versionRef)
      
      console.log('[VersionService.deleteVersion] Version deleted successfully')
    } catch (error) {
      console.error('[VersionService.deleteVersion] Error deleting version:', error)
      throw error
    }
  }

  /**
   * Get the latest version for a document
   * @param documentId - Document ID
   * @returns Promise<Version | null> - Latest version or null
   */
  static async getLatestVersion(documentId: string): Promise<Version | null> {
    try {
      console.log('[VersionService.getLatestVersion] Getting latest version for document:', documentId)
      
      const versionsRef = collection(firestore, `documents/${documentId}/versions`)
      const q = query(versionsRef, orderBy('createdAt', 'desc'), limit(1))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        console.log('[VersionService.getLatestVersion] No versions found for document:', documentId)
        return null
      }
      
      const latestDoc = querySnapshot.docs[0]
      const version = { id: latestDoc.id, ...latestDoc.data() } as Version
      
      console.log('[VersionService.getLatestVersion] Latest version found:', version.id, 'by', version.authorName)
      return version
    } catch (error) {
      console.error('[VersionService.getLatestVersion] Error getting latest version:', error)
      return null
    }
  }

  /**
   * Get versions by author for collaboration analytics
   * @param documentId - Document ID
   * @param authorId - Author ID to filter by
   * @returns Promise<Version[]> - Versions by author
   */
  static async getVersionsByAuthor(documentId: string, authorId: string): Promise<Version[]> {
    try {
      console.log('[VersionService.getVersionsByAuthor] Getting versions by author:', authorId, 'for document:', documentId)
      
      const versionsRef = collection(firestore, `documents/${documentId}/versions`)
      // Note: This would require a Firestore index on authorId field
      // For now, we'll get all versions and filter client-side
      const q = query(versionsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const authorVersions = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Version))
        .filter(version => version.authorId === authorId)
      
      console.log('[VersionService.getVersionsByAuthor] Found', authorVersions.length, 'versions by author:', authorId)
      return authorVersions
    } catch (error) {
      console.error('[VersionService.getVersionsByAuthor] Error getting versions by author:', error)
      return []
    }
  }
} 