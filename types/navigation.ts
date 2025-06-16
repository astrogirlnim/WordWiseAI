export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: "free" | "pro" | "team"
}

export interface DocumentListItem {
  id: string
  title: string
  lastModified: Date
  wordCount: number
  isActive?: boolean
}
