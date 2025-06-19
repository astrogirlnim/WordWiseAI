'use client'

import { useState, useEffect, useCallback } from 'react'
import { VersionService } from '@/services/version-service'
import type { Version } from '@/types/version'

export function useDocumentVersions(documentId: string | null) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVersions = useCallback(async () => {
    console.log('[useDocumentVersions] loadVersions called with documentId:', documentId)
    if (!documentId) {
      console.log('[useDocumentVersions] No documentId, clearing versions')
      setVersions([])
      setLoading(false)
      return
    }

    try {
      console.log('[useDocumentVersions] Starting to load versions for document:', documentId)
      setLoading(true)
      const docVersions = await VersionService.getVersions(documentId)
      console.log('[useDocumentVersions] Received versions:', docVersions.length)
      console.log('[useDocumentVersions] Version objects:', docVersions)
      setVersions(docVersions)
      setError(null)
    } catch (err) {
      console.error('[useDocumentVersions] Error loading versions for doc', documentId, ':', err)
      setError('Failed to load versions')
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  const deleteVersion = useCallback(
    async (versionId: string) => {
      if (!documentId) return

      try {
        await VersionService.deleteVersion(documentId, versionId)
        console.log('[useDocumentVersions] Deleted version', versionId, 'for document', documentId)
        await loadVersions()
      } catch (err) {
        console.error('[useDocumentVersions] Error deleting version', err)
        throw err
      }
    },
    [documentId, loadVersions],
  )

  return { versions, loading, error, reloadVersions: loadVersions, deleteVersion }
} 