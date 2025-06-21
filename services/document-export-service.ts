'use client'

import TurndownService from 'turndown'
import html2pdf from 'html2pdf.js'

export type ExportFormat = 'markdown' | 'pdf'

export interface ExportOptions {
  documentId: string
  title: string
  content: string // HTML content from editor
  format: ExportFormat
  author?: string
  createdAt?: Date
}

export interface ExportResult {
  success: boolean
  message: string
  filename?: string
  error?: string
}

/**
 * Document Export Service
 * 
 * Handles exporting documents in various formats including:
 * - Markdown (.md files)
 * - PDF (.pdf files)
 * 
 * Features:
 * - HTML to Markdown conversion using Turndown
 * - PDF generation with professional styling
 * - Clean filename generation
 * - Comprehensive error handling and logging
 * - Browser download automation
 */
export class DocumentExportService {
  private static turndownService: TurndownService

  /**
   * Initialize the Turndown service for HTML to Markdown conversion
   * with clean, readable output and comprehensive rule handling
   */
  private static initializeTurndownService(): TurndownService {
    console.log('[DocumentExportService] Initializing Turndown service for HTML to Markdown conversion')
    
    if (!this.turndownService) {
      this.turndownService = new TurndownService({
        // Configure for clean, readable markdown output
        headingStyle: 'atx', // Use # headers instead of underlined
        hr: '---', // Use triple dash for horizontal rules
        bulletListMarker: '-', // Use dash for bullet lists
        codeBlockStyle: 'fenced', // Use ``` for code blocks
        fence: '```', // Use triple backticks
        emDelimiter: '*', // Use * for emphasis instead of _
        strongDelimiter: '**', // Use ** for strong emphasis
        linkStyle: 'inlined', // Use [text](url) instead of reference links
        linkReferenceStyle: 'full', // Full reference links when needed
      })

      // Add custom rules for better markdown output
      console.log('[DocumentExportService] Configuring custom Turndown rules for enhanced markdown output')
      
      // Handle line breaks more gracefully
      this.turndownService.addRule('lineBreaks', {
        filter: 'br',
        replacement: () => '\n'
      })

      // Handle div elements as paragraph separators
      this.turndownService.addRule('divs', {
        filter: 'div',
        replacement: (content: string) => content ? '\n\n' + content + '\n\n' : ''
      })

      // Handle span elements by preserving their content
      this.turndownService.addRule('spans', {
        filter: 'span',
        replacement: (content: string) => content
      })

      // Preserve formatting for code elements
      this.turndownService.addRule('inlineCode', {
        filter: (node: HTMLElement) => node.nodeName === 'CODE' && !node.parentNode?.nodeName?.match(/PRE/i),
        replacement: (content: string) => '`' + content + '`'
      })

      console.log('[DocumentExportService] Turndown service initialized with custom rules')
    }

    return this.turndownService
  }

  /**
   * Generate a clean, safe filename from document title
   * Removes special characters and ensures proper file extension
   */
  private static generateCleanFilename(title: string, format: ExportFormat): string {
    console.log('[DocumentExportService] Generating clean filename for:', title, 'format:', format)
    
    // Remove or replace problematic characters
    let cleanTitle = title
      .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .toLowerCase()

    // Fallback if title becomes empty
    if (!cleanTitle) {
      cleanTitle = 'untitled_document'
    }

    // Add timestamp for uniqueness
    const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD format
    const extension = format === 'pdf' ? 'pdf' : 'md'
    const filename = `${cleanTitle}_${timestamp}.${extension}`
    
    console.log('[DocumentExportService] Generated filename:', filename)
    return filename
  }

  /**
   * Convert HTML content to clean Markdown
   * Uses Turndown service with custom rules for optimal output
   */
  private static convertHtmlToMarkdown(htmlContent: string): string {
    console.log('[DocumentExportService] Converting HTML to Markdown, content length:', htmlContent.length)
    
    try {
      const turndown = this.initializeTurndownService()
      
             // Clean up the HTML content before conversion
       const cleanHtml = htmlContent
        // Remove empty paragraphs
        .replace(/<p><\/p>/g, '')
        .replace(/<p>\s*<\/p>/g, '')
        // Remove grammar error spans and decorations
        .replace(/<span[^>]*class="[^"]*grammar-error[^"]*"[^>]*>(.*?)<\/span>/g, '$1')
        .replace(/<span[^>]*data-error-json="[^"]*"[^>]*>(.*?)<\/span>/g, '$1')
        // Clean up excessive whitespace
        .replace(/\s+/g, ' ')
        .trim()

      console.log('[DocumentExportService] Cleaned HTML content, length:', cleanHtml.length)
      
      // Convert to markdown
      const markdown = turndown.turndown(cleanHtml)
      
      // Post-process the markdown for better formatting
      const cleanMarkdown = markdown
        // Remove excessive blank lines (more than 2 consecutive)
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Ensure proper spacing around headers
        .replace(/^(#{1,6}\s+.+)$/gm, '\n$1\n')
        // Clean up list formatting
        .replace(/^(\s*[-*+]\s+)/gm, '$1')
                 // Trim whitespace from each line
         .split('\n').map((line: string) => line.trimEnd()).join('\n')
        // Remove leading/trailing whitespace from the entire document
        .trim()

      console.log('[DocumentExportService] Successfully converted to Markdown, final length:', cleanMarkdown.length)
      return cleanMarkdown

    } catch (error) {
      console.error('[DocumentExportService] Error converting HTML to Markdown:', error)
      throw new Error('Failed to convert document content to Markdown format')
    }
  }

  /**
   * Generate PDF from HTML content using html2pdf library
   * with professional styling and formatting
   */
  private static async generatePdfFromHtml(htmlContent: string, title: string): Promise<Blob> {
    console.log('[DocumentExportService] Generating PDF from HTML, content length:', htmlContent.length)
    
    try {
      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = '210mm' // A4 width
      tempContainer.style.padding = '20mm'
      
      // Add professional styling for PDF output
      tempContainer.innerHTML = `
        <div style="
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #333;
          max-width: 170mm;
        ">
          <div style="
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          ">
            <h1 style="
              font-size: 18pt;
              margin: 0;
              color: #000;
              font-weight: bold;
            ">${title}</h1>
            <p style="
              margin: 10px 0 0 0;
              font-size: 10pt;
              color: #666;
            ">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="
            font-size: 12pt;
            line-height: 1.6;
          ">
            ${htmlContent}
          </div>
        </div>
      `
      
      document.body.appendChild(tempContainer)
      
      console.log('[DocumentExportService] Created temporary container for PDF generation')
      
      // Configure html2pdf options for professional output
      const pdfOptions = {
        margin: [20, 15, 20, 15], // top, right, bottom, left in mm
        filename: this.generateCleanFilename(title, 'pdf'),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, // Higher quality
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794, // A4 width in pixels at 96 DPI
          windowHeight: 1123 // A4 height in pixels at 96 DPI
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        }
      }
      
      console.log('[DocumentExportService] Generating PDF with html2pdf')
      
      // Generate PDF
      const pdfBlob = await html2pdf()
        .set(pdfOptions)
        .from(tempContainer)
        .outputPdf('blob')
      
      // Clean up temporary container
      document.body.removeChild(tempContainer)
      
      console.log('[DocumentExportService] PDF generated successfully, size:', pdfBlob.size, 'bytes')
      return pdfBlob

    } catch (error) {
      console.error('[DocumentExportService] Error generating PDF:', error)
      throw new Error('Failed to generate PDF document')
    }
  }

  /**
   * Trigger browser download for a file
   * Creates a temporary download link and triggers the download
   */
  private static triggerDownload(blob: Blob, filename: string): void {
    console.log('[DocumentExportService] Triggering download for file:', filename, 'size:', blob.size, 'bytes')
    
    try {
      // Create blob URL
      const url = window.URL.createObjectURL(blob)
      
      // Create temporary download link
      const downloadLink = document.createElement('a')
      downloadLink.href = url
      downloadLink.download = filename
      downloadLink.style.display = 'none'
      
      // Add to DOM, click, and remove
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      
      // Clean up blob URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        console.log('[DocumentExportService] Cleaned up blob URL for:', filename)
      }, 1000)
      
      console.log('[DocumentExportService] Download triggered successfully for:', filename)

    } catch (error) {
      console.error('[DocumentExportService] Error triggering download:', error)
      throw new Error('Failed to download the document')
    }
  }

  /**
   * Main export function - handles both markdown and PDF exports
   * 
   * @param options - Export configuration including content, format, etc.
   * @returns Promise with export result
   */
  static async exportDocument(options: ExportOptions): Promise<ExportResult> {
    console.log('[DocumentExportService] Starting document export:', {
      documentId: options.documentId,
      title: options.title,
      format: options.format,
      contentLength: options.content.length,
      author: options.author || 'Unknown'
    })

    try {
      const { documentId, title, content, format, author, createdAt } = options
      
      // Validate inputs
      if (!documentId || !title || !content) {
        const errorMsg = 'Invalid export options: documentId, title, and content are required'
        console.error('[DocumentExportService]', errorMsg)
        return {
          success: false,
          message: errorMsg,
          error: 'Missing required fields'
        }
      }

      // Generate clean filename
      const filename = this.generateCleanFilename(title, format)
      
      console.log('[DocumentExportService] Processing export for format:', format)

      if (format === 'markdown') {
        // Export as Markdown
        console.log('[DocumentExportService] Exporting as Markdown')
        
        const markdownContent = this.convertHtmlToMarkdown(content)
        
        // Add metadata header to markdown
        const timestamp = createdAt ? createdAt.toISOString() : new Date().toISOString()
        const metadataHeader = `---
title: "${title}"
author: "${author || 'Unknown'}"
created: "${timestamp}"
exported: "${new Date().toISOString()}"
---

`
        
        const finalMarkdown = metadataHeader + markdownContent
        
        // Create blob and trigger download
        const blob = new Blob([finalMarkdown], { type: 'text/markdown;charset=utf-8' })
        this.triggerDownload(blob, filename)
        
        console.log('[DocumentExportService] Markdown export completed successfully')
        return {
          success: true,
          message: 'Document exported as Markdown successfully',
          filename
        }

      } else if (format === 'pdf') {
        // Export as PDF
        console.log('[DocumentExportService] Exporting as PDF')
        
        const pdfBlob = await this.generatePdfFromHtml(content, title)
        this.triggerDownload(pdfBlob, filename)
        
        console.log('[DocumentExportService] PDF export completed successfully')
        return {
          success: true,
          message: 'Document exported as PDF successfully',
          filename
        }

      } else {
        const errorMsg = `Unsupported export format: ${format}`
        console.error('[DocumentExportService]', errorMsg)
        return {
          success: false,
          message: errorMsg,
          error: 'Invalid format'
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('[DocumentExportService] Export failed:', error)
      
      return {
        success: false,
        message: 'Failed to export document',
        error: errorMessage
      }
    }
  }

  /**
   * Export document as Markdown
   * Convenience method for markdown exports
   */
  static async exportAsMarkdown(
    documentId: string,
    title: string,
    content: string,
    author?: string
  ): Promise<ExportResult> {
    console.log('[DocumentExportService] Exporting as Markdown (convenience method)')
    
    return this.exportDocument({
      documentId,
      title,
      content,
      format: 'markdown',
      author,
      createdAt: new Date()
    })
  }

  /**
   * Export document as PDF
   * Convenience method for PDF exports
   */
  static async exportAsPdf(
    documentId: string,
    title: string,
    content: string,
    author?: string
  ): Promise<ExportResult> {
    console.log('[DocumentExportService] Exporting as PDF (convenience method)')
    
    return this.exportDocument({
      documentId,
      title,
      content,
      format: 'pdf',
      author,
      createdAt: new Date()
    })
  }
}