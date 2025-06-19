'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
      className="group relative gap-3 font-medium transition-all duration-300 hover:scale-105"
    >
      {/* AI Icon - Sophisticated geometric design */}
      <div className="relative flex h-4 w-4 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-retro-primary to-retro-sunset opacity-80 transition-all duration-300 group-hover:opacity-100" />
        <div className="relative z-10 h-2 w-2 rounded-full bg-white/90 transition-all duration-300 group-hover:scale-110" />
      </div>
      
      <span className="text-sm font-medium">AI Assistant</span>
      
      {/* Enhanced suggestion count badge */}
      {suggestionCount > 0 && (
        <Badge 
          variant="secondary" 
          className="ml-1 h-5 min-w-[20px] bg-retro-primary/10 text-retro-primary border-retro-primary/20 text-xs font-semibold transition-all duration-300 hover:bg-retro-primary/20"
        >
          {suggestionCount}
        </Badge>
      )}
      
      {/* Subtle status indicator */}
      <div className={`absolute -right-1 -top-1 h-2 w-2 rounded-full transition-all duration-300 ${
        isOpen 
          ? 'bg-retro-primary shadow-[0_0_8px_hsl(var(--retro-primary))]' 
          : 'bg-muted-foreground/40'
      }`} />
    </Button>
  )
}
