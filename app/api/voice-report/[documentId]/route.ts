import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { adminFirestore } from "@/lib/firebase-admin"
import { generateToneAlignmentReport } from "@/utils/tone-alignment-analysis"
import { DocumentService } from "@/services/document-service"
import type { VoiceReport } from "@/types/document"

export async function GET(request: NextRequest, { params }: { params: { documentId: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the latest voice report for this document
    const reportQuery = await adminFirestore
      .collection("voice_reports")
      .where("documentId", "==", params.documentId)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()

    if (reportQuery.empty) {
      return NextResponse.json({ error: "Voice report not found" }, { status: 404 })
    }

    const report = reportQuery.docs[0].data()
    return NextResponse.json({ id: reportQuery.docs[0].id, ...report })
  } catch (error) {
    console.error("Error fetching voice report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { documentId: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get document and generate voice report
    const document = await DocumentService.getDocument(userId, params.documentId)
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Generate alignment report (this would typically call your AI service)
    const alignmentReport = generateToneAlignmentReport(document.content, document.writingGoals || {})

    const voiceReport: Omit<VoiceReport, "id"> = {
      documentId: params.documentId,
      userId,
      orgId: document.orgId,
      alignmentScore: alignmentReport.overallScore,
      toneMatches: [
        {
          category: "Audience",
          expected: document.writingGoals?.audience || "unknown",
          actual: alignmentReport.scores.audience.current.toString(),
          score: alignmentReport.scores.audience.alignment,
        },
        {
          category: "Formality",
          expected: document.writingGoals?.formality || "unknown",
          actual: alignmentReport.scores.formality.current.toString(),
          score: alignmentReport.scores.formality.alignment,
        },
      ],
      violations: alignmentReport.recommendations.map((rec) => ({
        type: rec.category,
        description: rec.description,
        severity: rec.priority as "low" | "medium" | "high",
        suggestions: rec.examples || [rec.suggestion],
      })),
      createdAt: Date.now(),
    }

    const docRef = await adminFirestore.collection("voice_reports").add(voiceReport)
    return NextResponse.json({ id: docRef.id, ...voiceReport })
  } catch (error) {
    console.error("Error generating voice report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
