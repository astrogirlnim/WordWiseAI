'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, ChevronDown, Clock } from 'lucide-react'
import type { DocumentListItem } from '@/types/navigation'
import { formatLastSaved } from '@/utils/document-utils'

interface DocumentListProps {
  documents: DocumentListItem[]
  activeDocumentId?: string
  onDocumentSelect?: (documentId: string) => void
  onNewDocument?: () => void
}

export function DocumentList({
  documents,
  activeDocumentId,
  onDocumentSelect,
  onNewDocument,
}: DocumentListProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeDocument =
    documents.find((doc) => doc.id === activeDocumentId) || documents[0]

  const handleDocumentSelect = (documentId: string) => {
    onDocumentSelect?.(documentId)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-9 items-center gap-2 px-3">
          <FileText className="h-4 w-4" />
          <span className="max-w-[200px] truncate">
            {activeDocument?.title || 'Select Document'}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Recent Documents</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2"
            onClick={onNewDocument}
          >
            <Plus className="h-3 w-3" />
            New
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-[300px] overflow-y-auto">
          {documents.map((document) => (
            <DropdownMenuItem
              key={document.id}
              className="flex cursor-pointer flex-col items-start gap-1 p-3"
              onClick={() => handleDocumentSelect(document.id)}
            >
              <div className="flex w-full items-center justify-between">
                <span className="flex-1 truncate font-medium">
                  {document.title}
                </span>
                {document.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatLastSaved(document.lastModified)}
                </div>
                <span>{document.wordCount} words</span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        {documents.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No documents yet</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={onNewDocument}
            >
              Create your first document
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
