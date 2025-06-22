require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');

// Firebase configuration for testing
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

// Test script to call Firebase function through emulator
async function testFirebaseFunction() {
  console.log('🔥 Testing Firebase Function through Emulator...');
  console.log('Project ID:', firebaseConfig.projectId);
  
  if (!firebaseConfig.projectId) {
    console.error('❌ Firebase configuration missing');
    return;
  }

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app, 'us-central1');
    
    // Connect to emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔌 Connected to Functions emulator on localhost:5001');

    // Test data
    const testData = {
      documentId: 'test-doc-123',
      goals: {
        domain: 'marketing-copy',
        audience: 'consumers',
        formality: 'professional',
        intent: 'persuade'
      },
      currentDraft: '# Elevate Your Brand Today ## Discover proven strategies to enhance your brand\'s visibility and consumer engagement. **Start Now** 1. Hook: Elevate your brand visibility instantly 2. Problem: Common struggles with consumer engagement 3. Solution: Implement our effective marketing strategies 4. Benefits: Achieve superior brand recognition 5. Social Proof: Hear success stories from satisfied clients 6. Call to Action: Take action today',
      documentTitle: 'Test Grammar'
    };

    console.log('📄 Test document length:', testData.currentDraft.length);
    console.log('🎯 Test goals:', JSON.stringify(testData.goals, null, 2));

    // Call the function
    console.log('\n🚀 Calling generateFunnelSuggestions function...');
    const generateFunnelSuggestions = httpsCallable(functions, 'generateFunnelSuggestions');
    
    const result = await generateFunnelSuggestions(testData);
    const response = result.data;

    console.log('\n📋 === FIREBASE FUNCTION RESPONSE ===');
    console.log('Success:', !!response.suggestions);
    console.log('Suggestions count:', response.suggestions?.length || 0);
    console.log('Generated at:', response.generatedAt);
    console.log('Based on goals:', response.basedOnGoals);

    console.log('\n🔍 === DETAILED SUGGESTIONS ANALYSIS ===');
    response.suggestions?.forEach((suggestion, index) => {
      console.log(`\n📝 Suggestion ${index + 1} (${suggestion.type}):`);
      console.log(`  ID: ${suggestion.id}`);
      console.log(`  Title: ${suggestion.title}`);
      console.log(`  Text: ${suggestion.suggestedText}`);
      console.log(`  Confidence: ${suggestion.confidence}%`);
      console.log(`  Status: ${suggestion.status}`);
      
      // Check for positioning data
      console.log(`  Has positioning: ${!!suggestion.positioning}`);
      if (suggestion.positioning) {
        console.log(`  ✅ Strategy: ${suggestion.positioning.strategy}`);
        console.log(`  ✅ Location: ${suggestion.positioning.location}`);
        console.log(`  ✅ Preserve existing: ${suggestion.positioning.preserveExisting}`);
        console.log(`  ✅ Insertion point: ${suggestion.positioning.insertionPoint}`);
        if (suggestion.positioning.targetText) {
          console.log(`  ✅ Target text: "${suggestion.positioning.targetText}"`);
        }
      } else {
        console.log(`  ❌ MISSING POSITIONING FIELD!`);
      }
      
      // Check legacy position field
      console.log(`  Legacy position: ${suggestion.position || 'N/A'}`);
    });

    // Test what the document editor would receive
    console.log('\n🎯 === DOCUMENT EDITOR TEST ===');
    response.suggestions?.forEach((suggestion, index) => {
      console.log(`\nTesting suggestion ${index + 1} application:`);
      
      if (suggestion.positioning) {
        console.log(`  Would use NEW positioning logic:`);
        console.log(`    Strategy: ${suggestion.positioning.strategy}`);
        console.log(`    Location: ${suggestion.positioning.location}`);
        console.log(`    Target: "${suggestion.positioning.targetText || 'N/A'}"`);
      } else {
        console.log(`  Would use LEGACY positioning logic:`);
        console.log(`    Position: ${suggestion.position || 'document-end'}`);
        console.log(`    ⚠️  This could cause content replacement!`);
      }
    });

    console.log('\n✅ Firebase function test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Firebase function:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
  }
}

// Wait for emulators to start, then run test
setTimeout(() => {
  console.log('⏰ Waiting for emulators to initialize...');
  testFirebaseFunction().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}, 5000); // Wait 5 seconds for emulators to start 