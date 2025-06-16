"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, MessageCircle } from "lucide-react"
import type { ToneAnalysis } from "@/types/ai-features"

interface ToneAnalysisProps {
  analysis: ToneAnalysis
}

export function ToneAnalysisComponent({ analysis }: ToneAnalysisProps) {
  const getToneColor = (tone: ToneAnalysis["overall"]) => {
    switch (tone) {
      case "professional":
        return "bg-blue-500"
      case "casual":
        return "bg-green-500"
      case "friendly":
        return "bg-yellow-500"
      case "formal":
        return "bg-purple-500"
      case "confident":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Overall Tone
            </CardTitle>
            <Badge className={`${getToneColor(analysis.overall)} text-white`}>{analysis.overall}</Badge>
          </div>
          <CardDescription className="text-xs">{analysis.confidence}% confidence</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tone Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Formality</span>
              <span>{analysis.aspects.formality}%</span>
            </div>
            <Progress value={analysis.aspects.formality} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Friendliness</span>
              <span>{analysis.aspects.friendliness}%</span>
            </div>
            <Progress value={analysis.aspects.friendliness} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Confidence</span>
              <span>{analysis.aspects.confidence}%</span>
            </div>
            <Progress value={analysis.aspects.confidence} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Clarity</span>
              <span>{analysis.aspects.clarity}%</span>
            </div>
            <Progress value={analysis.aspects.clarity} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
