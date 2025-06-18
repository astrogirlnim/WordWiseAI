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
import { formatDistanceToNow, isValid } from 'date-fns'
import type { Version } from '@/types/version'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { Eye, RotateCcw, Trash2 } from 'lucide-react'

interface VersionHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  onRestore: (versionId: string) => void
  onView: (versionContent: string) => void
  onDelete: (versionId: string) => void
  versions: Version[]
  loading?: boolean
  error?: string | null
  restoringVersionId?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRelativeTime = (timestamp: any): string => {
  if (!timestamp) {
    return 'No date'
  }

  let date: Date | null = null

  // Firestore Timestamps can be a toDate() method.
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate()
  }
  // Or they can be an object with seconds and nanoseconds.
  else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000)
  }
  // Or it could be a JS timestamp (in milliseconds).
  else if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  }
  // Or it could be a date string.
  else if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  }

  if (date && isValid(date)) {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return 'Invalid date'
}

export function VersionHistorySidebar({
  isOpen,
  onClose,
  onRestore,
  onView,
  onDelete,
  versions,
  loading = false,
  error = null,
  restoringVersionId = null,
}: VersionHistorySidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>
            Review and restore previous versions of your document.
            {restoringVersionId && (
              <span className="block mt-2 text-sm text-blue-600">
                Restoring version...
              </span>
            )}
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
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 font-medium">Error loading versions</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
          {!loading && !error && versions.length === 0 && (
            <div className="mt-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-muted-foreground">No versions found for this document.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Versions will appear here as you make changes to your document.
              </p>
            </div>
          )}
          <div className="space-y-4 mt-4">
            {versions.map((version, index) => {
              const isRestoring = restoringVersionId === version.id
              const isLatestVersion = index === 0
              
              return (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    isRestoring 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'hover:bg-gray-50 hover:border-gray-300'
                  } ${isLatestVersion ? 'border-green-200 bg-green-50' : ''}`}
                >
                  {/* Unified Vertical Layout for All Screen Sizes */}
                  <div className="space-y-3">
                    {/* Version Information Section - Stacked Vertically */}
                    <div className="space-y-2">
                      {/* Title and Badges Row */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex-1">
                          {getRelativeTime(version.createdAt)}
                        </h3>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {isLatestVersion && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Latest
                            </span>
                          )}
                          {isRestoring && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Restoring...
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Author Information */}
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Author:</span>{' '}
                        <span className="truncate inline-block max-w-[200px] align-bottom">
                          {version.authorName}
                        </span>
                      </p>
                      
                      {/* Character Count */}
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Content:</span>{' '}
                        {version.content.length.toLocaleString()} characters
                      </p>
                    </div>
                    
                    {/* Action Buttons Section - All Three in One Row */}
                    <div className="pt-2 border-t border-gray-100">
                      <TooltipProvider>
                        <div className="flex gap-2 justify-center sm:justify-start">
                          {/* View Button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onView(version.content)}
                                disabled={isRestoring}
                                className="flex-1 sm:flex-initial min-w-0 px-3 py-2 h-8 text-xs font-medium"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                <span className="truncate">View</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View this version&apos;s content</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          {/* Restore Button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onRestore(version.id)}
                                disabled={isRestoring || restoringVersionId !== null}
                                className="flex-1 sm:flex-initial min-w-0 px-3 py-2 h-8 text-xs font-medium"
                              >
                                {isRestoring ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                    <span className="truncate">Restoring</span>
                                  </div>
                                ) : (
                                  <>
                                    <RotateCcw className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                    <span className="truncate">Restore</span>
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isRestoring ? 'Restoring version...' : 'Restore to this version'}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          {/* Delete Button */}
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    disabled={isRestoring || restoringVersionId !== null}
                                    className="flex-1 sm:flex-initial min-w-0 px-3 py-2 h-8 text-xs font-medium"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                    <span className="truncate">Delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete this version permanently</p>
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this version?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently remove the version from {getRelativeTime(version.createdAt)} created by {version.authorName}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(version.id)}>
                                  Delete Version
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <SheetFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {versions.length} version{versions.length !== 1 ? 's' : ''} available
            </p>
            <SheetClose asChild>
              <Button variant="outline" disabled={restoringVersionId !== null}>
                Close
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 