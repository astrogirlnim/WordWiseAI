import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { adminFirestore } from "@/lib/firebase-admin"

export async function GET(request: NextRequest, { params }: { params: { documentId: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const goalDoc = await adminFirestore
      .collection("writing_goals")
      .where("documentId", "==", params.documentId)
      .where("userId", "==", userId)
      .limit(1)
      .get()

    if (goalDoc.empty) {
      return NextResponse.json({ error: "Goals not found" }, { status: 404 })
    }

    const goal = goalDoc.docs[0].data()
    return NextResponse.json({ id: goalDoc.docs[0].id, ...goal })
  } catch (error) {
    console.error("Error fetching writing goals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { documentId: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { goals, notes } = await request.json()

    const goalData = {
      documentId: params.documentId,
      userId,
      goals,
      notes: notes || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const docRef = await adminFirestore.collection("writing_goals").add(goalData)
    return NextResponse.json({ id: docRef.id, ...goalData })
  } catch (error) {
    console.error("Error creating writing goals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
