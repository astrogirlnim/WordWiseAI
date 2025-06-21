import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import app from '../lib/firebase';

const db = getFirestore(app);

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
  static async logEvent(event: AuditEvent, userId: string, details: Record<string, unknown>) {
    try {
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