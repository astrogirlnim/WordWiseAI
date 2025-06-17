'use client'

import { Button } from '@/components/ui/button'
import { Brain } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AISidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
  suggestionCount?: number
}

export function AISidebarToggle({
  isOpen,
  onToggle,
  suggestionCount = 0,
}: AISidebarToggleProps) {
  return (
    <Button
      variant={isOpen ? 'default' : 'ghost'}
      size="sm"
      onClick={onToggle}
      className="relative flex items-center gap-2"
    >
      <Brain className="h-4 w-4" />
      <span className="hidden sm:inline">AI Assistant</span>
      {suggestionCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 h-5 w-5 p-0 text-xs"
        >
          {suggestionCount > 9 ? '9+' : suggestionCount}
        </Badge>
      )}
    </Button>
  )
}
