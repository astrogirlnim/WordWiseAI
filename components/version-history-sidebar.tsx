'use client'

import { Button } from './ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from './ui/sheet'
import { Skeleton } from './ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import type { Version } from '@/types/version'

interface VersionHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  onRestore: (versionId: string) => void
  onView: (versionContent: string) => void
  versions: Version[]
  loading?: boolean
  error?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRelativeTime = (timestamp: any) => {
  if (!timestamp) return ''
  // Firestore Timestamps can be seconds and nanoseconds, or a toDate() method.
  if (timestamp.toDate) {
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true })
  }
  if (timestamp.seconds) {
    return formatDistanceToNow(new Date(timestamp.seconds * 1000), {
      addSuffix: true,
    })
  }
  if (typeof timestamp === 'number') {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }
  return formatDistanceToNow(new Date(), { addSuffix: true })
}

export function VersionHistorySidebar({
  isOpen,
  onClose,
  onRestore,
  onView,
  versions,
  loading = false,
  error = null,
}: VersionHistorySidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>
            Review and restore previous versions of your document.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-4">
          {loading && (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {!loading && !error && versions.length === 0 && (
            <p className="text-muted-foreground mt-4">
              No versions found for this document.
            </p>
          )}
          <div className="space-y-2 mt-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className="border p-4 rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {getRelativeTime(version.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    by {version.authorName}
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(version.content)}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRestore(version.id)}
                  >
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 