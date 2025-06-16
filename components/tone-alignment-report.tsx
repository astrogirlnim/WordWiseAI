"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Target, AlertTriangle, CheckCircle, ArrowRight, Lightbulb, Award } from "lucide-react"
import type { ToneAlignmentReport, ToneAlignmentScore } from "@/types/tone-alignment"

interface ToneAlignmentReportProps {
  report: ToneAlignmentReport
  onApplyRecommendation?: (recommendationId: string) => void
}

export function ToneAlignmentReportComponent({ report, onApplyRecommendation }: ToneAlignmentReportProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200"
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "needs-improvement":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "poor":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <Award className="h-4 w-4" />
      case "good":
        return <CheckCircle className="h-4 w-4" />
      case "needs-improvement":
        return <AlertTriangle className="h-4 w-4" />
      case "poor":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (report.overallScore === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="font-medium mb-2">Tone Alignment Report</h3>
        <p className="text-sm">Start writing to see how well your content aligns with your writing goals</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tone Alignment
            </CardTitle>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(report.overallStatus)}`}
            >
              {getStatusIcon(report.overallStatus)}
              <span className="text-sm font-medium capitalize">{report.overallStatus.replace("-", " ")}</span>
            </div>
          </div>
          <CardDescription>Overall alignment score: {report.overallScore}/100</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={report.overallScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Alignment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(report.scores).map(([key, score]) => (
            <ScoreItem key={key} score={score} />
          ))}
        </CardContent>
      </Card>

      {/* Brand Consistency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Brand Consistency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Consistency Score</span>
            <span className="text-sm font-bold">{report.brandConsistency.score}/100</span>
          </div>
          <Progress value={report.brandConsistency.score} className="h-2" />

          {report.brandConsistency.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {report.brandConsistency.strengths.map((strength, index) => (
                  <li key={index} className="text-xs text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </CardTitle>
            <CardDescription>
              {report.recommendations.length} suggestion{report.recommendations.length !== 1 ? "s" : ""} to improve
              alignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.recommendations.map((recommendation) => (
              <div key={recommendation.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{recommendation.title}</h4>
                      <Badge variant={getPriorityColor(recommendation.priority)} className="text-xs">
                        {recommendation.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{recommendation.description}</p>
                    <p className="text-xs">{recommendation.suggestion}</p>

                    {recommendation.examples && recommendation.examples.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Examples:</p>
                        <ul className="space-y-1">
                          {recommendation.examples.map((example, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" />
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onApplyRecommendation?.(recommendation.id)}
                >
                  Apply Suggestion
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ScoreItem({ score }: { score: ToneAlignmentScore }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "needs-improvement":
        return "text-yellow-600"
      case "poor":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{score.category}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {score.current}% → {score.target}%
          </span>
          <span className={`text-xs font-medium ${getStatusColor(score.status)}`}>{score.alignment}%</span>
        </div>
      </div>
      <Progress value={score.alignment} className="h-2" />
    </div>
  )
}
