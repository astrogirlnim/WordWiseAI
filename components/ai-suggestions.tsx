"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Lightbulb, Zap } from "lucide-react"
import type { AISuggestion } from "@/types/ai-features"

interface AISuggestionsProps {
  suggestions: AISuggestion[]
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
}

export function AISuggestions({ suggestions, onApplySuggestion, onDismissSuggestion }: AISuggestionsProps) {
  const getSuggestionIcon = (type: AISuggestion["type"]) => {
    switch (type) {
      case "grammar":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "style":
        return <Lightbulb className="h-4 w-4 text-blue-500" />
      case "clarity":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "engagement":
        return <Zap className="h-4 w-4 text-purple-500" />
    }
  }

  const getSuggestionColor = (type: AISuggestion["type"]) => {
    switch (type) {
      case "grammar":
        return "destructive"
      case "style":
        return "default"
      case "clarity":
        return "secondary"
      case "engagement":
        return "outline"
    }
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No suggestions yet</p>
        <p className="text-xs">Start writing to get AI-powered suggestions</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getSuggestionIcon(suggestion.type)}
                <CardTitle className="text-sm font-medium">{suggestion.title}</CardTitle>
              </div>
              <Badge variant={getSuggestionColor(suggestion.type)} className="text-xs">
                {suggestion.type}
              </Badge>
            </div>
            <CardDescription className="text-xs">{suggestion.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-xs">
                <span className="text-muted-foreground">Original: </span>
                <span className="bg-red-50 px-1 rounded">{suggestion.originalText}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Suggested: </span>
                <span className="bg-green-50 px-1 rounded">{suggestion.suggestedText}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">{suggestion.confidence}% confidence</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs"
                    onClick={() => onDismissSuggestion?.(suggestion.id)}
                  >
                    Dismiss
                  </Button>
                  <Button size="sm" className="h-6 text-xs" onClick={() => onApplySuggestion?.(suggestion)}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
