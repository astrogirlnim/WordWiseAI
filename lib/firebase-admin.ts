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

export default adminApp
