import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getFirestore } from 'firebase-admin/firestore'
import { env } from './env'

const firebaseAdminConfig = {
  credential: cert({
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

// Initialize Firebase Admin
const adminApp =
  getApps().length === 0
    ? initializeApp(firebaseAdminConfig, 'admin')
    : getApps()[0]

// Initialize Firebase Admin services
export const adminDatabase = getDatabase(adminApp)
export const adminFirestore = getFirestore(adminApp)

// NOTE: Admin SDK intentionally does NOT connect to emulators to avoid bypassing security rules
// Admin SDK has full access and bypasses all security rules by design
// Only connect to emulators when specifically testing server-side functions
// If needed for server-side testing, use: adminDatabase.useEmulator('localhost', 9000)

console.log('[Firebase Admin] Initialized for server-side operations (no emulator connection)')

export default adminApp
