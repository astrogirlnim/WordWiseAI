import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { AIService } from "@/services/ai-service"

export async function POST(request: NextRequest, { params }: { params: { id: string; action: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, id: suggestionId } = params
    const { documentId, suggestion } = await request.json()

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const status = action === "accept" ? "applied" : "dismissed"
    await AIService.saveSuggestionFeedback(userId, documentId, suggestion, status)

    return NextResponse.json({ success: true, action, suggestionId })
  } catch (error) {
    console.error("Error processing suggestion feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
