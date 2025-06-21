import TurndownService from 'turndown'
import { saveAs } from 'file-saver'
import { Timestamp } from 'firebase/firestore'
import type { Document, ExportFormat, ExportOptions, ExportResult, FirestoreTimestamp } from '@/types/document'

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

/**
 * Document Export Service
 * Handles exporting documents to various formats (PDF, Markdown)
 * with proper error handling and user feedback
 */
export class DocumentExportService {
  private static turndownService: TurndownService | null = null

  /**
   * Initialize the Turndown service for HTML to Markdown conversion
   */
  private static getTurndownService(): TurndownService {
    if (!this.turndownService) {
      this.turndownService = new TurndownService({
        headingStyle: 'atx', // Use # for headings
        codeBlockStyle: 'fenced', // Use ``` for code blocks
        emDelimiter: '*', // Use * for emphasis
        strongDelimiter: '**', // Use ** for strong
      })
      
      console.log('[DocumentExportService] Initialized Turndown service for markdown conversion')
    }
    return this.turndownService
  }

  /**
   * Generate a safe filename from document title
   */
  private static generateFilename(title: string, format: ExportFormat): string {
    console.log('[DocumentExportService] Generating filename for:', { title, format })
    
    // Clean the title to make it safe for filenames
    const cleanTitle = title
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase()
      .trim()
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
    const extension = format === 'pdf' ? 'pdf' : 'md'
    const filename = `${cleanTitle || 'document'}_${timestamp}.${extension}`
    
    console.log('[DocumentExportService] Generated filename:', filename)
    return filename
  }

  /**
   * Export document to PDF format
   */
  private static async exportToPDF(
    document: Document,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('[DocumentExportService] Starting PDF export for document:', document.id)
    
    try {
      // Dynamically import html2pdf to avoid SSR issues
      // @ts-ignore - html2pdf.js doesn't have TypeScript definitions
      const html2pdf = (await import('html2pdf.js')).default
      
      const filename = options.filename || this.generateFilename(document.title, 'pdf')
      
      // Prepare content with metadata if requested
      let htmlContent = document.content || '<p>No content available</p>'
      
      if (options.includeMetadata) {
        const createdDate = timestampToDate(document.createdAt)
        const updatedDate = timestampToDate(document.updatedAt)
        
        const metadata = `
          <div style="margin-bottom: 30px; padding: 20px; border-bottom: 2px solid #eee;">
            <h1 style="margin: 0 0 10px 0; color: #333;">${document.title}</h1>
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Created:</strong> ${createdDate.toLocaleDateString()}<br>
              <strong>Last Modified:</strong> ${updatedDate.toLocaleDateString()}<br>
              <strong>Word Count:</strong> ${document.wordCount || 0} words<br>
              <strong>Status:</strong> ${document.status}
            </p>
          </div>
        `
        htmlContent = metadata + htmlContent
      }
      
      // Configure PDF options for better quality
      const pdfOptions = {
        margin: 1,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' 
        }
      }
      
      console.log('[DocumentExportService] Generating PDF with options:', pdfOptions)
      
      // Generate and download PDF
      // @ts-ignore - html2pdf doesn't have TypeScript definitions
      await html2pdf().set(pdfOptions).from(htmlContent).save()
      
      console.log('[DocumentExportService] ✓ PDF export completed successfully:', filename)
      
      return {
        success: true,
        filename
      }
      
    } catch (error) {
      console.error('[DocumentExportService] ✗ PDF export failed:', error)
      
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Failed to generate PDF'
      }
    }
  }

  /**
   * Export document to Markdown format
   */
  private static async exportToMarkdown(
    document: Document,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('[DocumentExportService] Starting Markdown export for document:', document.id)
    
    try {
      const filename = options.filename || this.generateFilename(document.title, 'markdown')
      const turndown = this.getTurndownService()
      
      // Convert HTML content to Markdown
      let markdownContent = turndown.turndown(document.content || '')
      
      // Add metadata header if requested
      if (options.includeMetadata) {
        const createdDate = timestampToDate(document.createdAt)
        const updatedDate = timestampToDate(document.updatedAt)
        
        const metadataHeader = `---
title: "${document.title}"
created: ${createdDate.toISOString()}
modified: ${updatedDate.toISOString()}
word_count: ${document.wordCount || 0}
status: ${document.status}
---

`
        markdownContent = metadataHeader + markdownContent
      }
      
      // Clean up any HTML artifacts that might remain
      markdownContent = markdownContent
        .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
        .replace(/\n\n\n+/g, '\n\n') // Reduce multiple newlines to double
        .trim()
      
      console.log('[DocumentExportService] Converted to markdown, length:', markdownContent.length)
      
      // Create and download the file
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
      saveAs(blob, filename)
      
      console.log('[DocumentExportService] ✓ Markdown export completed successfully:', filename)
      
      return {
        success: true,
        filename
      }
      
    } catch (error) {
      console.error('[DocumentExportService] ✗ Markdown export failed:', error)
      
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Failed to generate Markdown'
      }
    }
  }

  /**
   * Export a document in the specified format
   * Main entry point for document exports
   */
  public static async exportDocument(
    document: Document,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('[DocumentExportService] Export request:', {
      documentId: document.id,
      title: document.title,
      format: options.format,
      includeMetadata: options.includeMetadata
    })
    
    // Validate document content
    if (!document.content || document.content.trim() === '') {
      console.warn('[DocumentExportService] Document has no content to export')
      return {
        success: false,
        filename: '',
        error: 'Document has no content to export'
      }
    }
    
    try {
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(document, options)
        case 'markdown':
          return await this.exportToMarkdown(document, options)
        default:
          console.error('[DocumentExportService] Unsupported export format:', options.format)
          return {
            success: false,
            filename: '',
            error: `Unsupported export format: ${options.format}`
          }
      }
    } catch (error) {
      console.error('[DocumentExportService] Export failed with unexpected error:', error)
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unexpected export error'
      }
    }
  }

  /**
   * Check if export is supported in the current environment
   */
  public static isExportSupported(): boolean {
    if (typeof window === 'undefined') {
      console.log('[DocumentExportService] Export not supported in server environment')
      return false
    }
    
    // Check for required APIs
    const hasBlob = !!window.Blob
    const hasCreateObjectURL = !!(window.URL && window.URL.createObjectURL)
    
    const isSupported = hasBlob && hasCreateObjectURL
    console.log('[DocumentExportService] Export support check:', {
      hasBlob,
      hasCreateObjectURL,
      isSupported
    })
    
    return isSupported
  }
}