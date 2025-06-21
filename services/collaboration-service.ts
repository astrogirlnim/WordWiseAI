import { getDatabase, ref, onValue, set, onDisconnect } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import app from '../lib/firebase';

const db = getDatabase(app);

export class CollaborationService {
  /**
   * Join a document collaboration session with ownership verification
   * @param docId - Document ID to join
   * @param user - User information for presence tracking
   */
  static async joinDocumentSession(docId: string, user: { id: string, name: string, color: string }) {
    console.log('[CollaborationService] Attempting to join document session:', docId, 'as user:', user.id);
    
    try {
      // First, verify the user owns this document by checking Firestore
      const firestoreDocRef = doc(firestore, 'documents', docId);
      const firestoreDocSnap = await getDoc(firestoreDocRef);
      
      if (!firestoreDocSnap.exists()) {
        console.error('[CollaborationService] Document not found in Firestore:', docId);
        throw new Error('Document not found');
      }
      
      const documentData = firestoreDocSnap.data();
      if (documentData.ownerId !== user.id) {
        console.error('[CollaborationService] User', user.id, 'does not own document', docId, 'Owner is:', documentData.ownerId);
        throw new Error('Access denied: You do not own this document');
      }
      
      console.log('[CollaborationService] Document ownership verified for user:', user.id);
      
      // Set document metadata in Realtime Database for security rules
      const metadataRef = ref(db, `/documents/${docId}/metadata`);
      await set(metadataRef, {
        ownerId: user.id,
        title: documentData.title || 'Untitled Document',
        lastUpdated: Date.now()
      });
      
      console.log('[CollaborationService] Document metadata set in Realtime Database');
      
      // Now set up presence tracking
      const userStatusDatabaseRef = ref(db, `/documents/${docId}/presence/${user.id}`);

      const isOfflineForDatabase = {
        state: 'offline',
        last_changed: Date.now(),
        ...user
      };

      const isOnlineForDatabase = {
        state: 'online',
        last_changed: Date.now(),
        ...user
      };

      // Set up connection state tracking
      onValue(ref(db, '.info/connected'), (snapshot) => {
        if (snapshot.val() === false) {
          console.log('[CollaborationService] Client disconnected from Firebase');
          return;
        }

        console.log('[CollaborationService] Client connected to Firebase, setting presence');
        
        // Set offline status on disconnect, then set online status
        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
          set(userStatusDatabaseRef, isOnlineForDatabase);
          console.log('[CollaborationService] User presence set to online for document:', docId);
        });
      });
      
    } catch (error) {
      console.error('[CollaborationService] Failed to join document session:', error);
      throw error;
    }
  }
  
  /**
   * Leave a document collaboration session
   * @param docId - Document ID to leave
   * @param userId - User ID leaving the session
   */
  static async leaveDocumentSession(docId: string, userId: string) {
    console.log('[CollaborationService] User', userId, 'leaving document session:', docId);
    
    try {
      const userStatusDatabaseRef = ref(db, `/documents/${docId}/presence/${userId}`);
      await set(userStatusDatabaseRef, {
        state: 'offline',
        last_changed: Date.now()
      });
      
      console.log('[CollaborationService] User presence set to offline');
    } catch (error) {
      console.error('[CollaborationService] Failed to leave document session:', error);
      throw error;
    }
  }
  
  /**
   * Get current presence information for a document
   * @param docId - Document ID
   * @param callback - Callback to receive presence updates
   * @returns Unsubscribe function
   */
  static subscribeToPresence(docId: string, callback: (presence: Record<string, unknown>) => void): () => void {
    console.log('[CollaborationService] Subscribing to presence for document:', docId);
    
    const presenceRef = ref(db, `/documents/${docId}/presence`);
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      console.log('[CollaborationService] Presence update for document', docId, ':', Object.keys(presenceData));
      callback(presenceData);
    });
    
    return unsubscribe;
  }
} 