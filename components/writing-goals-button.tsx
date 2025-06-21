'use client'

import { Button } from '@/components/ui/button'
import { Target } from 'lucide-react'
import type { WritingGoals } from '@/types/writing-goals'
import { cn } from '@/lib/utils'

interface WritingGoalsButtonProps {
  currentGoals: WritingGoals
  onClick: () => void
  className?: string
}

export function WritingGoalsButton({
  currentGoals,
  onClick,
  className,
}: WritingGoalsButtonProps) {
  const getGoalsSummary = (goals: WritingGoals) => {
    const parts = [
      goals.audience.charAt(0).toUpperCase() +
        goals.audience.slice(1).replace('-', ' '),
      goals.formality.charAt(0).toUpperCase() + goals.formality.slice(1),
      goals.intent.charAt(0).toUpperCase() +
        goals.intent.slice(1).replace('-', ' '),
    ]
    return parts.join(' • ')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("flex max-w-[200px] items-center gap-2", className)}
    >
      <Target className="h-4 w-4" />
      <div className="flex min-w-0 flex-col items-start">
        <span className="text-xs font-medium">Goals</span>
        <span className="w-full truncate text-xs text-muted-foreground">
          {getGoalsSummary(currentGoals)}
        </span>
      </div>
    </Button>
  )
}
