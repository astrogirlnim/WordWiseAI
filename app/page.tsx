import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { DocumentContainer } from "@/components/document-container"

export default function Page() {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <DocumentContainer />
}
