import { FirestoreTimestamp } from './document'

export interface Version {
  id: string;
  content: string; // Storing full content for simplicity. Diff can be computed.
  createdAt: FirestoreTimestamp;
  authorId: string;
  authorName: string; // Denormalized for easier display
} 