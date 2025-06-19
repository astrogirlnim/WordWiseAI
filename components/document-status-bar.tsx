'use client'

import type { AutoSaveStatus } from '@/types/document'
import { formatLastSaved } from '@/utils/document-utils'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'

interface DocumentStatusBarProps {
  saveStatus: AutoSaveStatus
  wordCount: number
  characterCount: number
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export function DocumentStatusBar({
  saveStatus,
  wordCount,
  characterCount,
  currentPage,
  totalPages,
  onPageChange,
}: DocumentStatusBarProps) {
  const getSaveStatusIcon = () => {
    switch (saveStatus.status) {
      case 'saving':
        return <Loader2 className="h-3 w-3 animate-spin" />
      case 'checking':
        return <Loader2 className="h-3 w-3 animate-spin" />
      case 'saved':
        return <Check className="h-3 w-3 text-green-600" />
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-600" />
    }
  }

  const getSaveStatusText = () => {
    switch (saveStatus.status) {
      case 'saving':
        return 'Saving...'
      case 'checking':
        return 'Checking...'
      case 'saved':
        if (!saveStatus.lastSaved) return 'Saved'
        const date =
          saveStatus.lastSaved instanceof Timestamp
            ? saveStatus.lastSaved.toDate()
            : new Date(saveStatus.lastSaved as number)
        return `Saved ${formatLastSaved(date)}`
      case 'error':
        return 'Save failed'
    }
  }

  return (
    <div className="flex items-center justify-between border-t bg-background/50 px-6 py-2 text-xs text-muted-foreground backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {getSaveStatusIcon()}
        <span>{getSaveStatusText()}</span>
      </div>

      {totalPages && totalPages > 1 && currentPage && onPageChange && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) {
                    onPageChange(currentPage - 1)
                  }
                }}
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) {
                    onPageChange(currentPage + 1)
                  }
                }}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <div className="flex items-center gap-4">
        <span>{wordCount} words</span>
        <span>{characterCount} characters</span>
      </div>
    </div>
  )
}
