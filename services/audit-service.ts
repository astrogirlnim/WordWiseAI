import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import app from '../lib/firebase';

// Lazy initialization helper with null checks
const getFirestoreInstance = () => {
  if (!app) {
    throw new Error('Firebase app not initialized. This service requires client-side execution.');
  }
  return getFirestore(app);
};

export enum AuditEvent {
  DOCUMENT_CREATE = 'document_create',
  DOCUMENT_UPDATE = 'document_update',
  DOCUMENT_DELETE = 'document_delete',
  VERSION_DELETE = 'version_delete',
  SUGGESTION_APPLY = 'suggestion_apply',
  SUGGESTION_IGNORE = 'suggestion_ignore',
  SUGGESTION_ADD_TO_DICTIONARY = 'suggestion_add_to_dictionary',
}

export class AuditService {
  static async logEvent(event: AuditEvent, userId: string, details: Record<string, any>) {
    try {
      const db = getFirestoreInstance();
      await addDoc(collection(db, 'auditLogs'), {
        event,
        userId,
        details,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging audit event: ", error);
    }
  }
} 