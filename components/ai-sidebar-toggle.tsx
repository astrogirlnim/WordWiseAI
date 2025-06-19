'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface AISidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
  suggestionCount?: number
}

export function AISidebarToggle({ 
  isOpen, 
  onToggle, 
  suggestionCount = 0 
}: AISidebarToggleProps) {
  return (
    <Button
      variant={isOpen ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className="group relative gap-2 border-retro-accent/30 bg-background/50 text-foreground transition-all duration-300 hover:border-retro-accent hover:bg-retro-accent/10 hover:text-retro-accent hover:shadow-retro-glow-sm focus-visible:ring-2 focus-visible:ring-retro-accent"
      aria-label={`${isOpen ? 'Close' : 'Open'} AI assistant sidebar`}
    >
      <Sparkles className="h-4 w-4 transition-all duration-300 group-hover:text-glow-soft" />
      <span className="hidden sm:inline font-terminal text-xs uppercase tracking-wider">
        AI Assistant
      </span>
      {suggestionCount > 0 && (
        <Badge 
          variant="destructive" 
          className="ml-1 h-5 w-5 rounded-full p-0 text-xs bg-retro-accent text-retro-accent-foreground border border-retro-accent hover:bg-retro-accent/90"
        >
          {suggestionCount}
        </Badge>
      )}
      
      {/* Retro tech corner accents */}
      {isOpen && (
        <>
          <div className="absolute -bottom-1 -right-1 h-2 w-2 border-b border-r border-retro-accent/50 transition-all duration-300 group-hover:border-retro-accent"></div>
          <div className="absolute -left-1 -top-1 h-2 w-2 border-l border-t border-retro-accent/50 transition-all duration-300 group-hover:border-retro-accent"></div>
        </>
      )}
    </Button>
  )
}
