'use client'

import { Button } from '@/components/ui/button'

interface AISidebarProps {
  isOpen: boolean
}

export function AISidebar({ isOpen }: AISidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 right-0 top-14 z-40 flex w-80 flex-col items-center justify-center border-l bg-background">
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">AI Assistant</h2>
        <p className="text-muted-foreground">Coming Soon</p>
        <Button disabled variant="outline">
          Coming Soon
        </Button>
      </div>
    </div>
  )
}
