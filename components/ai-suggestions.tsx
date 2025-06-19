'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Check, X, Lightbulb, Target, MessageSquare, Megaphone, List } from 'lucide-react'
import type { AISuggestion, FunnelSuggestion } from '@/types/ai-features'

interface AISuggestionsProps {
  styleSuggestions: AISuggestion[]
  funnelSuggestions: FunnelSuggestion[]
  onApply: (suggestionId: string, type: 'style' | 'funnel') => void
  onDismiss: (suggestionId: string, type: 'style' | 'funnel') => void
  loading?: boolean
}

const suggestionIcons = {
  grammar: <Lightbulb className="h-4 w-4" />,
  style: <Target className="h-4 w-4" />,
  clarity: <MessageSquare className="h-4 w-4" />,
  engagement: <Target className="h-4 w-4" />,
  readability: <Lightbulb className="h-4 w-4" />,
  headline: <Megaphone className="h-4 w-4" />,
  subheadline: <MessageSquare className="h-4 w-4" />,
  cta: <Target className="h-4 w-4" />,
  outline: <List className="h-4 w-4" />
}

const suggestionColors = {
  grammar: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
  style: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
  clarity: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
  engagement: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800',
  readability: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800',
  headline: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800',
  subheadline: 'bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800',
  cta: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
  outline: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
}

export function AISuggestions({ 
  styleSuggestions, 
  funnelSuggestions, 
  onApply, 
  onDismiss, 
  loading = false 
}: AISuggestionsProps) {
  console.log('[AISuggestions] Rendering suggestions:', {
    styleCount: styleSuggestions.length,
    funnelCount: funnelSuggestions.length,
    loading
  })

  const totalSuggestions = styleSuggestions.length + funnelSuggestions.length

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

  if (totalSuggestions === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Lightbulb className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No suggestions available</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Write some content to get AI suggestions
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        {/* Funnel Suggestions Section */}
        {funnelSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Funnel Copy Suggestions</h3>
              <Badge variant="secondary" className="text-xs">
                {funnelSuggestions.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {funnelSuggestions.map((suggestion) => (
                <FunnelSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => onApply(suggestion.id, 'funnel')}
                  onDismiss={() => onDismiss(suggestion.id, 'funnel')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Separator if both types exist */}
        {funnelSuggestions.length > 0 && styleSuggestions.length > 0 && (
          <Separator />
        )}

        {/* Style Suggestions Section */}
        {styleSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Style Suggestions</h3>
              <Badge variant="secondary" className="text-xs">
                {styleSuggestions.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {styleSuggestions.map((suggestion) => (
                <StyleSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => onApply(suggestion.id, 'style')}
                  onDismiss={() => onDismiss(suggestion.id, 'style')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

interface FunnelSuggestionCardProps {
  suggestion: FunnelSuggestion
  onApply: () => void
  onDismiss: () => void
}

function FunnelSuggestionCard({ suggestion, onApply, onDismiss }: FunnelSuggestionCardProps) {
  const colorClass = suggestionColors[suggestion.type] || suggestionColors.style
  const icon = suggestionIcons[suggestion.type] || suggestionIcons.style

  return (
    <Card className={`${colorClass} transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
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
          {/* Suggestion Content */}
          <div className="rounded-md bg-white/50 p-3 text-sm dark:bg-gray-900/50">
            <p className="font-medium text-xs text-muted-foreground mb-1 uppercase tracking-wide">
              Suggested {suggestion.type}:
            </p>
            <p className="text-sm leading-relaxed">
              {suggestion.suggestedText}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" onClick={onApply} className="flex-1">
              <Check className="mr-1 h-3 w-3" />
              Apply
            </Button>
            <Button size="sm" variant="outline" onClick={onDismiss}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StyleSuggestionCardProps {
  suggestion: AISuggestion
  onApply: () => void
  onDismiss: () => void
}

function StyleSuggestionCard({ suggestion, onApply, onDismiss }: StyleSuggestionCardProps) {
  const colorClass = suggestionColors[suggestion.type] || suggestionColors.style
  const icon = suggestionIcons[suggestion.type] || suggestionIcons.style

  return (
    <Card className={`${colorClass} transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
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
          {/* Before/After Content */}
          {suggestion.originalText && (
            <div className="space-y-2">
              <div className="rounded-md bg-red-50 p-2 text-xs dark:bg-red-950/20">
                <p className="font-medium text-red-700 dark:text-red-300 mb-1">Original:</p>
                <p className="text-red-600 dark:text-red-400">{suggestion.originalText}</p>
              </div>
              <div className="rounded-md bg-green-50 p-2 text-xs dark:bg-green-950/20">
                <p className="font-medium text-green-700 dark:text-green-300 mb-1">Suggested:</p>
                <p className="text-green-600 dark:text-green-400">{suggestion.suggestedText}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" onClick={onApply} className="flex-1">
              <Check className="mr-1 h-3 w-3" />
              Apply
            </Button>
            <Button size="sm" variant="outline" onClick={onDismiss}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
