'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  Target, 
  Lightbulb, 
  Megaphone,
  List,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { AISuggestions } from './ai-suggestions'
import { useAISuggestions } from '@/hooks/use-ai-suggestions'
import type { WritingGoals } from '@/types/writing-goals'

interface AISidebarProps {
  isOpen: boolean
  documentId?: string | null
  writingGoals?: WritingGoals
  currentContent?: string
}

export function AISidebar({ 
  isOpen, 
  documentId,
  writingGoals,
  currentContent = ''
}: AISidebarProps) {
  console.log('[AISidebar] Rendering with props:', {
    isOpen,
    documentId,
    hasWritingGoals: !!writingGoals,
    contentLength: currentContent.length
  })

  const [activeTab, setActiveTab] = useState('suggestions')

  const {
    styleSuggestions,
    funnelSuggestions,
    totalSuggestionsCount,
    loadingStyleSuggestions,
    loadingFunnelSuggestions,
    generatingFunnelSuggestions,
    generateFunnelSuggestions,
    applySuggestion,
    dismissSuggestion,
    refreshSuggestions
  } = useAISuggestions({ documentId: documentId || null })

  if (!isOpen) return null

  const handleGenerateFunnelSuggestions = async () => {
    if (!writingGoals) {
      console.warn('[AISidebar] Cannot generate funnel suggestions: no writing goals provided')
      return
    }
    
    console.log('[AISidebar] Generating funnel suggestions with goals:', writingGoals)
    await generateFunnelSuggestions(writingGoals, currentContent)
  }

  const isLoading = loadingStyleSuggestions || loadingFunnelSuggestions

  return (
    <div className="fixed bottom-0 right-0 top-14 z-40 flex w-80 flex-col border-l bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">AI Assistant</h2>
              {totalSuggestionsCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {totalSuggestionsCount} suggestions available
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={refreshSuggestions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="h-3 w-3" />
              Suggestions
              {totalSuggestionsCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalSuggestionsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="funnel" className="flex items-center gap-2">
              <Megaphone className="h-3 w-3" />
              Funnel
            </TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="flex-1 mt-0">
            <AISuggestions
              styleSuggestions={styleSuggestions}
              funnelSuggestions={funnelSuggestions}
              onApply={applySuggestion}
              onDismiss={dismissSuggestion}
              loading={isLoading}
            />
          </TabsContent>

          {/* Funnel Tab */}
          <TabsContent value="funnel" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Generate Funnel Suggestions Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Funnel Copy Generator
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Generate headlines, subheadlines, CTAs, and content outlines based on your writing goals.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleGenerateFunnelSuggestions}
                      disabled={!writingGoals || generatingFunnelSuggestions}
                      className="w-full"
                      size="sm"
                    >
                      {generatingFunnelSuggestions ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-3 w-3" />
                          Generate Funnel Copy
                        </>
                      )}
                    </Button>
                    
                    {!writingGoals && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Set your writing goals to generate funnel suggestions.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Writing Goals Context */}
                {writingGoals && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Current Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Audience:</span>
                          <p className="font-medium capitalize">{writingGoals.audience.replace('-', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Intent:</span>
                          <p className="font-medium capitalize">{writingGoals.intent}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Domain:</span>
                          <p className="font-medium capitalize">{writingGoals.domain.replace('-', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tone:</span>
                          <p className="font-medium capitalize">{writingGoals.formality}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Funnel Suggestions */}
                {funnelSuggestions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Recent Funnel Suggestions
                        <Badge variant="secondary" className="text-xs">
                          {funnelSuggestions.length}
                        </Badge>
                      </h3>
                      
                      <div className="space-y-3">
                        {funnelSuggestions.slice(0, 3).map((suggestion) => (
                          <Card key={suggestion.id} className="border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs font-medium">
                                {suggestion.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {suggestion.suggestedText}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs flex-1"
                                  onClick={() => applySuggestion(suggestion.id)}
                                >
                                  Apply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs"
                                  onClick={() => dismissSuggestion(suggestion.id)}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {funnelSuggestions.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setActiveTab('suggestions')}
                        >
                          View All Suggestions ({funnelSuggestions.length})
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
