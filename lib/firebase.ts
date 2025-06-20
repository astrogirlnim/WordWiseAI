import { initializeApp, getApps } from "firebase/app"
import { getDatabase, connectDatabaseEmulator } from "firebase/database"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"
import { env } from "./env"

// More robust check for client-side environment
const isClient = typeof window !== 'undefined' && typeof document !== 'undefined'
const isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined'
const isDevelopment = process.env.NODE_ENV === 'development'

console.log('[Firebase] Environment check:', { isClient, isBuildTime, isDevelopment })

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

// Initialize Firebase only on client-side
let app: any = null
let database: any = null
let firestore: any = null
let auth: any = null
let storage: any = null
let functions: any = null

// Only initialize Firebase when actually running in the browser
if (isClient && !isBuildTime) {
  try {
    console.log('[Firebase] Initializing Firebase client SDK...')
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

    // Initialize Firebase services
    database = getDatabase(app)
    firestore = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)
    functions = getFunctions(app)

    console.log('[Firebase] Firebase services initialized successfully')

    // Connect to emulators in development (only if running in browser)
    if (isDevelopment && window.location.hostname === 'localhost') {
      console.log('[Firebase] Connecting to Firebase emulators...')
      try {
        // Only connect if not already connected
        if (!(auth as any)._config?.emulator) {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
        }
        if (!(firestore as any)._delegate?._databaseId?.projectId?.includes('localhost')) {
          connectFirestoreEmulator(firestore, 'localhost', 8080)
        }
        if (!(database as any)._delegate?._repoInternal?.repoInfo_?.host?.includes('localhost')) {
          connectDatabaseEmulator(database, 'localhost', 9000)
        }
        if (!(storage as any)._delegate?._host?.includes('localhost')) {
          connectStorageEmulator(storage, 'localhost', 9199)
        }
        if (!(functions as any)._delegate?._url?.includes('localhost')) {
          connectFunctionsEmulator(functions, 'localhost', 5001)
        }
        console.log('[Firebase] Connected to Firebase emulators')
      } catch (error) {
        console.warn('[Firebase] Emulator connection failed (may already be connected):', error)
      }
    }
  } catch (error) {
    console.error('[Firebase] Failed to initialize Firebase:', error)
  }
} else {
  console.log('[Firebase] Skipping Firebase initialization (server-side or build time)')
}

// Export with null checks for safer access
export const getFirebaseAuth = () => auth
export const getFirebaseFirestore = () => firestore
export const getFirebaseDatabase = () => database
export const getFirebaseStorage = () => storage
export const getFirebaseFunctions = () => functions

// Maintain backward compatibility
export { database, firestore, auth, storage, functions }
export default app
