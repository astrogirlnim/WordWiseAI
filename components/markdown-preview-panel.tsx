'use client'

import React, { memo, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

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
                  // Headers with proper styling
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-semibold leading-tight mt-6 mb-4 pb-2 border-b border-border text-foreground first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold leading-tight mt-6 mb-4 pb-2 border-b border-border/50 text-foreground first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold leading-tight mt-6 mb-4 text-foreground first:mt-0">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-base font-semibold leading-tight mt-6 mb-4 text-foreground first:mt-0">
                      {children}
                    </h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className="text-sm font-semibold leading-tight mt-6 mb-4 text-foreground first:mt-0">
                      {children}
                    </h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className="text-xs font-semibold leading-tight mt-6 mb-4 text-muted-foreground first:mt-0">
                      {children}
                    </h6>
                  ),
                  
                  // Code blocks with syntax highlighting
                  code: ({ inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''
                    
                    console.log('💻 [CodeBlock] Rendering code:', { inline, language, className })
                    
                    if (!inline && language) {
                      return (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={language}
                          PreTag="div"
                          customStyle={{
                            margin: '16px 0',
                            borderRadius: '6px',
                            border: '1px solid hsl(var(--border) / 0.5)',
                            fontSize: '14px',
                            lineHeight: '1.45',
                          } as React.CSSProperties}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      )
                    }
                    
                    return (
                      <code
                        className="bg-muted text-retro-primary rounded px-1.5 py-0.5 text-sm font-mono font-medium"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  
                  // Lists with proper styling
                  ul: ({ children, ...props }) => (
                    <ul className="list-disc pl-8 my-4 space-y-1" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="list-decimal pl-8 my-4 space-y-1" {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ children, className, ...props }) => {
                    // Handle task list items
                    if (className?.includes('task-list-item')) {
                      return (
                        <li className="list-none -ml-6 flex items-start gap-2" {...props}>
                          {children}
                        </li>
                      )
                    }
                    
                    return (
                      <li className="text-foreground leading-relaxed" {...props}>
                        {children}
                      </li>
                    )
                  },
                  
                  // Checkboxes for task lists
                  input: ({ type, checked, ...props }) => {
                    if (type === 'checkbox') {
                      return (
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled
                          className="accent-retro-primary scale-110 mr-2"
                          {...props}
                        />
                      )
                    }
                    return <input type={type} {...props} />
                  },
                  
                  // Tables with proper alignment
                  table: ({ children, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full border-collapse border border-border/50 rounded-md text-sm" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, align, ...props }: any) => (
                    <th
                      className="bg-muted/50 border border-border/50 px-3 py-2 font-semibold text-foreground"
                      style={{ textAlign: (align === 'char' ? 'left' : align) as 'left' | 'center' | 'right' | 'justify' }}
                      {...props}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children, align, ...props }: any) => (
                    <td
                      className="border border-border/50 px-3 py-2 text-foreground"
                      style={{ textAlign: (align === 'char' ? 'left' : align) as 'left' | 'center' | 'right' | 'justify' }}
                      {...props}
                    >
                      {children}
                    </td>
                  ),
                  
                  // Blockquotes with gradient background
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="bg-gradient-to-r from-retro-primary/5 to-retro-sunset/5 border-l-4 border-retro-primary/30 pl-4 py-3 my-4 rounded-r-md"
                      {...props}
                    >
                      <div className="text-muted-foreground italic">
                        {children}
                      </div>
                    </blockquote>
                  ),
                  
                  // Horizontal rules
                  hr: (props) => (
                    <hr className="border-none h-px bg-border my-6" {...props} />
                  ),
                  
                  // Links with hover effects
                  a: ({ children, href, title, ...props }) => (
                    <a
                      href={href}
                      title={title}
                      className="text-retro-primary underline decoration-retro-primary/40 hover:decoration-retro-primary hover:text-retro-primary/80 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  
                  // Images with proper styling
                  img: ({ src, alt, title, ...props }) => (
                    <img
                      src={src}
                      alt={alt}
                      title={title}
                      className="max-w-full h-auto rounded-md border border-border/50 my-4"
                      {...props}
                    />
                  ),
                  
                  // Paragraphs with proper spacing
                  p: ({ children, ...props }) => (
                    <p className="text-foreground leading-relaxed mb-4 last:mb-0" {...props}>
                      {children}
                    </p>
                  ),
                  
                  // Text formatting
                  strong: ({ children, ...props }) => (
                    <strong className="font-semibold text-foreground" {...props}>
                      {children}
                    </strong>
                  ),
                  em: ({ children, ...props }) => (
                    <em className="italic text-foreground" {...props}>
                      {children}
                    </em>
                  ),
                  del: ({ children, ...props }) => (
                    <del className="line-through text-muted-foreground" {...props}>
                      {children}
                    </del>
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