'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, X, Megaphone } from 'lucide-react'
import type { FunnelSuggestion } from '@/types/ai-features'

interface AISuggestionsProps {
  funnelSuggestions: FunnelSuggestion[]
  onApply: (suggestionId: string) => void
  onDismiss: (suggestionId: string) => void
  loading?: boolean
}

export function AISuggestions({ 
  funnelSuggestions, 
  onApply, 
  onDismiss, 
  loading = false 
}: AISuggestionsProps) {
  // Only show funnel suggestions, always scrollable
  const pendingFunnelSuggestions = funnelSuggestions.filter(s => s.status === 'pending')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading suggestions...</p>
        </div>
      </div>
    )
  }

  if (pendingFunnelSuggestions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Megaphone className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No funnel suggestions available</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click &quot;Generate Funnel Copy&quot; to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Funnel Copy Suggestions</h3>
            <Badge variant="secondary" className="text-xs">
              {pendingFunnelSuggestions.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {pendingFunnelSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" />
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {suggestion.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {suggestion.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.confidence}% confident
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="rounded-md bg-white/50 p-3 text-sm dark:bg-gray-900/50">
                      <p className="font-medium text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                        SUGGESTED {suggestion.type.toUpperCase()}
                      </p>
                      <div className="whitespace-pre-line">{suggestion.suggestedText}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onApply(suggestion.id)} className="flex-1">
                        <Check className="mr-1 h-3 w-3" />
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onDismiss(suggestion.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
