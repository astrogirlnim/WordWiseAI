import type { ToneAlignmentReport, ToneAlignmentScore, ToneRecommendation } from "@/types/tone-alignment"
import type { WritingGoals } from "@/types/writing-goals"

export function generateToneAlignmentReport(content: string, goals: WritingGoals): ToneAlignmentReport {
  if (!content.trim()) {
    return getEmptyReport()
  }

  // Analyze content characteristics
  const wordCount = content.split(/\s+/).length
  const sentenceCount = content.split(/[.!?]+/).filter(Boolean).length
  const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1)
  const hasExclamation = content.includes("!")
  const hasQuestion = content.includes("?")
  const hasFormalWords = /\b(therefore|furthermore|consequently|moreover|additionally|specifically)\b/i.test(content)
  const hasCasualWords = /\b(awesome|cool|great|amazing|super|really|pretty|kinda|gonna|wanna)\b/i.test(content)
  const hasMarketingWords =
    /\b(brand|customer|solution|innovative|exclusive|premium|value|benefit|ROI|conversion)\b/i.test(content)
  const hasCallToAction = /\b(buy|purchase|subscribe|sign up|learn more|get started|contact|download)\b/i.test(content)

  // Calculate alignment scores
  const audienceScore = calculateAudienceAlignment(content, goals.audience, {
    hasFormalWords,
    hasCasualWords,
    hasMarketingWords,
    avgWordsPerSentence,
  })

  const formalityScore = calculateFormalityAlignment(content, goals.formality, {
    hasFormalWords,
    hasCasualWords,
    hasExclamation,
    avgWordsPerSentence,
  })

  const domainScore = calculateDomainAlignment(content, goals.domain, {
    hasMarketingWords,
    hasCallToAction,
    wordCount,
  })

  const intentScore = calculateIntentAlignment(content, goals.intent, {
    hasCallToAction,
    hasQuestion,
    hasExclamation,
    wordCount,
  })

  const overallScore = Math.round(
    (audienceScore.alignment + formalityScore.alignment + domainScore.alignment + intentScore.alignment) / 4,
  )

  const recommendations = generateRecommendations(content, goals, {
    audienceScore,
    formalityScore,
    domainScore,
    intentScore,
  })

  return {
    overallScore,
    overallStatus: getStatusFromScore(overallScore),
    scores: {
      audience: audienceScore,
      formality: formalityScore,
      domain: domainScore,
      intent: intentScore,
    },
    recommendations,
    brandConsistency: {
      score: Math.min(overallScore + 5, 100),
      issues: recommendations.filter((r) => r.priority === "high").map((r) => r.title),
      strengths: getStrengths(overallScore),
    },
  }
}

function calculateAudienceAlignment(content: string, audience: string, analysis: any): ToneAlignmentScore {
  let current = 50
  let target = 50

  switch (audience) {
    case "consumers":
      target = analysis.hasCasualWords ? 75 : 60
      current = analysis.hasCasualWords ? 80 : analysis.hasFormalWords ? 40 : 65
      break
    case "stakeholders":
      target = 85
      current = analysis.hasFormalWords ? 90 : analysis.avgWordsPerSentence > 15 ? 75 : 60
      break
    case "internal-team":
      target = 70
      current = analysis.hasCasualWords && analysis.hasFormalWords ? 80 : 65
      break
    case "industry-experts":
      target = 90
      current = analysis.hasFormalWords && analysis.avgWordsPerSentence > 12 ? 85 : 70
      break
  }

  const alignment = Math.max(0, 100 - Math.abs(current - target) * 2)

  return {
    category: "Audience Alignment",
    current,
    target,
    alignment,
    status: getStatusFromScore(alignment),
  }
}

function calculateFormalityAlignment(content: string, formality: string, analysis: any): ToneAlignmentScore {
  let current = 50
  let target = 50

  switch (formality) {
    case "casual":
      target = 30
      current = analysis.hasCasualWords ? 25 : analysis.hasExclamation ? 35 : 55
      break
    case "professional":
      target = 70
      current = analysis.hasFormalWords && !analysis.hasCasualWords ? 75 : 60
      break
    case "formal":
      target = 90
      current = analysis.hasFormalWords && analysis.avgWordsPerSentence > 15 ? 85 : 65
      break
  }

  const alignment = Math.max(0, 100 - Math.abs(current - target) * 1.5)

  return {
    category: "Formality Level",
    current,
    target,
    alignment,
    status: getStatusFromScore(alignment),
  }
}

function calculateDomainAlignment(content: string, domain: string, analysis: any): ToneAlignmentScore {
  let current = 50
  const target = 70

  const domainScores = {
    "marketing-copy": analysis.hasMarketingWords && analysis.hasCallToAction ? 85 : 60,
    "brand-strategy": analysis.hasMarketingWords ? 80 : 55,
    "social-media": analysis.wordCount < 100 ? 80 : 60,
    "email-campaign": analysis.hasCallToAction ? 85 : 65,
    "press-release": analysis.wordCount > 200 ? 80 : 60,
    "content-marketing": analysis.wordCount > 300 ? 85 : 65,
  }

  current = domainScores[domain as keyof typeof domainScores] || 50
  const alignment = Math.min(current, 95)

  return {
    category: "Content Type",
    current,
    target,
    alignment,
    status: getStatusFromScore(alignment),
  }
}

function calculateIntentAlignment(content: string, intent: string, analysis: any): ToneAlignmentScore {
  let current = 50
  const target = 75

  const intentScores = {
    persuade: analysis.hasCallToAction && analysis.hasExclamation ? 85 : 65,
    inform: analysis.wordCount > 200 && !analysis.hasExclamation ? 80 : 60,
    engage: analysis.hasQuestion || analysis.hasExclamation ? 85 : 65,
    convert: analysis.hasCallToAction ? 90 : 50,
    "build-awareness": analysis.wordCount > 150 ? 80 : 65,
  }

  current = intentScores[intent as keyof typeof intentScores] || 50
  const alignment = Math.min(current + 10, 95)

  return {
    category: "Intent Match",
    current,
    target,
    alignment,
    status: getStatusFromScore(alignment),
  }
}

function generateRecommendations(content: string, goals: WritingGoals, scores: any): ToneRecommendation[] {
  const recommendations: ToneRecommendation[] = []

  // Audience recommendations
  if (scores.audienceScore.alignment < 70) {
    recommendations.push({
      id: "audience-1",
      category: "audience",
      priority: "high",
      title: "Adjust language for target audience",
      description: `Your content doesn't fully match your ${goals.audience.replace("-", " ")} audience`,
      suggestion: getAudienceSuggestion(goals.audience),
      examples: getAudienceExamples(goals.audience),
    })
  }

  // Formality recommendations
  if (scores.formalityScore.alignment < 70) {
    recommendations.push({
      id: "formality-1",
      category: "formality",
      priority: "medium",
      title: "Adjust formality level",
      description: `Your tone should be more ${goals.formality}`,
      suggestion: getFormalitySuggestion(goals.formality),
      examples: getFormalityExamples(goals.formality),
    })
  }

  // Domain recommendations
  if (scores.domainScore.alignment < 70) {
    recommendations.push({
      id: "domain-1",
      category: "domain",
      priority: "high",
      title: "Optimize for content type",
      description: `Enhance your content for ${goals.domain.replace("-", " ")}`,
      suggestion: getDomainSuggestion(goals.domain),
    })
  }

  // Intent recommendations
  if (scores.intentScore.alignment < 70) {
    recommendations.push({
      id: "intent-1",
      category: "intent",
      priority: "medium",
      title: "Strengthen your intent",
      description: `Better align your content to ${goals.intent.replace("-", " ")}`,
      suggestion: getIntentSuggestion(goals.intent),
    })
  }

  return recommendations
}

function getAudienceSuggestion(audience: string): string {
  const suggestions = {
    consumers: "Use more conversational language and relatable examples",
    stakeholders: "Include more data-driven insights and strategic language",
    "internal-team": "Balance professional tone with collaborative language",
    "industry-experts": "Use technical terminology and detailed analysis",
  }
  return suggestions[audience as keyof typeof suggestions] || "Adjust language for your audience"
}

function getAudienceExamples(audience: string): string[] {
  const examples = {
    consumers: ["Instead of 'utilize' use 'use'", "Add personal benefits and outcomes"],
    stakeholders: ["Include ROI metrics", "Use strategic business language"],
    "internal-team": ["Use 'we' and 'our team'", "Include collaborative action items"],
    "industry-experts": ["Include technical specifications", "Reference industry standards"],
  }
  return examples[audience as keyof typeof examples] || []
}

function getFormalitySuggestion(formality: string): string {
  const suggestions = {
    casual: "Use contractions and conversational phrases",
    professional: "Maintain business-appropriate language",
    formal: "Use complete sentences and avoid contractions",
  }
  return suggestions[formality as keyof typeof suggestions] || "Adjust formality level"
}

function getFormalityExamples(formality: string): string[] {
  const examples = {
    casual: ["Use 'we're' instead of 'we are'", "Add friendly expressions"],
    professional: ["Use 'we recommend' instead of 'we think'", "Maintain clear structure"],
    formal: ["Use 'we are' instead of 'we're'", "Avoid exclamation points"],
  }
  return examples[formality as keyof typeof examples] || []
}

function getDomainSuggestion(domain: string): string {
  const suggestions = {
    "marketing-copy": "Add compelling calls-to-action and benefit statements",
    "brand-strategy": "Include brand positioning and value propositions",
    "social-media": "Keep it concise and engaging with hashtags",
    "email-campaign": "Include clear subject line and call-to-action",
    "press-release": "Follow press release format with newsworthy angle",
    "content-marketing": "Provide valuable insights and actionable takeaways",
  }
  return suggestions[domain as keyof typeof suggestions] || "Optimize for your content type"
}

function getIntentSuggestion(intent: string): string {
  const suggestions = {
    persuade: "Add stronger calls-to-action and compelling arguments",
    inform: "Include more detailed explanations and examples",
    engage: "Ask questions and encourage interaction",
    convert: "Include clear next steps and urgency",
    "build-awareness": "Focus on brand benefits and unique value",
  }
  return suggestions[intent as keyof typeof suggestions] || "Strengthen your intent"
}

function getStatusFromScore(score: number): "excellent" | "good" | "needs-improvement" | "poor" {
  if (score >= 85) return "excellent"
  if (score >= 70) return "good"
  if (score >= 50) return "needs-improvement"
  return "poor"
}

function getStrengths(score: number): string[] {
  const strengths = []
  if (score >= 70) strengths.push("Clear communication style")
  if (score >= 75) strengths.push("Good audience targeting")
  if (score >= 80) strengths.push("Consistent brand voice")
  if (score >= 85) strengths.push("Excellent tone alignment")
  return strengths
}

function getEmptyReport(): ToneAlignmentReport {
  return {
    overallScore: 0,
    overallStatus: "poor",
    scores: {
      audience: { category: "Audience Alignment", current: 0, target: 0, alignment: 0, status: "poor" },
      formality: { category: "Formality Level", current: 0, target: 0, alignment: 0, status: "poor" },
      domain: { category: "Content Type", current: 0, target: 0, alignment: 0, status: "poor" },
      intent: { category: "Intent Match", current: 0, target: 0, alignment: 0, status: "poor" },
    },
    recommendations: [],
    brandConsistency: {
      score: 0,
      issues: ["Start writing to see tone analysis"],
      strengths: [],
    },
  }
}
