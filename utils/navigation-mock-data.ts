import type { User, DocumentListItem } from "@/types/navigation"

export const mockUser: User = {
  id: "1",
  name: "Alex Johnson",
  email: "alex@example.com",
  plan: "pro",
}

export const mockDocuments: DocumentListItem[] = [
  {
    id: "1",
    title: "Untitled Document",
    lastModified: new Date(),
    wordCount: 0,
    isActive: true,
  },
  {
    id: "2",
    title: "Marketing Proposal",
    lastModified: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    wordCount: 1247,
  },
  {
    id: "3",
    title: "Project Requirements",
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    wordCount: 892,
  },
  {
    id: "4",
    title: "Team Meeting Notes",
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    wordCount: 456,
  },
  {
    id: "5",
    title: "Blog Post Draft",
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    wordCount: 2103,
  },
]
