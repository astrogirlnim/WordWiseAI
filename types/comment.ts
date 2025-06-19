export interface Comment {
  id: string;
  docId: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  anchorStart: number;
  anchorEnd: number;
  anchoredText?: string;
  status: 'active' | 'resolved' | 'deleted';
  createdAt: number;
  updatedAt?: number;
  resolvedAt?: number;
  resolvedBy?: string;
  parentId?: string;
  replies?: Comment[];
  isEdited?: boolean;
  editedAt?: number;
}

export interface CommentThread {
  id: string;
  documentId: string;
  anchorStart: number;
  anchorEnd: number;
  anchoredText: string;
  comments: Comment[];
  status: 'active' | 'resolved';
  createdAt: number;
  updatedAt: number;
  participantIds: string[];
}

export interface CommentStats {
  total: number;
  active: number;
  resolved: number;
  byAuthor: Record<string, number>;
} 