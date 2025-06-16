import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { AIService } from "@/services/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, writingGoals, documentId } = await request.json()

    if (!content || !writingGoals || !documentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const analysis = await AIService.generateAnalysis(userId, documentId, content, writingGoals)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
