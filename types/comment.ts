export interface Comment {
  id: string;
  docId: string;
  userId: string;
  content: string;
  anchorStart: number;
  anchorEnd: number;
  createdAt: number;
  resolvedAt?: number;
} 