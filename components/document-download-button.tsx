'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Download, FileText, FileDown, Loader2 } from 'lucide-react'
import { DocumentExportService, type ExportFormat, type ExportResult } from '@/services/document-export-service'
import { toast } from 'sonner'

interface DocumentDownloadButtonProps {
  documentId: string
  title: string
  content: string // HTML content from editor
  author?: string
  className?: string
  disabled?: boolean
}

/**
 * Document Download Button Component
 * 
 * Features:
 * - Dropdown menu with markdown and PDF export options
 * - Professional styling with loading states
 * - Comprehensive error handling with user feedback
 * - Tooltip guidance for users
 * - Toast notifications for export status
 * - Disabled state support
 */
export function DocumentDownloadButton({
  documentId,
  title,
  content,
  author,
  className = '',
  disabled = false
}: DocumentDownloadButtonProps): React.ReactElement {
  console.log('[DocumentDownloadButton] Rendering with:', {
    documentId,
    title,
    contentLength: content.length,
    author: author || 'Unknown',
    disabled
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

  /**
   * Handle document export for a specific format
   * Shows loading state and provides user feedback
   */
  const handleExport = async (format: ExportFormat): Promise<void> => {
    console.log('[DocumentDownloadButton] Starting export for format:', format)
    
    // Validate inputs before proceeding
    if (!documentId || !title || !content) {
      console.error('[DocumentDownloadButton] Missing required data for export:', {
        hasDocumentId: !!documentId,
        hasTitle: !!title,
        hasContent: !!content
      })
      
      toast.error('Export Error', {
        description: 'Missing required document data. Please try again.',
      })
      return
    }

    // Check if already exporting
    if (isExporting) {
      console.log('[DocumentDownloadButton] Export already in progress, ignoring new request')
      return
    }

    try {
      // Set loading state
      setIsExporting(true)
      setExportingFormat(format)
      
      console.log('[DocumentDownloadButton] Export started:', {
        format,
        documentId,
        title,
        contentLength: content.length
      })

      // Show loading toast
      const formatName = format === 'pdf' ? 'PDF' : 'Markdown'
      toast.loading(`Exporting as ${formatName}...`, {
        description: 'Preparing your document for download',
      })

      // Perform the export
      const result: ExportResult = await DocumentExportService.exportDocument({
        documentId,
        title,
        content,
        format,
        author,
        createdAt: new Date()
      })

      console.log('[DocumentDownloadButton] Export result:', result)

      // Handle export result
      if (result.success) {
        // Success - dismiss loading toast and show success
        toast.dismiss()
        toast.success('Export Successful!', {
          description: `${result.message} (${result.filename})`,
        })
        
        console.log('[DocumentDownloadButton] Export completed successfully:', result.filename)
      } else {
        // Error - dismiss loading toast and show error
        toast.dismiss()
        toast.error('Export Failed', {
          description: result.message || 'An unexpected error occurred during export',
        })
        
        console.error('[DocumentDownloadButton] Export failed:', result.error)
      }

    } catch (error) {
      // Handle unexpected errors
      console.error('[DocumentDownloadButton] Unexpected error during export:', error)
      
      toast.dismiss()
      toast.error('Export Error', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      // Reset loading state
      setIsExporting(false)
      setExportingFormat(null)
    }
  }

  /**
   * Get the appropriate icon for the current state
   */
  const getIcon = (): React.ReactElement => {
    if (isExporting) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    return <Download className="h-4 w-4" />
  }

  /**
   * Get the button text based on current state
   */
  const getButtonText = (): string => {
    if (isExporting && exportingFormat) {
      const formatName = exportingFormat === 'pdf' ? 'PDF' : 'Markdown'
      return `Exporting ${formatName}...`
    }
    return 'Download'
  }

  /**
   * Check if content is suitable for export
   */
  const hasContent = content.trim().length > 0
  const isDisabled = disabled || isExporting || !hasContent

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isDisabled}
                className={`
                  relative transition-all duration-200 
                  ${isExporting ? 'shadow-sm ring-1 ring-retro-primary/20' : ''}
                  ${className}
                `}
              >
                {/* Icon */}
                <div className="relative">
                  {getIcon()}
                </div>
                
                {/* Button text */}
                <span className="ml-2 hidden sm:inline">
                  {getButtonText()}
                </span>
                
                {/* Visual feedback for active state */}
                {isExporting && (
                  <div className="absolute inset-0 rounded-md bg-retro-primary/10 pointer-events-none" />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>

          <DropdownMenuContent 
            className="awwwards-card min-w-[200px]" 
            align="end"
            side="bottom"
          >
            <div className="px-3 py-2 border-b border-border/50">
              <p className="text-sm font-semibold text-foreground">
                Export Document
              </p>
              <p className="text-xs text-muted-foreground">
                Choose your preferred format
              </p>
            </div>

            <DropdownMenuItem
              onSelect={() => handleExport('markdown')}
              disabled={isExporting}
              className="flex items-center gap-3 py-3 font-medium cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Markdown (.md)</div>
                <div className="text-xs text-muted-foreground">
                  Plain text with formatting
                </div>
              </div>
              {isExporting && exportingFormat === 'markdown' && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-3 py-3 font-medium cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20">
                <FileDown className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">PDF (.pdf)</div>
                <div className="text-xs text-muted-foreground">
                  Professional document format
                </div>
              </div>
              {isExporting && exportingFormat === 'pdf' && (
                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
              )}
            </DropdownMenuItem>

            {!hasContent && (
              <>
                <DropdownMenuSeparator />
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Document appears to be empty. Add content to enable exports.
                  </p>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipContent side="bottom" className="awwwards-card">
          <p className="text-sm font-medium">
            {isDisabled && hasContent
              ? 'Export in progress...'
              : !hasContent
              ? 'Document is empty - add content to enable download'
              : 'Download document as Markdown or PDF'
            }
          </p>
          {hasContent && !isExporting && (
            <p className="text-xs text-muted-foreground mt-1">
              Click to choose between Markdown (.md) or PDF (.pdf) formats
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DocumentDownloadButton