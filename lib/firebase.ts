import { initializeApp, getApps } from "firebase/app"
import { getDatabase, connectDatabaseEmulator } from "firebase/database"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"
import { clientEnv } from "./env"

// Initialize Firebase
const firebaseConfig = {
  apiKey: clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: clientEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: clientEnv.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

// Enhanced logging for debugging deployment issues
console.log('📊 Firebase Configuration Debug:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  hasDatabaseURL: !!firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  environment: process.env.NODE_ENV,
})

// Validate critical configuration
if (!firebaseConfig.projectId) {
  throw new Error('❌ Firebase Configuration Error: Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID')
}
if (!firebaseConfig.databaseURL) {
  throw new Error('❌ Firebase Configuration Error: Missing NEXT_PUBLIC_FIREBASE_DATABASE_URL')
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

console.log('✅ Firebase App initialized successfully:', app.name)

// Initialize Firebase services with error handling
export const database = (() => {
  try {
    const db = getDatabase(app)
    console.log('✅ Firebase Database initialized')
    return db
  } catch (error) {
    console.error('❌ Firebase Database initialization failed:', error)
    throw error
  }
})()

export const firestore = (() => {
  try {
    const fs = getFirestore(app)
    console.log('✅ Firestore initialized')
    return fs
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error)
    throw error
  }
})()

export const auth = (() => {
  try {
    const authInstance = getAuth(app)
    console.log('✅ Firebase Auth initialized')
    return authInstance
  } catch (error) {
    console.error('❌ Firebase Auth initialization failed:', error)
    throw error
  }
})()

export const storage = (() => {
  try {
    const storageInstance = getStorage(app)
    console.log('✅ Firebase Storage initialized')
    return storageInstance
  } catch (error) {
    console.error('❌ Firebase Storage initialization failed:', error)
    throw error
  }
})()

export const functions = (() => {
  try {
    const functionsInstance = getFunctions(app)
    console.log('✅ Firebase Functions initialized')
    return functionsInstance
  } catch (error) {
    console.error('❌ Firebase Functions initialization failed:', error)
    throw error
  }
})()

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(firestore, 'localhost', 8080)
    connectDatabaseEmulator(database, 'localhost', 9000)
    connectStorageEmulator(storage, 'localhost', 9199)
    connectFunctionsEmulator(functions, 'localhost', 5001)
    console.log('🔧 Firebase emulators connected')
  } catch (error) {
    console.warn('⚠️ Firebase emulator connection failed (this is normal in production):', error instanceof Error ? error.message : String(error))
  }
}

export default app
