import { FirestoreTimestamp } from './document'

export interface Version {
  id: string;
  content: string; // Storing full content for simplicity. Diff can be computed.
  title?: string; // Document title at time of version creation
  createdAt: FirestoreTimestamp;
  authorId: string;
  authorName: string; // Denormalized for easier display
  // Additional collaboration metadata
  contentLength?: number;
  wordCount?: number;
  changeType?: 'manual_save' | 'auto_save' | 'restore' | 'import';
} 