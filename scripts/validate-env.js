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
  
  // Additional required variables
  'OPENAI_API_KEY'
];

console.log('🔍 Validating environment variables...\n');

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
  console.log('✅ Environment validation passed - ready to start application');
  process.exit(0);
} 