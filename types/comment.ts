export interface Comment {
  id: string;
  docId: string;
  authorId: string;
  content: string;
  anchorStart: number;
  anchorEnd: number;
  createdAt: number;
  resolvedAt?: number;
} 