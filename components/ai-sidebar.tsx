"use client"

import { Button } from "@/components/ui/button"

interface AISidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function AISidebar({ isOpen, onToggle }: AISidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-14 bottom-0 w-80 bg-background border-l z-40 flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">AI Assistant</h2>
        <p className="text-muted-foreground">Coming Soon</p>
        <Button disabled variant="outline">Coming Soon</Button>
      </div>
    </div>
  )
}
