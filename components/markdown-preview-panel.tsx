'use client'

import React, { memo, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye } from 'lucide-react'

interface MarkdownPreviewPanelProps {
  content: string
  isVisible: boolean
  className?: string
}

/**
 * Markdown preview panel component that renders markdown content
 * with GitHub-flavored markdown support and custom styling
 */
export const MarkdownPreviewPanel = memo(function MarkdownPreviewPanel({
  content,
  isVisible,
  className = '',
}: MarkdownPreviewPanelProps): JSX.Element | null {
  console.log('[MarkdownPreviewPanel] Rendering with content length:', content.length, 'Visible:', isVisible)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Scroll to top when content changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
    }
  }, [content])

  if (!isVisible) {
    console.log('[MarkdownPreviewPanel] Panel not visible, returning null')
    return null
  }

  return (
    <div className={`
      flex flex-col h-full bg-card border-l border-border/50 
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-retro-primary/10 to-retro-sunset/10 border border-retro-primary/20">
            <Eye className="h-4 w-4 text-retro-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Markdown Preview
            </h3>
            <p className="text-xs text-muted-foreground">
              Live preview of your markdown content
            </p>
          </div>
        </div>
        
        <Badge variant="secondary" className="text-xs">
          <FileText className="h-3 w-3 mr-1" />
          Preview
        </Badge>
      </div>

      <Separator />

      {/* Preview Content */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="awwwards-preview-content">
          {content.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom components for enhanced styling
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-foreground mb-6 mt-8 pb-3 border-b-2 border-border/50 leading-tight tracking-tight first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8 pb-2 border-b border-border/30 leading-tight tracking-tight first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-medium text-foreground mb-3 mt-6 leading-tight tracking-tight first:mt-0">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-medium text-foreground mb-2 mt-5 leading-tight tracking-tight first:mt-0">
                      {children}
                    </h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className="text-base font-medium text-foreground mb-2 mt-4 leading-tight tracking-tight first:mt-0">
                      {children}
                    </h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className="text-sm font-medium text-muted-foreground mb-2 mt-3 leading-tight tracking-tight first:mt-0 uppercase">
                      {children}
                    </h6>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-foreground mb-4 leading-relaxed last:mb-0">
                      {children}
                    </p>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-retro-primary/30 pl-6 py-3 my-6 bg-retro-primary/5 rounded-r-md backdrop-blur-sm">
                      <div className="text-sm text-muted-foreground italic leading-relaxed">
                        {children}
                      </div>
                    </blockquote>
                  ),
                  code: ({ children, className, ...props }) => {
                    // Detect if it's a code block by checking for language class
                    const isCodeBlock = className && className.startsWith('language-')
                    
                    if (!isCodeBlock) {
                      // Inline code
                      return (
                        <code className="px-2 py-1 bg-muted rounded-md text-xs font-mono text-retro-primary font-medium">
                          {children}
                        </code>
                      )
                    }
                    
                    // Code block
                    return (
                      <div className="my-6 first:mt-0 last:mb-0">
                        <pre className="p-4 bg-muted rounded-lg overflow-x-auto border border-border/50 font-mono text-sm leading-relaxed">
                          <code className={`${className || ''}`}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    )
                  },
                  ul: ({ children }) => (
                    <ul className="ml-6 mb-4 space-y-2 list-disc marker:text-retro-primary">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="ml-6 mb-4 space-y-2 list-decimal marker:text-retro-primary marker:font-medium">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-foreground leading-relaxed pl-1">
                      {children}
                    </li>
                  ),
                  a: ({ href, children }) => (
                    <a 
                      href={href}
                      className="text-retro-primary hover:text-retro-primary/80 underline decoration-retro-primary/30 hover:decoration-retro-primary/60 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => (
                    <div className="my-4">
                      <img 
                        src={src} 
                        alt={alt}
                        className="max-w-full h-auto rounded-lg border border-border/50 shadow-sm"
                      />
                      {alt && (
                        <p className="text-xs text-muted-foreground text-center mt-2 italic">
                          {alt}
                        </p>
                      )}
                    </div>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 overflow-x-auto first:mt-0 last:mb-0">
                      <table className="w-full border-collapse border border-border/50 rounded-lg shadow-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/50 border-b border-border/50">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody>
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="border-b border-border/50 hover:bg-muted/25 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="p-3 text-left text-xs font-semibold text-foreground border-r border-border/50 last:border-r-0">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="p-3 text-xs text-foreground border-r border-border/50 last:border-r-0 leading-relaxed">
                      {children}
                    </td>
                  ),
                  hr: () => (
                    <hr className="my-8 border-none h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-foreground">
                      {children}
                    </em>
                  ),
                  del: ({ children }) => (
                    <del className="line-through text-muted-foreground">
                      {children}
                    </del>
                  ),
                  // Task list support
                  input: ({ checked, ...props }) => (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled
                      className="mr-2 accent-retro-primary"
                      {...props}
                    />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Start typing to see your markdown preview
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Supports headers, lists, code blocks, tables, and more
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
})

MarkdownPreviewPanel.displayName = 'MarkdownPreviewPanel'