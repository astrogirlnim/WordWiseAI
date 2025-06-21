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
import { 
  FileText, 
  Plus, 
  ChevronDown, 
  Clock, 
  BarChart3, 
  Trash, 
  Users,
  Crown,
  Eye,
  MessageSquare,
  Edit,
  Share2,
} from "lucide-react"
import type { Document } from "@/types/document"
import { formatLastSaved } from "@/utils/document-utils"

interface EnhancedDocumentListProps {
  documents: Document[]
  ownedDocuments?: Document[]
  sharedDocuments?: Document[]
  activeDocumentId?: string
  onDocumentSelect?: (documentId: string) => void
  onNewDocument?: () => void
  onDeleteDocument?: (documentId: string) => Promise<void>
}

export function EnhancedDocumentList({
  documents = [],
  ownedDocuments = [],
  sharedDocuments = [],
  activeDocumentId,
  onDocumentSelect,
  onNewDocument,
  onDeleteDocument,
}: EnhancedDocumentListProps) {
  const { user, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  console.log('[EnhancedDocumentList] Rendered with:', {
    totalDocs: documents.length,
    ownedDocs: ownedDocuments.length,
    sharedDocs: sharedDocuments.length,
    activeDocumentId
  })

  // Use the separated lists if provided, otherwise fallback to the combined list
  const ownedDocs = ownedDocuments.length > 0 ? ownedDocuments : documents.filter(doc => doc.ownerId === user?.uid)
  const sharedDocs = sharedDocuments.length > 0 ? sharedDocuments : documents.filter(doc => 
    doc.ownerId !== user?.uid && doc.sharedWith.some(access => access.userId === user?.uid)
  )

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

  const getRoleIcon = (document: Document) => {
    if (!user?.uid) return <FileText className="h-4 w-4" />
    
    if (document.ownerId === user.uid) {
      return <Crown className="h-4 w-4 text-yellow-500" />
    }
    
    const sharedAccess = document.sharedWith.find(access => access.userId === user.uid)
    switch (sharedAccess?.role) {
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'commenter':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getRoleBadge = (document: Document) => {
    if (!user?.uid) return null
    
    if (document.ownerId === user.uid) {
      return <Badge variant="default" className="text-xs">owner</Badge>
    }
    
    const sharedAccess = document.sharedWith.find(access => access.userId === user.uid)
    if (sharedAccess) {
      return <Badge variant="secondary" className="text-xs">{sharedAccess.role}</Badge>
    }
    
    return null
  }

  // Find the active document from either owned or shared
  const activeDocument = [...ownedDocs, ...sharedDocs].find((doc) => doc.id === activeDocumentId) || 
                         ownedDocs[0] || sharedDocs[0]

  const handleDocumentSelect = (documentId: string) => {
    console.log('[EnhancedDocumentList] Selecting document:', documentId)
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

  const canDeleteDocument = (document: Document) => {
    return user?.uid && document.ownerId === user.uid
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 h-9">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  const DocumentItem = ({ document, showDeleteButton = true }: { 
    document: Document; 
    showDeleteButton?: boolean;
  }) => (
    <DropdownMenuItem
      className="group flex flex-col items-start gap-2 p-4 cursor-pointer"
      onClick={() => handleDocumentSelect(document.id)}
      onSelect={(e) => {
        if (deleteCandidateId) e.preventDefault()
      }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {getRoleIcon(document)}
          <span className="font-medium truncate flex-1">
            {document.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {getRoleBadge(document)}
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
          
          {/* Show sharing status for owned documents */}
          {document.ownerId === user?.uid && document.sharedWith.length > 0 && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {document.sharedWith.length}
            </Badge>
          )}
          
          {/* Delete button - only for owned documents */}
          {showDeleteButton && canDeleteDocument(document) && onDeleteDocument && (
            <AlertDialog
              open={deleteCandidateId === document.id}
              onOpenChange={(open: boolean) => {
                if (!open) {
                  handleDeleteCancel()
                }
              }}
            >
              <AlertDialogTrigger
                asChild
                onClick={(e: React.MouseEvent) => {
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
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the document &quot;{document.title}&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    handleDeleteCancel()
                  }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e: React.MouseEvent) => {
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

      {/* Document metadata */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground w-full">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatLastSaved(
            document.lastSaved instanceof Date 
              ? document.lastSaved 
              : typeof document.lastSaved === 'number' 
                ? new Date(document.lastSaved) 
                : (document.lastSaved && typeof (document.lastSaved as { toMillis?: () => number }).toMillis === 'function')
                  ? new Date((document.lastSaved as { toMillis: () => number }).toMillis())
                  : new Date()
          )}
        </div>
        <div className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          <span className={getAlignmentColor(document.analysisSummary.brandAlignmentScore)}>
            {document.analysisSummary.brandAlignmentScore}% aligned
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {document.wordCount} words
        </div>
      </div>
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 h-9">
          {getRoleIcon(activeDocument || ownedDocs[0] || sharedDocs[0])}
          <span className="max-w-[200px] truncate">
            {activeDocument?.title || "Select Document"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Documents</span>
          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={onNewDocument}>
            <Plus className="h-3 w-3" />
            New
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-[400px] overflow-y-auto">
          {/* Owned Documents Section */}
          {ownedDocs.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Crown className="h-4 w-4" />
                My Documents ({ownedDocs.length})
              </DropdownMenuLabel>
              {ownedDocs.map((document) => (
                <DocumentItem key={document.id} document={document} showDeleteButton={true} />
              ))}
            </>
          )}

          {/* Separator between sections */}
          {ownedDocs.length > 0 && sharedDocs.length > 0 && (
            <DropdownMenuSeparator />
          )}

          {/* Shared Documents Section */}
          {sharedDocs.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Share2 className="h-4 w-4" />
                Shared With Me ({sharedDocs.length})
              </DropdownMenuLabel>
              {sharedDocs.map((document) => (
                <DocumentItem key={document.id} document={document} showDeleteButton={false} />
              ))}
            </>
          )}

          {/* No documents message */}
          {ownedDocs.length === 0 && sharedDocs.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents yet</p>
              <p className="text-xs">Create your first document to get started</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
