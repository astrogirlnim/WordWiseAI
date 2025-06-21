'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { DocumentExportService } from '@/services/document-export-service'
import { useToast } from '@/hooks/use-toast'
import { Timestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  Download, 
  FileText, 
  FileDown, 
  Loader2, 
  Info
} from 'lucide-react'
import type { Document, ExportFormat, ExportOptions, FirestoreTimestamp } from '@/types/document'

/**
 * Convert FirestoreTimestamp to Date for display purposes
 */
function timestampToDate(timestamp: FirestoreTimestamp): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp)
  }
  // Fallback for FieldValue or other types
  return new Date()
}

interface DocumentDownloadButtonProps {
  document: Document | null
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function DocumentDownloadButton({
  document,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
}: DocumentDownloadButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isDownloading, setIsDownloading] = useState(false)
  const [showOptionsDialog, setShowOptionsDialog] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [includeMetadata, setIncludeMetadata] = useState(true)

  console.log('[DocumentDownloadButton] Rendered with:', {
    documentId: document?.id,
    documentTitle: document?.title,
    userId: user?.uid,
    hasContent: !!document?.content
  })

  // Check if user can download the document (needs view access)
  const canDownload = () => {
    if (!document || !user) {
      console.log('[DocumentDownloadButton] Cannot download - missing document or user')
      return false
    }

    // Users can download documents they own or have been shared with
    const isOwner = document.ownerId === user.uid
    const hasSharedAccess = document.sharedWith?.some(access => access.userId === user.uid)
    const canAccess = isOwner || hasSharedAccess

    console.log('[DocumentDownloadButton] Download access check:', {
      isOwner,
      hasSharedAccess,
      canAccess,
      documentId: document.id
    })

    return canAccess
  }

  // Check if export is supported in current environment
  const isExportSupported = DocumentExportService.isExportSupported()

  if (!document || !user || !canDownload() || !isExportSupported) {
    console.log('[DocumentDownloadButton] Not rendering - requirements not met:', {
      hasDocument: !!document,
      hasUser: !!user,
      canDownload: canDownload(),
      isExportSupported
    })
    return null
  }

  const handleQuickDownload = async (format: ExportFormat) => {
    console.log('[DocumentDownloadButton] Quick download requested:', format)
    
    if (!document) return

    setIsDownloading(true)

    try {
      const options: ExportOptions = {
        format,
        includeMetadata: true, // Default to true for quick downloads
      }

      console.log('[DocumentDownloadButton] Starting export with options:', options)
      
      const result = await DocumentExportService.exportDocument(document, options)

      if (result.success) {
        console.log('[DocumentDownloadButton] ✓ Export successful:', result.filename)
        
        toast({
          title: 'Download Started',
          description: `${document.title} is being downloaded as ${format.toUpperCase()}.`,
        })
      } else {
        console.error('[DocumentDownloadButton] ✗ Export failed:', result.error)
        
        toast({
          title: 'Download Failed',
          description: result.error || 'Failed to download document. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[DocumentDownloadButton] Unexpected error during download:', error)
      
      toast({
        title: 'Download Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCustomDownload = async () => {
    console.log('[DocumentDownloadButton] Custom download with options:', {
      format: selectedFormat,
      includeMetadata
    })
    
    if (!document) return

    setIsDownloading(true)
    setShowOptionsDialog(false)

    try {
      const options: ExportOptions = {
        format: selectedFormat,
        includeMetadata,
      }

      const result = await DocumentExportService.exportDocument(document, options)

      if (result.success) {
        console.log('[DocumentDownloadButton] ✓ Custom export successful:', result.filename)
        
        toast({
          title: 'Download Complete',
          description: `${document.title} has been downloaded as ${selectedFormat.toUpperCase()}.`,
        })
      } else {
        console.error('[DocumentDownloadButton] ✗ Custom export failed:', result.error)
        
        toast({
          title: 'Download Failed',
          description: result.error || 'Failed to download document. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[DocumentDownloadButton] Unexpected error during custom download:', error)
      
      toast({
        title: 'Download Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Show loading state during download
  if (isDownloading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2 shrink-0" />
        {size !== 'icon' && showLabel && 'Downloading...'}
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
          >
            <Download className="h-4 w-4 shrink-0" />
            {size !== 'icon' && showLabel && (
              <span className="ml-2">Download</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export Document
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Quick Download Options */}
          <DropdownMenuItem
            onClick={() => handleQuickDownload('pdf')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-red-500" />
            <div className="flex flex-col">
              <span className="font-medium">PDF Document</span>
              <span className="text-xs text-muted-foreground">
                Formatted for printing & sharing
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleQuickDownload('markdown')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="font-medium">Markdown File</span>
              <span className="text-xs text-muted-foreground">
                Plain text with formatting
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Custom Options */}
          <DropdownMenuItem
            onClick={() => setShowOptionsDialog(true)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Info className="h-4 w-4" />
            <span>More Options...</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Download Options Dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Options
            </DialogTitle>
                         <DialogDescription>
               Customize your download settings for &ldquo;{document.title}&rdquo;
             </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Format</Label>
              <div className="space-y-2">
                <div
                  className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedFormat === 'pdf' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-border'
                  }`}
                  onClick={() => setSelectedFormat('pdf')}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedFormat === 'pdf' 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground'
                  }`} />
                  <FileText className="h-4 w-4 text-red-500" />
                  <div className="flex-1">
                    <div className="font-medium">PDF Document</div>
                    <div className="text-xs text-muted-foreground">
                      Professional formatting, suitable for printing
                    </div>
                  </div>
                </div>
                
                <div
                  className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedFormat === 'markdown' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-border'
                  }`}
                  onClick={() => setSelectedFormat('markdown')}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedFormat === 'markdown' 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground'
                  }`} />
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">Markdown File</div>
                    <div className="text-xs text-muted-foreground">
                      Plain text with markup, ideal for editing
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Additional Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                />
                <Label
                  htmlFor="include-metadata"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include document metadata
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Adds creation date, word count, and other document information
              </p>
            </div>

            {/* Document Info */}
            <div className="rounded-lg bg-muted/50 p-3">
                             <div className="text-xs text-muted-foreground space-y-1">
                 <div><strong>Word Count:</strong> {document.wordCount || 0} words</div>
                 <div><strong>Status:</strong> {document.status}</div>
                 <div><strong>Last Modified:</strong> {timestampToDate(document.updatedAt).toLocaleDateString()}</div>
               </div>
            </div>
          </div>

          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOptionsDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomDownload}
              disabled={isDownloading}
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download {selectedFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}