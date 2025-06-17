"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, ChevronDown, Clock, BarChart3, Trash } from "lucide-react"
import type { Document } from "@/types/document"
import { formatLastSaved } from "@/utils/document-utils"
import { Timestamp } from "firebase/firestore"

interface EnhancedDocumentListProps {
  documents: Document[]
  activeDocumentId?: string
  onDocumentSelect?: (documentId: string) => void
  onNewDocument?: () => void
  onDeleteDocument?: (documentId: string) => Promise<void>
}

export function EnhancedDocumentList({
  documents,
  activeDocumentId,
  onDocumentSelect,
  onNewDocument,
  onDeleteDocument,
}: EnhancedDocumentListProps) {
  const { loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "review":
        return "default"
      case "final":
        return "default"
      case "archived":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getAlignmentColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-blue-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const activeDocument =
    documents.find((doc) => doc.id === activeDocumentId) || documents[0]

  const handleDocumentSelect = (documentId: string) => {
    onDocumentSelect?.(documentId)
    setIsOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (deleteCandidateId) {
      setIsDeleting(true)
      try {
        await onDeleteDocument?.(deleteCandidateId)
      } finally {
        setIsDeleting(false)
        setDeleteCandidateId(null)
      }
    }
  }

  const handleDeleteCancel = () => {
    setDeleteCandidateId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 h-9">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 h-9">
          <FileText className="h-4 w-4" />
          <span className="max-w-[200px] truncate">
            {activeDocument?.title || "Select Document"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Recent Documents</span>
          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={onNewDocument}>
            <Plus className="h-3 w-3" />
            New
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-[400px] overflow-y-auto">
          {documents.map((document) => (
            <DropdownMenuItem
              key={document.id}
              className="group flex flex-col items-start gap-2 p-4 cursor-pointer"
              onClick={() => handleDocumentSelect(document.id)}
              onSelect={(e) => {
                if (deleteCandidateId) e.preventDefault()
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium truncate flex-1">
                  {document.title}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getStatusColor(document.status)}
                    className="text-xs"
                  >
                    {document.status}
                  </Badge>
                  {document.id === activeDocumentId && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                  {onDeleteDocument && (
                    <AlertDialog
                      open={deleteCandidateId === document.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          handleDeleteCancel()
                        }
                      }}
                    >
                      <AlertDialogTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteCandidateId(document.id)
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          aria-label={`Delete document ${document.title}`}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the document "{document.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCancel()
                          }}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteConfirm()
                            }}
                            disabled={isDeleting}
                          >
                            {isDeleting && (
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                            )}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastSaved(
                      document.updatedAt instanceof Timestamp
                        ? document.updatedAt.toDate()
                        : new Date(document.updatedAt as number),
                    )}
                  </div>
                  <span>{document.wordCount} words</span>
                </div>

                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span
                    className={getAlignmentColor(
                      document.analysisSummary.brandAlignmentScore,
                    )}
                  >
                    {document.analysisSummary.brandAlignmentScore}%
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        {documents.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents yet</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={onNewDocument}>
              Create your first document
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
