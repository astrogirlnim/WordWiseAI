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

  static async createVersion(
    documentId: string,
    content: string,
    author: Pick<UserProfile, 'id' | 'name'>,
  ): Promise<string> {
    try {
      console.log('[VersionService.createVersion] Creating version for document:', documentId, 'by author:', author.name, 'content length:', content.length)
      
      // Check if there's a recent version with the same content to prevent duplicates
      const recentVersionsRef = collection(
        firestore,
        `documents/${documentId}/versions`,
      )
      const recentQuery = query(
        recentVersionsRef, 
        orderBy('createdAt', 'desc'), 
        limit(1)
      )
      const recentSnapshot = await getDocs(recentQuery)
      
      if (!recentSnapshot.empty) {
        const lastVersion = recentSnapshot.docs[0].data() as Omit<Version, 'id'>
        const lastContent = lastVersion.content.trim()
        const newContent = content.trim()
        
        console.log('[VersionService.createVersion] Comparing with last version - Last length:', lastContent.length, 'New length:', newContent.length)
        
        if (lastContent === newContent) {
          console.log('[VersionService.createVersion] Content identical to last version, skipping creation')
          return recentSnapshot.docs[0].id
        }
      }
      
      const versionsRef = collection(
        firestore,
        `documents/${documentId}/versions`,
      )
      const versionData: Omit<Version, 'id'> = {
        content,
        authorId: author.id,
        authorName: author.name,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(versionsRef, versionData)
      console.log('[VersionService.createVersion] New version created with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('[VersionService.createVersion] Error creating version:', error)
      throw new Error('Failed to create version')
    }
  }

  /**
   * Permanently deletes a single version document from Firestore.
   * @param documentId The parent document identifier
   * @param versionId  The version identifier to delete
   */
  static async deleteVersion(documentId: string, versionId: string): Promise<void> {
    try {
      console.log('[VersionService.deleteVersion] Deleting version', versionId, 'for document', documentId)
      const versionRef = doc(
        firestore,
        `documents/${documentId}/versions`,
        versionId,
      )
      await deleteDoc(versionRef)
      console.log('[VersionService.deleteVersion] Version deleted successfully')
    } catch (error) {
      console.error('[VersionService.deleteVersion] Error deleting version:', error)
      throw new Error('Failed to delete version')
    }
  }
} 