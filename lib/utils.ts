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

/**
 * Validates if a string is a valid email address.
 * Uses a comprehensive regex pattern to validate email format.
 * @param email - The email string to validate.
 * @returns true if valid email, false otherwise.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  // Comprehensive email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  return emailRegex.test(email.trim())
}

/**
 * Validates if a user email is properly formatted and not empty.
 * Also checks for common issues like whitespace and invalid characters.
 * @param email - The email to validate.
 * @returns Object with validation result and error message if invalid.
 */
export function validateUserEmail(email: string | null | undefined): { 
  isValid: boolean
  error?: string 
} {
  console.log('[validateUserEmail] Validating email:', email)
  
  if (!email) {
    return { 
      isValid: false, 
      error: 'Email address is required' 
    }
  }
  
  const trimmedEmail = email.trim()
  
  if (trimmedEmail.length === 0) {
    return { 
      isValid: false, 
      error: 'Email address cannot be empty' 
    }
  }
  
  if (!isValidEmail(trimmedEmail)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid email address' 
    }
  }
  
  return { isValid: true }
}

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase.
 * @param email - The email to normalize.
 * @returns Normalized email string.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
