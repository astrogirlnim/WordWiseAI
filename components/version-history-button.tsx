'use client'

import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface VersionHistoryButtonProps {
  onClick: () => void
}

export function VersionHistoryButton({ onClick }: VersionHistoryButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onClick}>
            <History className="h-4 w-4" />
            <span className="sr-only">Toggle Version History</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Version History</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 