# Demo Modal User Flows - Testing Guide

## Overview
This document outlines the testing procedures for the demo modal functionality across different user types and scenarios. The demo modal should provide a guided tour of WordWise AI features while respecting user preferences and ensuring optimal UX.

## ✅ Testing Status: UPDATED FOR PHASE 4, STEP 1
**Test Date**: 2025-01-27  
**Environment**: Local development with Firebase integration  
**Status**: Updated to verify Phase 4, Step 1 implementation  

## Test Environment Setup

### Prerequisites
- Firebase emulators running (`pnpm emulators:start`)
- Development server running (`pnpm dev`)
- Clean browser session (clear localStorage/cookies between user flow tests)
- Developer console open to monitor logging

### Test Users
- **Anonymous User**: Not signed in (demo mode)
- **New User**: First-time signup (authenticated user flow)
- **Existing User**: Previously signed up (authenticated user flow)

## 🔄 User Flow 1: Anonymous User (Demo Mode) - PHASE 4, STEP 1 TESTING

### Test Steps

#### Basic Demo Access
1. Navigate to sign-in page (`/sign-in`)
2. Click "🚀 Try Demo - No Account Required" button
3. Verify redirect to `/?demo=true`
4. Verify demo modal opens to Step 1 with "Document Creation & Goals" title

#### Phase 4, Step 1 - Demo Mode Verification
5. **User Type Detection**: 
   - Check console logs for: `🎯 [Demo Step 1] Rendering with user type: demo_mode`
   - Verify "Demo Mode Active" blue info box is displayed
   - Verify step content shows demo-specific messaging

6. **Set Writing Goals Action**:
   - Click "Set Writing Goals" button
   - Verify button shows loading state: "Creating Sample Document..."
   - Check console logs for: `🎯 [Demo Step 1] Demo mode - simulating document creation with sample data`

7. **Automatic Document Creation Simulation**:
   - Verify loading animation appears for ~1.5 seconds
   - Check console logs for: `🎯 [Demo Step 1] Demo simulation: Writing goals modal opened with sample data`
   - Verify button changes to "Sample Created!" with check icon
   - Verify green success message appears: "Sample document created with writing goals! Moving to next step..."

8. **Auto-Advancement**:
   - Verify step automatically advances to Step 2 after ~2 seconds
   - Check console logs for: `🎯 [Demo Step 1] Demo mode - step completed and advanced`
   - Verify progress bar updates from 0% to 14%

9. **Sample Data Verification**:
   - Navigate back to Step 1 using step indicators
   - Click "Set Writing Goals" again if needed
   - Verify writing goals modal opens with sample data pre-populated:
     - Document title: "Sales Funnel Strategy - Demo Document"
     - Audience: "Stakeholders" selected
     - Formality: "Professional" selected
     - Domain: "Marketing Copy" selected
     - Intent: "Convert" selected
   - Verify "Demo Mode" badge appears in modal header

#### Additional Navigation Testing
10. Test navigation controls:
    - Click "Next" to advance steps
    - Click "Back" to go to previous steps
    - Click step indicators for direct navigation
    - Test "Skip" individual step functionality
11. Test modal controls:
    - "Skip Demo" button closes modal
    - "Close" (X) button closes modal
12. After closing, verify "Try Demo" button can retrigger the demo

### ✅ Expected Results for Anonymous Users
- **✅ User Type Detection**: Correctly identified as `demo_mode`
- **✅ Demo UI**: Shows demo-specific messaging and blue info box
- **✅ Sample Data**: Writing goals modal pre-populated with sample data
- **✅ Auto-Advancement**: Step completes and advances automatically
- **✅ No Firebase Writes**: No real documents created in Firestore
- **✅ Comprehensive Logging**: All actions logged with demo context

## 🔄 User Flow 2: New User (First-time Signup) - PHASE 4, STEP 1 TESTING

### Test Steps

#### Account Creation and Auto-Trigger
1. Navigate to sign-up page (`/sign-up`)
2. Create account with unique email (e.g., `newuser.demo.test.$(Date.now())@example.com`)
3. After successful signup and redirect to main app:
   - Wait 3-5 seconds for auto-trigger logic
   - Verify demo modal appears automatically on Step 1

#### Phase 4, Step 1 - Authenticated User Verification
4. **User Type Detection**:
   - Check console logs for: `🎯 [Demo Step 1] Rendering with user type: authenticated_user`
   - Verify "Guided Tour" amber info box is displayed (not "Demo Mode")
   - Verify step content shows guidance messaging without demo-specific content

5. **Set Writing Goals Action**:
   - Click "Set Writing Goals" button
   - Verify button shows loading state: "Highlighting UI..."
   - Check console logs for: `🎯 [Demo Step 1] Authenticated user - highlighting UI only`

6. **UI Spotlight Activation**:
   - Wait ~1 second for spotlight to activate
   - Check console logs for: `🎯 [DocumentContainer] Activating spotlight for Writing Goals button`
   - Verify UI spotlight appears over the "Writing Goals" button in navigation bar
   - Verify spotlight tooltip shows:
     - Title: "Writing Goals"
     - Description: "Click here to set your writing goals and target audience..."
     - Action button: "Open Writing Goals"

7. **Spotlight Interaction**:
   - Verify spotlight is visible with dark overlay
   - Verify Writing Goals button is highlighted/elevated
   - Click the spotlight action button or the highlighted Writing Goals button
   - Verify actual Writing Goals modal opens (not pre-populated)
   - Verify modal shows real user interface without demo badge
   - Close the Writing Goals modal

8. **Step Completion**:
   - Verify spotlight disappears after interaction
   - Check console logs for: `🎯 [DocumentContainer] Completing Step 1 and advancing to Step 2`
   - Verify step advances to Step 2 automatically
   - Verify progress bar updates from 0% to 14%

9. **No Data Modification**:
   - Verify no real documents are created
   - Verify no real writing goals are modified
   - Verify user's actual data remains unchanged

#### Additional Testing
10. **Keyboard Accessibility**:
    - Press Escape while spotlight is active
    - Verify spotlight closes properly
    - Tab through spotlight elements to test focus management

11. Test remaining demo functionality and manual access

### ✅ Expected Results for New Users
- **✅ User Type Detection**: Correctly identified as `authenticated_user`
- **✅ Guided Tour UI**: Shows guidance messaging without demo-specific content
- **✅ UI Spotlight**: Highlights actual UI elements for guidance
- **✅ Real Modal**: Opens actual Writing Goals modal without pre-populated data
- **✅ No Data Changes**: No modification of real user data
- **✅ Step Advancement**: Completes and advances to Step 2

## 🔄 User Flow 3: Existing User (Return Visitor) - PHASE 4, STEP 1 TESTING

### Test Steps

#### Sign-in and Manual Demo Access
1. Sign in with existing account (that has previously seen demo)
2. After login, wait and verify demo does NOT auto-appear
3. Click "Try Demo" button in navigation bar
4. Verify demo opens to Step 1

#### Phase 4, Step 1 - Existing Authenticated User Verification
5. **User Type Detection**:
   - Check console logs for: `🎯 [Demo Step 1] Rendering with user type: authenticated_user`
   - Verify "Guided Tour" amber info box is displayed
   - Verify same behavior as new user flow (steps 4-9 from User Flow 2)

6. **Consistent Authenticated Behavior**:
   - Verify UI spotlight system works identically to new user flow
   - Verify no data modification occurs
   - Verify step completion and advancement works properly

7. **Previous Demo Progress**:
   - Check console logs for Firebase demo progress loading
   - Verify previous demo completion status is respected
   - Verify manual demo access always works regardless of previous progress

### ✅ Expected Results for Existing Users
- **✅ No Auto-Trigger**: Demo doesn't auto-appear for existing users
- **✅ Manual Access**: "Try Demo" always works
- **✅ Consistent Behavior**: Same authenticated user flow as new users
- **✅ Progress Respect**: Previous demo completion status maintained

## Demo Modal Phase 4, Step 1 Feature Testing

### ✅ User Type Detection Testing
**Test**: Verify correct user type identification across all scenarios

**Steps**:
1. **Anonymous/Demo Mode**: 
   - URL contains `demo=true` and no user authentication
   - Expected logs: `userType: 'demo_mode'`

2. **Authenticated Users**: 
   - User is signed in (new or existing)
   - Expected logs: `userType: 'authenticated_user'`

3. **Edge Cases**:
   - User signs out during demo
   - User signs in during demo
   - Browser refresh scenarios

### ✅ UI Spotlight System Testing
**Test**: Verify spotlight functionality for authenticated users

**Steps**:
1. **Element Targeting**:
   - Verify spotlight finds `[data-writing-goals-button]` element
   - Check console logs for: `🎯 [UISpotlight] Target element found`
   - Verify element scrolls into view if needed

2. **Tooltip Positioning**:
   - Test on different screen sizes (desktop, tablet, mobile)
   - Verify auto-positioning works (top, bottom, left, right)
   - Check responsive behavior

3. **Accessibility**:
   - Test keyboard navigation (Tab, Enter, Escape)
   - Verify ARIA labels and screen reader compatibility
   - Test focus management

4. **Portal Rendering**:
   - Verify spotlight renders in portal for proper z-index
   - Test overlay interactions

### ✅ Sample Data Integration Testing
**Test**: Verify sample data is properly loaded and typed

**Steps**:
1. **Data Source Verification**:
   - Check `DEMO_SAMPLE_DATA` in console
   - Verify all required fields are present:
     - `sampleGoals` (properly typed WritingGoals)
     - `sampleDocumentTitle`
     - `sampleDocument` content

2. **Type Safety**:
   - Verify no TypeScript errors in browser console
   - Check that const assertions work properly
   - Verify WritingGoals interface compliance

3. **Modal Integration**:
   - Verify sample data populates correctly in demo mode
   - Verify no sample data appears for authenticated users
   - Test modal reset and re-population

### ✅ Logging and Analytics Testing
**Test**: Verify comprehensive logging for all user actions

**Steps**:
1. **Check Required Log Messages**:
   ```javascript
   // User type detection
   🎯 [Demo Step 1] Rendering with user type: {userType}
   
   // Action triggers
   🎯 [Demo Step 1] Set Writing Goals action triggered for user type: {userType}
   
   // Demo simulation
   🎯 [Demo Step 1] Demo mode - simulating document creation with sample data
   
   // UI highlighting
   🎯 [DocumentContainer] Activating spotlight for Writing Goals button
   
   // Step completion
   🎯 [DocumentContainer] Completing Step 1 and advancing to Step 2
   ```

2. **Analytics Data**:
   - Verify demo actions are logged with proper context
   - Check user type is included in all relevant logs
   - Verify timing data is captured

### ✅ Firebase Integration Testing
**Test**: Verify proper Firebase behavior for all user types

**Steps**:
1. **Demo Mode (Anonymous)**:
   - Verify NO Firestore writes occur
   - Check that demo progress is NOT saved to Firebase
   - Verify localStorage-only tracking

2. **Authenticated Users**:
   - Verify demo progress IS saved to Firebase
   - Check that real user data is NOT modified
   - Verify read-only demo behavior

3. **Error Handling**:
   - Test with Firebase offline
   - Verify graceful degradation

## Performance and Technical Validation

### ✅ Performance Metrics - Phase 4, Step 1
- **User Type Detection**: < 50ms
- **UI Spotlight Activation**: < 1000ms (includes 1s delay)
- **Sample Data Population**: < 100ms
- **Step Transition**: < 500ms
- **Modal Operations**: < 200ms

### ✅ Browser Compatibility Testing
Test Phase 4, Step 1 features across:
- **Chrome** (latest): All spotlight and demo features
- **Safari** (latest): Portal rendering and positioning
- **Firefox** (latest): Event handling and accessibility
- **Mobile Safari**: Touch interactions and responsive layout
- **Mobile Chrome**: Spotlight positioning on small screens

### ✅ Error Handling Testing
1. **Missing UI Elements**: Test spotlight when target element doesn't exist
2. **Network Issues**: Test with poor connectivity during Firebase operations
3. **State Conflicts**: Test rapid user interactions during spotlight activation
4. **Memory Management**: Test for memory leaks during repeated demo runs

## Issues and Troubleshooting

### Common Issues to Verify
1. **Spotlight Not Appearing**: 
   - Check if target element exists: `document.querySelector('[data-writing-goals-button]')`
   - Verify user type detection is working
   - Check console for UISpotlight logs

2. **Sample Data Not Loading**:
   - Verify DEMO_SAMPLE_DATA is accessible
   - Check demo mode detection logic
   - Verify WritingGoals modal integration

3. **Step Not Advancing**:
   - Check demo tour context state
   - Verify action completion logging
   - Test manual step advancement

### Debug Console Commands
```javascript
// Check demo state
window.localStorage.getItem('demoTourLogs')

// Verify sample data
console.log(window.DEMO_SAMPLE_DATA) // if exposed globally

// Check UI elements
document.querySelector('[data-writing-goals-button]')
document.querySelector('[data-new-document-button]')
document.querySelector('[data-new-document-button-main]')
```

## Test Results Summary Template

### Phase 4, Step 1 Test Results
**Date**: _____  
**Environment**: _____  
**Tester**: _____

#### User Type Detection
- [ ] Anonymous/Demo mode detection working
- [ ] Authenticated user detection working  
- [ ] Edge cases handled properly

#### UI Spotlight System  
- [ ] Element targeting working
- [ ] Tooltip positioning responsive
- [ ] Accessibility features working
- [ ] Portal rendering correct

#### Sample Data Integration
- [ ] Demo mode auto-population working
- [ ] Authenticated mode guidance working
- [ ] Type safety maintained

#### Logging and Analytics
- [ ] All required logs present
- [ ] User type context included
- [ ] Timing data captured

#### Firebase Integration
- [ ] Demo mode: no Firestore writes
- [ ] Authenticated: proper progress tracking
- [ ] Error handling graceful

**Overall Status**: [ ] PASS / [ ] FAIL  
**Notes**: _____

---

**Last Updated**: 2025-01-27  
**Phase**: 4, Step 1 Implementation Testing  
**Status**: Ready for verification testing 🧪 