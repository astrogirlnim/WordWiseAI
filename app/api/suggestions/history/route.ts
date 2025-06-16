import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { AIService } from "@/services/ai-service"

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const history = await AIService.getUserSuggestionHistory(userId)
    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching suggestion history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
