'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, EyeOff, FileText } from 'lucide-react'

interface MarkdownPreviewToggleProps {
  isPreviewOpen: boolean
  isMarkdownDetected: boolean
  onToggle: () => void
  className?: string
}

/**
 * Toggle button for markdown preview functionality
 * Shows different states based on markdown detection and preview visibility
 */
export function MarkdownPreviewToggle({ 
  isPreviewOpen, 
  isMarkdownDetected, 
  onToggle,
  className 
}: MarkdownPreviewToggleProps): JSX.Element {
  console.log('[MarkdownPreviewToggle] Rendering with state:', {
    isPreviewOpen,
    isMarkdownDetected
  })

  // Determine button appearance based on state
  const getButtonVariant = (): "default" | "secondary" | "ghost" => {
    if (isPreviewOpen) return 'default'
    if (isMarkdownDetected) return 'secondary'
    return 'ghost'
  }

  const getButtonText = (): string => {
    if (isPreviewOpen) return 'Hide Preview'
    if (isMarkdownDetected) return 'Show Preview'
    return 'Markdown Preview'
  }

  const getIcon = (): JSX.Element => {
    if (isPreviewOpen) return <EyeOff className="h-4 w-4" />
    if (isMarkdownDetected) return <Eye className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getTooltipContent = (): string => {
    if (isPreviewOpen) return 'Hide markdown preview panel'
    if (isMarkdownDetected) return 'Show markdown preview panel - Markdown detected!'
    return 'Toggle markdown preview (no markdown detected)'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={getButtonVariant()}
            size="sm"
            onClick={onToggle}
            className={`
              relative transition-all duration-200 
              ${isMarkdownDetected ? 'shadow-sm ring-1 ring-retro-primary/20' : ''}
              ${className}
            `}
          >
            {/* Icon with optional indicator */}
            <div className="relative">
              {getIcon()}
              {/* Show indicator dot when markdown is detected */}
              {isMarkdownDetected && !isPreviewOpen && (
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-retro-primary animate-pulse" />
              )}
            </div>
            
            {/* Button text */}
            <span className="ml-2 hidden sm:inline">
              {getButtonText()}
            </span>
            
            {/* Visual feedback for active state */}
            {isPreviewOpen && (
              <div className="absolute inset-0 rounded-md bg-retro-primary/10 pointer-events-none" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="awwwards-card">
          <p className="text-sm font-medium">
            {getTooltipContent()}
          </p>
          {isMarkdownDetected && (
            <p className="text-xs text-muted-foreground mt-1">
              Press to {isPreviewOpen ? 'hide' : 'show'} side-by-side preview
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}