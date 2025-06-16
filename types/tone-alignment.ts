export interface ToneAlignmentScore {
  category: string
  current: number
  target: number
  alignment: number // 0-100, how well current matches target
  status: "excellent" | "good" | "needs-improvement" | "poor"
}

export interface ToneAlignmentReport {
  overallScore: number
  overallStatus: "excellent" | "good" | "needs-improvement" | "poor"
  scores: {
    audience: ToneAlignmentScore
    formality: ToneAlignmentScore
    domain: ToneAlignmentScore
    intent: ToneAlignmentScore
  }
  recommendations: ToneRecommendation[]
  brandConsistency: {
    score: number
    issues: string[]
    strengths: string[]
  }
}

export interface ToneRecommendation {
  id: string
  category: "audience" | "formality" | "domain" | "intent" | "brand"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  suggestion: string
  examples?: string[]
}
