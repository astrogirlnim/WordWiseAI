'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Play, Sparkles } from 'lucide-react'
import { useDemoTourContext } from '@/lib/demo-tour-context'

interface DemoTriggerButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showTooltip?: boolean
  className?: string
}

/**
 * Demo Trigger Button Component
 * 
 * Allows existing users to manually start the demo tour.
 * This button bypasses the auto-trigger logic and is perfect for:
 * - Users who skipped the demo initially
 * - Users who want to see the demo again
 * - Users who want to show the demo to colleagues
 * 
 * Features:
 * - Resets demo progress to start from step 1
 * - Professional styling with WordWise AI branding
 * - Optional tooltip explaining the functionality
 * - Responsive design with multiple size variants
 */
export function DemoTriggerButton({ 
  variant = 'outline',
  size = 'sm',
  showTooltip = true,
  className = ''
}: DemoTriggerButtonProps) {
  const demoTour = useDemoTourContext()

  const handleStartDemo = () => {
    console.log('🎯 [DemoTriggerButton] Manual demo start triggered')
    demoTour.startDemo()
  }

  const buttonContent = (
    <Button 
      variant={variant}
      size={size}
      onClick={handleStartDemo}
      className={`flex items-center gap-2 ${className}`}
      aria-label="Start WordWise AI Demo Tour"
    >
      <Play className="h-4 w-4" />
      <span>Try Demo</span>
      <Sparkles className="h-3 w-3 opacity-70" />
    </Button>
  )

  if (!showTooltip) {
    return buttonContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">
            Take a guided tour of WordWise AI features including document creation, 
            AI suggestions, version control, and collaboration tools.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 