"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, CheckCircle, XCircle, Clock, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AISuggestionRecord } from "@/services/ai-service"

export function SuggestionHistoryPanel() {
  const { user } = useUser()
  const [suggestions, setSuggestions] = useState<AISuggestionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "applied" | "dismissed">("all")

  useEffect(() => {
    loadSuggestionHistory()
  }, [user?.id])

  const loadSuggestionHistory = async () => {
    if (!user?.id) return

    try {
      const response = await fetch("/api/suggestions/history")
      if (response.ok) {
        const history = await response.json()
        setSuggestions(history)
      }
    } catch (error) {
      console.error("Error loading suggestion history:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuggestions = suggestions.filter((s) => {
    if (filter === "all") return true
    return s.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "dismissed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "default"
      case "dismissed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Suggestion History
              </CardTitle>
              <CardDescription>Review your past AI suggestions and feedback</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredSuggestions.map((record) => (
              <div key={record.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{record.suggestion.title}</h4>
                      <Badge variant={getStatusColor(record.status)} className="text-xs">
                        {getStatusIcon(record.status)}
                        {record.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{record.suggestion.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Original: </span>
                        <span className="bg-red-50 px-1 rounded">{record.suggestion.originalText}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Suggested: </span>
                        <span className="bg-green-50 px-1 rounded">{record.suggestion.suggestedText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Confidence: {record.suggestion.confidence}%</span>
                  <span>{new Date(record.createdAt.seconds * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No suggestions found</p>
                <p className="text-sm">Start writing to receive AI suggestions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
