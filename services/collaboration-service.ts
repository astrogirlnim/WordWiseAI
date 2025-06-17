import { getDatabase, ref, onValue, set, onDisconnect } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import app from '../lib/firebase';

const db = getDatabase(app);
const auth = getAuth(app);

export class CollaborationService {
  static joinDocumentSession(docId: string, user: { id: string, name: string, color: string }) {
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

    onValue(ref(db, '.info/connected'), (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
        set(userStatusDatabaseRef, isOnlineForDatabase);
      });
    });
  }
} 