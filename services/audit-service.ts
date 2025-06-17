import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import app from '../lib/firebase';

const db = getFirestore(app);

export enum AuditEvent {
  DOCUMENT_CREATE = 'document_create',
  DOCUMENT_UPDATE = 'document_update',
  DOCUMENT_DELETE = 'document_delete',
}

export class AuditService {
  static async logEvent(event: AuditEvent, userId: string, details: Record<string, any>) {
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