'use client'

import { useState, useEffect } from 'react'
import type { DocumentVersion } from '@/types/document'
import { DocumentService } from '@/services/document-service'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { History } from 'lucide-react'

interface VersionHistorySidebarProps {
  documentId: string
  onRestoreVersion: (versionId: string) => void
}

export function VersionHistorySidebar({ documentId, onRestoreVersion }: VersionHistorySidebarProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchVersions() {
      try {
        setIsLoading(true)
        const fetchedVersions = await DocumentService.getDocumentVersions(documentId)
        setVersions(fetchedVersions)
      } catch (error) {
        console.error('Failed to fetch document versions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (documentId) {
      fetchVersions()
    }
  }, [documentId])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          Version History
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="space-y-4 p-4">
            {isLoading && <p>Loading versions...</p>}
            {!isLoading && versions.length === 0 && <p>No versions found.</p>}
            {versions.map((version) => (
              <div key={version.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Saved{' '}
                    {formatDistanceToNow(new Date(version.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <Button size="sm" onClick={() => onRestoreVersion(version.id)}>
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 