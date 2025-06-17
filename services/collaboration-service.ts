import { database } from "@/lib/firebase";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { Document } from "@/types/document";

// For this MVP, we'll use a simple last-write-wins strategy.
// A full CRDT or OT implementation is a larger effort.

export function syncDocument(docId: string, onUpdate: (content: string) => void) {
  const docRef = ref(database, `documents/${docId}/content`);
  onValue(docRef, (snapshot) => {
    const content = snapshot.val();
    if (content !== null) {
      onUpdate(content);
    }
  });

  return (newContent: string) => {
    set(docRef, newContent);
  };
}

export interface UserPresence {
  id: string;
  name: string;
  color: string; // e.g., a hex code
  cursorPosition: number;
}

export function syncPresence(docId: string, user: UserPresence) {
  const presenceRef = ref(database, `documents/${docId}/presence/${user.id}`);
  set(presenceRef, user);
  onDisconnect(presenceRef).remove();

  return (newPosition: number) => {
    set(ref(database, `documents/${docId}/presence/${user.id}/cursorPosition`), newPosition);
  };
}

export function getPresence(docId: string, onUpdate: (users: UserPresence[]) => void) {
    const presenceRef = ref(database, `documents/${docId}/presence`);
    onValue(presenceRef, (snapshot) => {
        const presence = snapshot.val();
        if (presence) {
            onUpdate(Object.values(presence));
        }
    });
} 