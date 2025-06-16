import type { AISuggestion, ToneAnalysis } from "@/types/ai-features"

export function generateMockSuggestions(content: string): AISuggestion[] {
  if (!content.trim()) return []

  const suggestions: AISuggestion[] = []

  // Mock grammar suggestion
  if (content.toLowerCase().includes("there")) {
    suggestions.push({
      id: "1",
      type: "grammar",
      title: "Consider word choice",
      description: "This word might be confused with 'their' or 'they're'",
      originalText: "there",
      suggestedText: "their",
      position: { start: content.toLowerCase().indexOf("there"), end: content.toLowerCase().indexOf("there") + 5 },
      confidence: 85,
    })
  }

  // Mock style suggestion
  if (content.includes("very")) {
    suggestions.push({
      id: "2",
      type: "style",
      title: "Strengthen your writing",
      description: "Consider using a more specific adjective",
      originalText: "very good",
      suggestedText: "excellent",
      position: { start: content.indexOf("very"), end: content.indexOf("very") + 9 },
      confidence: 92,
    })
  }

  // Mock clarity suggestion
  if (content.length > 100) {
    suggestions.push({
      id: "3",
      type: "clarity",
      title: "Consider breaking up long sentences",
      description: "This sentence might be easier to read if split into two",
      originalText: content.slice(0, 50) + "...",
      suggestedText: "Split into shorter sentences",
      position: { start: 0, end: 50 },
      confidence: 78,
    })
  }

  return suggestions
}

export function generateMockToneAnalysis(content: string): ToneAnalysis {
  if (!content.trim()) {
    return {
      overall: "neutral",
      confidence: 0,
      aspects: {
        formality: 50,
        friendliness: 50,
        confidence: 50,
        clarity: 50,
      },
      suggestions: ["Start writing to see tone analysis"],
    }
  }

  // Simple mock analysis based on content characteristics
  const wordCount = content.split(/\s+/).length
  const hasExclamation = content.includes("!")
  const hasQuestion = content.includes("?")
  const hasFormalWords = /\b(therefore|furthermore|consequently|moreover)\b/i.test(content)

  return {
    overall: hasFormalWords ? "professional" : hasExclamation ? "friendly" : "neutral",
    confidence: Math.min(wordCount * 2, 95),
    aspects: {
      formality: hasFormalWords ? 85 : hasExclamation ? 30 : 60,
      friendliness: hasExclamation ? 90 : hasQuestion ? 70 : 50,
      confidence: content.length > 200 ? 80 : 60,
      clarity: wordCount > 50 ? 75 : 85,
    },
    suggestions: [
      wordCount < 10 ? "Add more content for better analysis" : "Your writing tone is developing well",
      hasFormalWords ? "Maintain professional language" : "Consider adding more formal transitions",
      "Keep sentences clear and concise",
    ],
  }
}
