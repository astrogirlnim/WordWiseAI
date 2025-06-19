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
}: MarkdownPreviewPanelProps): React.ReactElement | null {
  console.log('[MarkdownPreviewPanel] Rendering with content length:', content.length, 'Visible:', isVisible)
  console.log('[MarkdownPreviewPanel] Content preview (first 200 chars):', JSON.stringify(content.substring(0, 200)))
  
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
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Minimal custom components - let CSS handle spacing
                  h1: ({ children }) => (
                    <h1>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3>{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4>{children}</h4>
                  ),
                  h5: ({ children }) => (
                    <h5>{children}</h5>
                  ),
                  h6: ({ children }) => (
                    <h6>{children}</h6>
                  ),
                  p: ({ children }) => (
                    <p>{children}</p>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote>{children}</blockquote>
                  ),
                  code: ({ children, className, ...props }) => {
                    // Detect if it's a code block by checking for language class
                    const isCodeBlock = className && className.startsWith('language-')
                    
                    if (!isCodeBlock) {
                      // Inline code
                      return <code>{children}</code>
                    }
                    
                    // Code block
                    return (
                      <pre>
                        <code className={className}>
                          {children}
                        </code>
                      </pre>
                    )
                  },
                  ul: ({ children }) => (
                    <ul>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li>{children}</li>
                  ),
                  a: ({ href, children }) => (
                    <a 
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt} />
                  ),
                  table: ({ children }) => (
                    <table>{children}</table>
                  ),
                  thead: ({ children }) => (
                    <thead>{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody>{children}</tbody>
                  ),
                  tr: ({ children }) => (
                    <tr>{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th>{children}</th>
                  ),
                  td: ({ children }) => (
                    <td>{children}</td>
                  ),
                  hr: () => (
                    <hr />
                  ),
                  strong: ({ children }) => (
                    <strong>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em>{children}</em>
                  ),
                  del: ({ children }) => (
                    <del>{children}</del>
                  ),
                  // Task list support
                  input: ({ checked, ...props }) => (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled
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