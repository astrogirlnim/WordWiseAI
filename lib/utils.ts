import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp, FieldValue } from 'firebase/firestore'
import type { FirestoreTimestamp } from '@/types/document'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Firestore Timestamp, FieldValue, or number into a JavaScript Date object.
 * Returns null if the timestamp is invalid or cannot be converted.
 * @param timestamp - The Firestore timestamp to convert.
 * @returns A Date object or null.
 */
export function toJSDate(timestamp: FirestoreTimestamp | FieldValue | undefined): Date | null {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp)
  }
  // FieldValue (like serverTimestamp()) cannot be converted client-side before being set.
  return null
}

/**
 * Formats a Firestore timestamp into a readable string (e.g., "June 15, 2024").
 * Returns a placeholder if the timestamp is not yet available.
 * @param timestamp - The Firestore timestamp to format.
 * @returns A formatted date string.
 */
export function formatFirestoreTimestamp(timestamp: FirestoreTimestamp | FieldValue | undefined): string {
  const date = toJSDate(timestamp)
  if (!date) {
    return 'Pending...'
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
