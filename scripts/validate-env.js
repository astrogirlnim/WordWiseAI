#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates all required Firebase environment variables are present
 * Used as prestart script to catch configuration issues early
 */

// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const requiredFirebaseVars = [
  // Firebase Client Configuration (Public)
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  
  // Firebase Admin Configuration (Server-side)
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL', 
  'FIREBASE_ADMIN_PRIVATE_KEY',
  
  // Additional variables - OpenAI API Key removed from required since Harper.js migration
];

// Optional variables that enhance functionality but aren't required for core operation
const optionalVars = [
  'OPENAI_API_KEY' // Optional since Harper.js migration: for AI suggestions, style suggestions, and funnel generation (not needed for grammar checking)
];

// Detect environment mode
const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';

console.log('🔍 Validating environment variables...\n');

// Display environment mode
console.log(`🌍 Environment: ${nodeEnv.toUpperCase()}`);
if (isDevelopment) {
  console.log('🚧 Development Mode: Firebase emulators will be used');
  console.log('   ✅ Safe for local development - no production data access');
} else {
  console.log('🚀 Production Mode: Connecting to live Firebase services');
  console.log('   ⚠️  Will connect to production Firebase project');
}
console.log('');

let missingVars = [];
let presentVars = [];

// Check each required variable
requiredFirebaseVars.forEach(varName => {
  console.log(`Checking ${varName}...`);
  
  if (!process.env[varName]) {
    console.log(`❌ Missing: ${varName}`);
    missingVars.push(varName);
  } else {
    console.log(`✅ Present: ${varName}`);
    presentVars.push(varName);
  }
});

console.log(`\n📊 Validation Summary:`);
console.log(`✅ Present: ${presentVars.length}/${requiredFirebaseVars.length}`);
console.log(`❌ Missing: ${missingVars.length}/${requiredFirebaseVars.length}`);

if (missingVars.length > 0) {
  console.log('\n🚨 VALIDATION FAILED!');
  console.log('\nMissing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  
  console.log('\n💡 How to fix:');
  console.log('1. Create a .env.local file in the project root');
  console.log('2. Add the missing variables with their values');
  console.log('3. Check env.example for reference values');
  console.log('4. Ensure Firebase project is properly configured');
  
  process.exit(1);
} else {
  console.log('\n🎉 All environment variables are present!');
  
  // Enhanced development mode guidance
  if (isDevelopment) {
    console.log('\n🔧 Development Mode Setup:');
    console.log('✅ Environment validation passed');
    console.log('📋 Next steps for safe local development:');
    console.log('   1. Start Firebase emulators: firebase emulators:start');
    console.log('   2. Emulators will run on these ports:');
    console.log('      • Auth: http://localhost:9099');
    console.log('      • Firestore: http://localhost:8080');
    console.log('      • Realtime DB: http://localhost:9000');
    console.log('      • Storage: http://localhost:9199');
    console.log('      • Functions: http://localhost:5001');
    console.log('      • UI: http://localhost:4000');
    console.log('   3. Your app will automatically connect to emulators');
    console.log('   4. All data is local and isolated from production');
    console.log('\n🛡️  Safety: Emulators provide complete isolation from production Firebase');
  } else {
    console.log('\n🚀 Production Mode Setup:');
    console.log('✅ Environment validation passed');
    console.log('⚠️  WARNING: Application will connect to LIVE Firebase services');
    console.log('📋 Production checklist:');
    console.log('   • Ensure Firebase security rules are properly configured');
    console.log('   • Verify all environment variables point to correct project');
    console.log('   • Double-check Firebase project ID and configuration');
    console.log('   • Monitor Firebase usage and billing');
  }
  
  console.log('\n✅ Ready to start application');
  process.exit(0);
} 