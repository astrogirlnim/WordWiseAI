'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AISuggestions } from './ai-suggestions'
import { Lightbulb, Zap, AlertTriangle, RefreshCw } from 'lucide-react'
import type { AISuggestion } from '@/types/ai-features'

interface AISidebarProps {
  isOpen: boolean
  suggestions?: AISuggestion[]
  loading?: boolean
  error?: string | null
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
  onReloadSuggestions?: () => void
}

export function AISidebar({ 
  isOpen,
  suggestions = [],
  loading = false,
  error = null,
  onApplySuggestion,
  onDismissSuggestion,
  onReloadSuggestions
}: AISidebarProps) {
  const [activeTab, setActiveTab] = useState('suggestions')

  console.log('[AISidebar] Rendering with:', {
    isOpen,
    suggestionCount: suggestions.length,
    loading,
    error: !!error
  })

  if (!isOpen) return null

  // Group suggestions by type
  const suggestionsByType = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = []
    }
    acc[suggestion.type].push(suggestion)
    return acc
  }, {} as Record<string, AISuggestion[]>)

  const styleSuggestions = suggestionsByType.style || []
  const grammarSuggestions = suggestionsByType.grammar || []
  const claritySuggestions = suggestionsByType.clarity || []
  const engagementSuggestions = suggestionsByType.engagement || []

  console.log('[AISidebar] Suggestions by type:', {
    style: styleSuggestions.length,
    grammar: grammarSuggestions.length,
    clarity: claritySuggestions.length,
    engagement: engagementSuggestions.length
  })

  return (
    <div className="fixed bottom-0 right-0 top-14 z-40 flex w-80 flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-retro-primary to-retro-sunset">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {suggestions.length} suggestions available
            </p>
          </div>
        </div>
        {onReloadSuggestions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReloadSuggestions}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          <TabsList className="grid w-full grid-cols-2 m-2">
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Suggestions
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-xs">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="suggestions" className="mt-0 h-full">
              <div className="space-y-4 p-4">
                {/* Error State */}
                {error && (
                  <Card className="border-destructive/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Error Loading Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-2">{error}</p>
                      {onReloadSuggestions && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onReloadSuggestions}
                          className="h-7 text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Loading State */}
                {loading && !error && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading suggestions...</span>
                    </div>
                  </div>
                )}

                {/* Suggestions Content */}
                {!loading && !error && (
                  <>
                    {/* Style Suggestions */}
                    {styleSuggestions.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-500" />
                          <h3 className="text-sm font-medium">Style & Readability</h3>
                          <Badge variant="secondary" className="ml-auto">
                            {styleSuggestions.length}
                          </Badge>
                        </div>
                        <AISuggestions
                          suggestions={styleSuggestions}
                          onApplySuggestion={onApplySuggestion}
                          onDismissSuggestion={onDismissSuggestion}
                        />
                      </div>
                    )}

                    {/* Grammar Suggestions */}
                    {grammarSuggestions.length > 0 && (
                      <div>
                        {styleSuggestions.length > 0 && <Separator className="my-4" />}
                        <div className="mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <h3 className="text-sm font-medium">Grammar</h3>
                          <Badge variant="destructive" className="ml-auto">
                            {grammarSuggestions.length}
                          </Badge>
                        </div>
                        <AISuggestions
                          suggestions={grammarSuggestions}
                          onApplySuggestion={onApplySuggestion}
                          onDismissSuggestion={onDismissSuggestion}
                        />
                      </div>
                    )}

                    {/* Clarity Suggestions */}
                    {claritySuggestions.length > 0 && (
                      <div>
                        {(styleSuggestions.length > 0 || grammarSuggestions.length > 0) && <Separator className="my-4" />}
                        <div className="mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-green-500" />
                          <h3 className="text-sm font-medium">Clarity</h3>
                          <Badge variant="secondary" className="ml-auto">
                            {claritySuggestions.length}
                          </Badge>
                        </div>
                        <AISuggestions
                          suggestions={claritySuggestions}
                          onApplySuggestion={onApplySuggestion}
                          onDismissSuggestion={onDismissSuggestion}
                        />
                      </div>
                    )}

                    {/* Engagement Suggestions */}
                    {engagementSuggestions.length > 0 && (
                      <div>
                        {(styleSuggestions.length > 0 || grammarSuggestions.length > 0 || claritySuggestions.length > 0) && <Separator className="my-4" />}
                        <div className="mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <h3 className="text-sm font-medium">Engagement</h3>
                          <Badge variant="outline" className="ml-auto">
                            {engagementSuggestions.length}
                          </Badge>
                        </div>
                        <AISuggestions
                          suggestions={engagementSuggestions}
                          onApplySuggestion={onApplySuggestion}
                          onDismissSuggestion={onDismissSuggestion}
                        />
                      </div>
                    )}

                    {/* Empty State */}
                    {suggestions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-sm font-medium mb-2">No suggestions yet</h3>
                        <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                          Start writing to get AI-powered suggestions for improving your content.
                        </p>
                        {onReloadSuggestions && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onReloadSuggestions}
                            className="h-8 text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Check for Suggestions
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0 h-full">
              <div className="p-4">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <h3 className="text-sm font-medium mb-2">Analytics Coming Soon</h3>
                  <p className="text-xs">
                    Track your writing improvements and suggestion acceptance rates.
                  </p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
