"use client"

import { AISuggestions } from "./ai-suggestions"
import { ToneAnalysisComponent } from "./tone-analysis"
import { ToneAlignmentReportComponent } from "./tone-alignment-report"
import { Separator } from "@/components/ui/separator"
import { Brain, Wand2, X, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AISuggestion, ToneAnalysis } from "@/types/ai-features"
import type { ToneAlignmentReport } from "@/types/tone-alignment"

interface AISidebarProps {
  suggestions: AISuggestion[]
  toneAnalysis: ToneAnalysis
  toneAlignmentReport: ToneAlignmentReport
  isOpen: boolean
  onToggle: () => void
  onApplySuggestion?: (suggestion: AISuggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
  onApplyRecommendation?: (recommendationId: string) => void
}

export function AISidebar({
  suggestions,
  toneAnalysis,
  toneAlignmentReport,
  isOpen,
  onToggle,
  onApplySuggestion,
  onDismissSuggestion,
  onApplyRecommendation,
}: AISidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-14 bottom-0 w-80 bg-background border-l z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Tone Alignment Report */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium text-sm">Tone Alignment</span>
            </div>
            <ToneAlignmentReportComponent report={toneAlignmentReport} onApplyRecommendation={onApplyRecommendation} />
          </div>

          <Separator />

          {/* Writing Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="h-4 w-4" />
              <span className="font-medium text-sm">Writing Suggestions</span>
            </div>
            <AISuggestions
              suggestions={suggestions}
              onApplySuggestion={onApplySuggestion}
              onDismissSuggestion={onDismissSuggestion}
            />
          </div>

          <Separator />

          {/* Tone Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4" />
              <span className="font-medium text-sm">Tone Analysis</span>
            </div>
            <ToneAnalysisComponent analysis={toneAnalysis} />
          </div>
        </div>
      </div>
    </div>
  )
}
