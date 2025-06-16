"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import type { VoiceReport } from "@/types/document"

interface VoiceReportPanelProps {
  documentId: string
  onReportGenerated?: (report: VoiceReport) => void
}

export function VoiceReportPanel({ documentId, onReportGenerated }: VoiceReportPanelProps) {
  const [report, setReport] = useState<VoiceReport | null>(null)
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/voice-report/${documentId}`, {
        method: "POST",
      })

      if (response.ok) {
        const newReport = await response.json()
        setReport(newReport)
        onReportGenerated?.(newReport)
      }
    } catch (error) {
      console.error("Error generating voice report:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-blue-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Brand Voice Report
              </CardTitle>
              <CardDescription>Analyze alignment with your brand guidelines</CardDescription>
            </div>
            <Button onClick={generateReport} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardHeader>

        {report && (
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Alignment Score</span>
                <span className={`font-bold ${getScoreColor(report.alignmentScore)}`}>{report.alignmentScore}/100</span>
              </div>
              <Progress value={report.alignmentScore} className="h-3" />
            </div>

            {/* Tone Matches */}
            <div>
              <h4 className="font-medium mb-3">Tone Analysis</h4>
              <div className="space-y-3">
                {report.toneMatches.map((match, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{match.category}</span>
                      <span className={`text-sm font-medium ${getScoreColor(match.score)}`}>{match.score}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Expected: {match.expected}</div>
                      <div>Actual: {match.actual}</div>
                    </div>
                    <Progress value={match.score} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Violations */}
            {report.violations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Brand Guidelines Issues
                </h4>
                <div className="space-y-3">
                  {report.violations.map((violation, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{violation.type}</span>
                        <Badge variant={getSeverityColor(violation.severity)} className="text-xs">
                          {violation.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{violation.description}</p>
                      <div>
                        <p className="text-xs font-medium mb-1">Suggestions:</p>
                        <ul className="space-y-1">
                          {violation.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Report generated on {new Date(report.createdAt).toLocaleString()}
            </div>
          </CardContent>
        )}

        {!report && !loading && (
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No voice report available</p>
              <p className="text-sm">Generate a report to analyze brand alignment</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
