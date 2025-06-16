import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { PostgresCache } from "@/lib/postgres"
import type { AISuggestion, ToneAnalysis } from "@/types/ai-features"
import type { ToneAlignmentReport } from "@/types/tone-alignment"
import type { WritingGoals } from "@/types/writing-goals"

export interface AISuggestionRecord {
  id: string
  userId: string
  documentId: string
  suggestion: AISuggestion
  status: "pending" | "applied" | "dismissed"
  createdAt: any // Firestore timestamp
  updatedAt: any // Firestore timestamp
}

export interface AIAnalysisRecord {
  id: string
  userId: string
  documentId: string
  content: string
  contentHash: string
  writingGoals: WritingGoals
  toneAnalysis: ToneAnalysis
  alignmentReport: ToneAlignmentReport
  suggestions: AISuggestion[]
  createdAt: any // Firestore timestamp
}

export class AIService {
  static async generateAnalysis(
    userId: string,
    documentId: string,
    content: string,
    writingGoals: WritingGoals,
  ): Promise<AIAnalysisRecord> {
    try {
      // Create content hash for caching
      const contentHash = await this.hashContent(content)

      // Check cache first
      const cacheKey = `analysis:${contentHash}`
      const cached = await PostgresCache.get(cacheKey)
      if (cached) {
        const cachedAnalysis = JSON.parse(cached)
        // Still save to Firestore for user history
        await this.saveAnalysisToFirestore(userId, documentId, cachedAnalysis)
        return cachedAnalysis
      }

      // Call Firebase Cloud Function for AI processing
      const analysisResult = await this.callAICloudFunction(content, writingGoals)

      const analysisRecord: Omit<AIAnalysisRecord, "id"> = {
        userId,
        documentId,
        content,
        contentHash,
        writingGoals,
        ...analysisResult,
        createdAt: serverTimestamp(),
      }

      // Save to Firestore
      const docRef = await addDoc(collection(firestore, "ai_analyses"), analysisRecord)
      const savedRecord = { id: docRef.id, ...analysisRecord } as AIAnalysisRecord

      // Cache for 1 hour
      await PostgresCache.set(cacheKey, JSON.stringify(savedRecord), 3600)

      return savedRecord
    } catch (error) {
      console.error("Error generating AI analysis:", error)
      throw new Error("Failed to generate AI analysis")
    }
  }

  static async saveSuggestionFeedback(
    userId: string,
    documentId: string,
    suggestion: AISuggestion,
    status: "applied" | "dismissed",
  ): Promise<void> {
    try {
      const suggestionRecord: Omit<AISuggestionRecord, "id"> = {
        userId,
        documentId,
        suggestion,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(firestore, "ai_suggestions"), suggestionRecord)
    } catch (error) {
      console.error("Error saving suggestion feedback:", error)
    }
  }

  static async getUserSuggestionHistory(userId: string, limitCount = 50): Promise<AISuggestionRecord[]> {
    try {
      const q = query(
        collection(firestore, "ai_suggestions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AISuggestionRecord[]
    } catch (error) {
      console.error("Error getting suggestion history:", error)
      return []
    }
  }

  private static async callAICloudFunction(
    content: string,
    writingGoals: WritingGoals,
  ): Promise<{
    toneAnalysis: ToneAnalysis
    alignmentReport: ToneAlignmentReport
    suggestions: AISuggestion[]
  }> {
    try {
      // This would call your Firebase Cloud Function
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, writingGoals }),
      })

      if (!response.ok) {
        throw new Error("AI analysis failed")
      }

      return await response.json()
    } catch (error) {
      console.error("Error calling AI cloud function:", error)
      // Fallback to mock data for now
      const { generateMockSuggestions, generateMockToneAnalysis } = await import("@/utils/ai-mock-data")
      const { generateToneAlignmentReport } = await import("@/utils/tone-alignment-analysis")

      return {
        toneAnalysis: generateMockToneAnalysis(content),
        alignmentReport: generateToneAlignmentReport(content, writingGoals),
        suggestions: generateMockSuggestions(content),
      }
    }
  }

  private static async saveAnalysisToFirestore(userId: string, documentId: string, analysis: any): Promise<void> {
    try {
      await addDoc(collection(firestore, "ai_analyses"), {
        ...analysis,
        userId,
        documentId,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error saving analysis to Firestore:", error)
    }
  }

  private static async hashContent(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }
}
