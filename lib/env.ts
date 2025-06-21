// Environment variable validation with detailed error messages
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`)
  }
  return value
}

// Check if we're running on the server or client
const isServer = typeof window === 'undefined'

// Log environment variable status for debugging (server-side only)
if (isServer) {
  console.log('🔍 Environment Variables Debug (Server):', {
    NODE_ENV: process.env.NODE_ENV,
    hasFirebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasFirebaseDatabaseUrl: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    hasFirebaseAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    hasFirebaseStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    hasFirebaseAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    hasFirebaseMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    hasFirebaseAdminProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
    hasFirebaseAdminClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    hasFirebaseAdminPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    hasOpenAiApiKey: !!process.env.OPENAI_API_KEY,
  })
} else {
  console.log('🔍 Environment Variables Debug (Client):', {
    NODE_ENV: process.env.NODE_ENV,
    hasFirebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasFirebaseDatabaseUrl: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    hasFirebaseAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    hasFirebaseStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    hasFirebaseAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    hasFirebaseMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  })
}

// Client-side environment variables (always available)
export const clientEnv = {
  // Firebase Configuration (public)
  NEXT_PUBLIC_FIREBASE_API_KEY: validateEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: validateEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: validateEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: validateEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: validateEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  NEXT_PUBLIC_FIREBASE_APP_ID: validateEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: validateEnvVar('NEXT_PUBLIC_FIREBASE_DATABASE_URL', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
}

// Server-side environment variables (only available on server)
export const serverEnv = isServer ? {
  // Firebase Admin (for server-side)
  FIREBASE_ADMIN_PROJECT_ID: validateEnvVar('FIREBASE_ADMIN_PROJECT_ID', process.env.FIREBASE_ADMIN_PROJECT_ID),
  FIREBASE_ADMIN_CLIENT_EMAIL: validateEnvVar('FIREBASE_ADMIN_CLIENT_EMAIL', process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
  FIREBASE_ADMIN_PRIVATE_KEY: validateEnvVar('FIREBASE_ADMIN_PRIVATE_KEY', process.env.FIREBASE_ADMIN_PRIVATE_KEY),

  // OpenAI API Key
  OPENAI_API_KEY: validateEnvVar('OPENAI_API_KEY', process.env.OPENAI_API_KEY),
} : {}

// Legacy export for backward compatibility (use clientEnv and serverEnv instead)
export const env = {
  ...clientEnv,
  ...(isServer ? serverEnv : {}),
}

if (isServer) {
  console.log('✅ All environment variables validated successfully (Server)')
} else {
  console.log('✅ Client environment variables validated successfully')
}
