export interface Version {
  id: string;
  content: string;
  createdAt: number;
  diff: string; // This could be a string representation of the diff, or a more complex object
} 