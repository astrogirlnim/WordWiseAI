'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { X, ArrowDown, Target, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UISpotlightProps {
  /** CSS selector for the element to highlight */
  targetSelector: string
  /** Whether the spotlight is active */
  isActive: boolean
  /** Title of the spotlight tooltip */
  title: string
  /** Description text for the spotlight */
  description: string
  /** Optional action button text */
  actionText?: string
  /** Callback when action button is clicked */
  onAction?: () => void
  /** Callback when spotlight is dismissed */
  onDismiss?: () => void
  /** Position preference for the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  /** Whether to show the close button */
  showCloseButton?: boolean
  /** Additional CSS classes */
  className?: string
  /** Whether to disable scrollIntoView */
  disableScroll?: boolean
}

/**
 * UI Spotlight Component
 * 
 * Creates a spotlight effect highlighting a specific UI element with an overlay
 * and informational tooltip. Used during demo tours to guide user attention.
 * 
 * Features:
 * - Dynamic element targeting via CSS selectors
 * - Responsive tooltip positioning
 * - Accessibility support with focus management
 * - Smooth animations and transitions
 * - Portal rendering for proper z-index handling
 */
export function UISpotlight({
  targetSelector,
  isActive,
  title,
  description,
  actionText,
  onAction,
  onDismiss,
  position = 'auto',
  showCloseButton = true,
  className,
  disableScroll = false,
}: UISpotlightProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; placement: string }>({
    x: 0,
    y: 0,
    placement: 'bottom'
  })

  console.log('🎯 [UISpotlight] Rendered:', {
    targetSelector,
    isActive,
    hasTargetElement: !!targetElement,
    title
  })

  // Find and track the target element
  useEffect(() => {
    if (!isActive) {
      setTargetElement(null)
      return
    }

    const findElement = () => {
      const element = document.querySelector(targetSelector) as HTMLElement
      if (element) {
        console.log('🎯 [UISpotlight] Target element found:', targetSelector, element)
        setTargetElement(element)
        
        if (!disableScroll) {
          console.log('🎯 [UISpotlight] Scrolling target into view')
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
        } else {
          console.log('🎯 [UISpotlight] Scroll disabled for target:', targetSelector)
        }
      } else {
        console.warn('🎯 [UISpotlight] Target element not found:', targetSelector)
      }
    }

    // Try to find element immediately
    findElement()

    // If not found, retry with slight delay (for dynamic content)
    if (!targetElement) {
      const timer = setTimeout(findElement, 100)
      return () => clearTimeout(timer)
    }
  }, [targetSelector, isActive, targetElement, disableScroll])

  // Calculate tooltip position
  useEffect(() => {
    if (!targetElement || !isActive) return

    const calculatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      console.log('🎯 [UISpotlight] Calculating tooltip position:', {
        targetRect: rect,
        viewport: { width: viewportWidth, height: viewportHeight }
      })

      let x = rect.left + rect.width / 2
      let y = rect.bottom + 10
      let placement = 'bottom'

      // Auto-positioning logic
      if (position === 'auto') {
        // Check if there's enough space below
        if (rect.bottom + 200 > viewportHeight) {
          // Not enough space below, try above
          if (rect.top - 200 > 0) {
            y = rect.top - 10
            placement = 'top'
          } else {
            // Not enough space above or below, try sides
            if (rect.right + 300 < viewportWidth) {
              x = rect.right + 10
              y = rect.top + rect.height / 2
              placement = 'right'
            } else if (rect.left - 300 > 0) {
              x = rect.left - 10
              y = rect.top + rect.height / 2
              placement = 'left'
            }
          }
        }
      } else {
        // Use specified position
        switch (position) {
          case 'top':
            y = rect.top - 10
            placement = 'top'
            break
          case 'left':
            x = rect.left - 10
            y = rect.top + rect.height / 2
            placement = 'left'
            break
          case 'right':
            x = rect.right + 10
            y = rect.top + rect.height / 2
            placement = 'right'
            break
          default: // bottom
            y = rect.bottom + 10
            placement = 'bottom'
        }
      }

      setTooltipPosition({ x, y, placement })
    }

    calculatePosition()

    // Recalculate on window resize
    window.addEventListener('resize', calculatePosition)
    window.addEventListener('scroll', calculatePosition)

    return () => {
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', calculatePosition)
    }
  }, [targetElement, isActive, position])

  // Handle keyboard events
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🎯 [UISpotlight] Escape key pressed, dismissing spotlight')
        onDismiss?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onDismiss])

  if (!isActive || !targetElement) {
    return null
  }

  const targetRect = targetElement.getBoundingClientRect()

  const SpotlightOverlay = () => (
    <div 
      className="fixed inset-0 z-50 transition-opacity duration-300"
      onClick={onDismiss}
    >
      {/* Top overlay */}
      <div 
        className="absolute bg-black/50"
        style={{ 
          backdropFilter: 'blur(2px)',
          left: 0,
          top: 0,
          right: 0,
          bottom: `${window.innerHeight - (targetRect.top - 8)}px`
        }}
      />
      
      {/* Bottom overlay */}
      <div 
        className="absolute bg-black/50"
        style={{ 
          backdropFilter: 'blur(2px)',
          left: 0,
          top: `${targetRect.bottom + 8}px`,
          right: 0,
          bottom: 0
        }}
      />
      
      {/* Left overlay */}
      <div 
        className="absolute bg-black/50"
        style={{ 
          backdropFilter: 'blur(2px)',
          left: 0,
          top: `${targetRect.top - 8}px`,
          width: `${targetRect.left - 8}px`,
          height: `${targetRect.height + 16}px`
        }}
      />
      
      {/* Right overlay */}
      <div 
        className="absolute bg-black/50"
        style={{ 
          backdropFilter: 'blur(2px)',
          left: `${targetRect.right + 8}px`,
          top: `${targetRect.top - 8}px`,
          right: 0,
          height: `${targetRect.height + 16}px`
        }}
      />
      
      {/* Spotlight border and glow effect */}
      <div 
        className="absolute rounded-lg transition-all duration-300 pointer-events-none"
        style={{
          left: targetRect.left - 8,
          top: targetRect.top - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          border: '4px solid rgb(var(--primary))',
          boxShadow: `
            0 0 20px 4px rgb(var(--primary) / 0.8),
            inset 0 0 0 2px rgb(var(--primary) / 0.3)
          `,
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />

      {/* Got It button in top right of highlight */}
      {actionText && onAction && (
        <button
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          className="absolute z-50 bg-primary text-white font-semibold rounded-md shadow-lg px-4 py-2 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary top-0 right-0"
          style={{
            left: targetRect.left + targetRect.width - 8 - 120, // 120px from right edge of highlight
            top: targetRect.top - 8 + 12, // 12px from top edge of highlight
            minWidth: 100,
            maxWidth: 180
          }}
        >
          {actionText}
        </button>
      )}

      {/* Tooltip */}
      <Card 
        className={cn(
          "absolute w-80 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
          tooltipPosition.placement === 'top' && "slide-in-from-top-2",
          tooltipPosition.placement === 'left' && "slide-in-from-left-2",
          tooltipPosition.placement === 'right' && "slide-in-from-right-2",
          className
        )}
        style={{
          left: tooltipPosition.placement === 'left' 
            ? tooltipPosition.x - 320 
            : tooltipPosition.placement === 'right'
            ? tooltipPosition.x
            : tooltipPosition.x - 160,
          top: tooltipPosition.placement === 'top'
            ? tooltipPosition.y - 200
            : tooltipPosition.placement === 'bottom'
            ? tooltipPosition.y
            : tooltipPosition.y - 100,
          zIndex: 60
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {showCloseButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={onDismiss}
                aria-label="Close spotlight"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Pointer arrow */}
      <div
        className="absolute w-0 h-0 z-50"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          ...(tooltipPosition.placement === 'bottom' && {
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '10px solid hsl(var(--card))',
            transform: 'translateX(-50%) translateY(-10px)'
          }),
          ...(tooltipPosition.placement === 'top' && {
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid hsl(var(--card))',
            transform: 'translateX(-50%) translateY(10px)'
          }),
          ...(tooltipPosition.placement === 'left' && {
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderLeft: '10px solid hsl(var(--card))',
            transform: 'translateY(-50%) translateX(10px)'
          }),
          ...(tooltipPosition.placement === 'right' && {
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderRight: '10px solid hsl(var(--card))',
            transform: 'translateY(-50%) translateX(-10px)'
          })
        }}
      />
    </div>
  )

  // Render through portal for proper z-index handling
  return createPortal(<SpotlightOverlay />, document.body)
}

/**
 * Hook for managing multiple UI spotlights in a sequence
 */
export function useUISpotlight() {
  const [currentSpotlight, setCurrentSpotlight] = useState<{
    targetSelector: string
    title: string
    description: string
    actionText?: string
    onAction?: () => void
  } | null>(null)

  const showSpotlight = (config: {
    targetSelector: string
    title: string
    description: string
    actionText?: string
    onAction?: () => void
  }) => {
    console.log('🎯 [useUISpotlight] Showing spotlight:', config.targetSelector)
    setCurrentSpotlight(config)
  }

  const hideSpotlight = () => {
    console.log('🎯 [useUISpotlight] Hiding spotlight')
    setCurrentSpotlight(null)
  }

  return {
    currentSpotlight,
    showSpotlight,
    hideSpotlight,
    isActive: !!currentSpotlight
  }
} 