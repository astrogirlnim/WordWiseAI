'use client'

import { Button } from '@/components/ui/button'

export function SuggestionHistoryPanel() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4 text-center">
      <h2 className="text-lg font-semibold">Suggestion History</h2>
      <p className="text-muted-foreground">Coming Soon</p>
      <Button disabled variant="outline">
        Coming Soon
      </Button>
    </div>
  )
}
