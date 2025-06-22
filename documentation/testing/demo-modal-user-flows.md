# Demo Modal User Flows - Testing Guide

> **Document Purpose**: Comprehensive testing guide for the WordWise AI demo modal implementation, covering all user flows, expected behaviors, and validation criteria for quality assurance and regression testing.

---

## Overview

The WordWise AI demo modal provides a guided 8-step tour through all major application features. This document outlines three primary user flows and their complete testing procedures to ensure consistent functionality across different user scenarios.

### Demo Modal Features
- **8-Step Guided Tour**: Complete walkthrough of WordWise AI capabilities
- **Multiple Entry Points**: URL parameters, manual triggers, and auto-triggers
- **Comprehensive Navigation**: Sequential, direct jumping, skip options
- **Progress Tracking**: Visual indicators and persistent state management
- **Responsive Design**: Works across desktop, tablet, and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

---

## User Flow 1: Demo Mode (Unauthenticated Users)

### **Description**
Unauthenticated users can access a full demo experience without creating an account by clicking the "Try Demo" button on the sign-in page.

### **Entry Point**
- **Location**: Sign-in page (`/sign-in`)
- **Trigger**: "🚀 Try Demo - No Account Required" button
- **URL Parameter**: Redirects to `/?demo=true`

### **Testing Procedure**

#### **Setup**
1. Ensure Firebase emulators are running (`pnpm emulators:start`)
2. Ensure Next.js dev server is running (`pnpm dev`)
3. Clear browser cache and localStorage
4. Navigate to `http://localhost:3000/sign-in`

#### **Step-by-Step Testing**

**Test 1.1: Demo Button Visibility and Functionality**
1. **Action**: Load sign-in page
2. **Expected**: "🚀 Try Demo - No Account Required" button is prominently displayed
3. **Validation**: 
   - Button has blue-to-purple gradient styling
   - Button is clearly visible in both light and dark mode
   - Button has proper hover effects and transitions

**Test 1.2: Demo Modal Opening**
1. **Action**: Click "Try Demo" button
2. **Expected**: 
   - Redirect to `/?demo=true`
   - Demo modal opens automatically after ~500ms delay
   - Modal shows Step 1 "Document Creation & Goals"
   - Progress bar shows 0% complete
   - URL parameter `?demo=true` is present

**Test 1.3: Sequential Navigation (Next/Back)**
1. **Action**: Click "Next" button
2. **Expected**:
   - Advance to Step 2 "Writing & Content Import"
   - Progress bar updates to 14% complete
   - Back button becomes enabled
   - Content changes to Step 2 information

3. **Action**: Click "Back" button
4. **Expected**:
   - Return to Step 1 "Document Creation & Goals"
   - Progress bar returns to 0% complete
   - Back button becomes disabled
   - Content reverts to Step 1 information

**Test 1.4: Direct Step Navigation**
1. **Action**: Click on Step 5 indicator dot
2. **Expected**:
   - Jump directly to Step 5 "Version Control"
   - Progress bar updates to 57% complete
   - Both Back and Next buttons are enabled
   - Content changes to Step 5 information

**Test 1.5: Skip Step Functionality**
1. **Action**: Click "Skip" button (while on any step 1-7)
2. **Expected**:
   - Advance to next step automatically
   - Progress bar updates accordingly
   - Step is marked as skipped in analytics
   - Navigation continues normally

**Test 1.6: Skip Demo Functionality**
1. **Action**: Click "Skip Demo" button
2. **Expected**:
   - Modal closes immediately
   - Redirect to `/sign-in` (for unauthenticated users)
   - URL parameter `?demo=true` is cleared
   - No re-opening of modal

**Test 1.7: Complete Demo Functionality**
1. **Action**: Navigate to Step 8 and click "Complete Demo"
2. **Expected**:
   - Modal closes with completion animation
   - Return to main application
   - URL parameter `?demo=true` is cleared
   - Demo marked as completed in analytics

**Test 1.8: Close Button (X) Functionality**
1. **Action**: Click the X button in modal header
2. **Expected**:
   - Modal closes immediately
   - Same behavior as "Skip Demo"
   - Proper redirect for unauthenticated users

**Test 1.9: Keyboard Navigation**
1. **Action**: Use keyboard shortcuts
   - `Arrow Right`: Next step
   - `Arrow Left`: Previous step
   - `Escape`: Skip demo
2. **Expected**: All keyboard shortcuts work as expected

**Test 1.10: Responsive Design**
1. **Action**: Test on different screen sizes
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
2. **Expected**: Modal scales appropriately, all content remains accessible

---

## User Flow 2: New User Auto-Trigger

### **Description**
New users who create accounts are automatically shown the demo modal after their first successful sign-in to provide seamless onboarding.

### **Entry Point**
- **Location**: Main application (`/`) after account creation and sign-in
- **Trigger**: Automatic detection of new user with no demo history
- **Timing**: 1-second delay after page load

### **Testing Procedure**

#### **Setup**
1. Ensure Firebase emulators are running
2. Ensure Next.js dev server is running
3. Clear browser cache and localStorage
4. Have a unique email ready for new account creation

#### **Step-by-Step Testing**

**Test 2.1: New User Account Creation**
1. **Action**: Navigate to `/sign-up`
2. **Action**: Create new account with unique email
   - Email: `newuser.test.{timestamp}@example.com`
   - Password: `TestPassword123!`
3. **Expected**: 
   - Account creation successful
   - Automatic redirect to main application
   - User is authenticated

**Test 2.2: Auto-Trigger Detection**
1. **Action**: Wait for page to fully load (1-2 seconds)
2. **Expected**:
   - Demo modal opens automatically
   - Modal starts at Step 1 "Document Creation & Goals"
   - Progress bar shows 0% complete
   - No URL parameter required
   - Console logs show auto-trigger detection

**Test 2.3: Auto-Trigger Timing**
1. **Action**: Monitor console logs during page load
2. **Expected**: See logs in sequence:
   ```
   🔍 [DemoModal] Checking if new user should see demo...
   🎯 [DemoModal] New user detected - starting demo fresh from step 1
   🎯 Demo Tour Action: {action: "START_DEMO", currentStep: 1}
   ```

**Test 2.4: Complete Demo Flow**
1. **Action**: Navigate through all 8 steps using any combination of:
   - Next/Back buttons
   - Direct step jumping
   - Skip individual steps
2. **Expected**: All navigation works identically to User Flow 1

**Test 2.5: Demo Completion Persistence**
1. **Action**: Complete demo or skip demo
2. **Action**: Sign out and sign back in with same account
3. **Expected**: Demo does NOT auto-trigger again (completion persisted)

**Test 2.6: Manual Demo Access After Completion**
1. **Action**: After completing auto-triggered demo, click "Try Demo" in navigation
2. **Expected**: 
   - Demo modal opens manually
   - Starts fresh from Step 1
   - Full functionality available

---

## User Flow 3: Existing User Manual Access

### **Description**
Existing users who have previously used the application can manually access the demo tour via the "Try Demo" button in the navigation bar.

### **Entry Point**
- **Location**: Main application navigation bar
- **Trigger**: "Try Demo" button (Play icon + text)
- **Availability**: Always available for authenticated users

### **Testing Procedure**

#### **Setup**
1. Ensure Firebase emulators are running
2. Ensure Next.js dev server is running
3. Use existing user account or create account and complete initial demo
4. Sign in to main application

#### **Step-by-Step Testing**

**Test 3.1: Manual Demo Button Visibility**
1. **Action**: Load main application as authenticated user
2. **Expected**:
   - "Try Demo" button visible in navigation bar
   - Button positioned between distraction-free mode and theme toggle
   - Proper styling with Play icon and tooltip

**Test 3.2: Manual Demo Trigger**
1. **Action**: Click "Try Demo" button in navigation
2. **Expected**:
   - Demo modal opens immediately
   - Starts fresh from Step 1 (regardless of previous progress)
   - Progress bar shows 0% complete
   - Console logs show manual trigger

**Test 3.3: Manual Demo vs Auto-Trigger Behavior**
1. **Action**: Compare manual demo with auto-triggered demo
2. **Expected**: Identical functionality and behavior
3. **Validation**: Both use `startDemo` action for consistent experience

**Test 3.4: Multiple Manual Accesses**
1. **Action**: Complete demo, then trigger manually again
2. **Expected**: Demo can be accessed multiple times without restrictions

**Test 3.5: Demo State Independence**
1. **Action**: Start manual demo, skip, then start again
2. **Expected**: Each manual start is completely fresh (no state persistence between manual sessions)

---

## Cross-Flow Validation Tests

### **Test CF.1: URL Parameter Consistency**
1. **Action**: Test `/?demo=true` with different user states:
   - Unauthenticated user
   - New authenticated user  
   - Existing authenticated user
2. **Expected**: URL parameter always triggers demo regardless of user state

### **Test CF.2: State Management Consistency**
1. **Action**: Monitor demo state across all three flows
2. **Expected**: All flows use same state management system with consistent behavior

### **Test CF.3: Progress Persistence**
1. **Action**: Test demo progress saving across all flows
2. **Expected**: 
   - Auto-triggered demo progress persists to Firebase
   - Manual demo sessions don't interfere with auto-trigger logic
   - Skip/completion status prevents future auto-triggers

### **Test CF.4: Authentication State Changes**
1. **Action**: Test demo behavior during sign-in/sign-out
2. **Expected**: Demo handles authentication state changes gracefully

---

## Expected Behaviors & Validation Criteria

### **Demo Modal Opening**
- ✅ Modal appears with smooth animation
- ✅ Overlay dims background appropriately
- ✅ Focus management handles properly
- ✅ Scroll is prevented on background

### **Step Content Validation**
Each step should display:
- ✅ Correct step number (1-8) and title
- ✅ Appropriate icon and color theme
- ✅ Educational content with feature lists
- ✅ Pro tips and benefit statistics
- ✅ Proper progress percentage calculation

### **Navigation Control States**
- ✅ **Step 1**: Back button disabled, Next enabled
- ✅ **Steps 2-7**: Both Back and Next enabled
- ✅ **Step 8**: Back enabled, Next replaced with "Complete Demo"
- ✅ **All Steps**: Skip and Skip Demo buttons always available

### **Progress Indicators**
- ✅ Progress bar shows correct percentage (0%, 14%, 28%, 42%, 57%, 71%, 85%, 100%)
- ✅ Step indicator dots show current step highlighted
- ✅ Completed steps show checkmark indicators
- ✅ Future steps show number indicators

### **Responsive Behavior**
- ✅ **Desktop**: Full modal with all features
- ✅ **Tablet**: Slightly smaller modal, all features retained
- ✅ **Mobile**: Compact modal, optimized touch targets

### **Accessibility Requirements**
- ✅ Proper ARIA labels and descriptions
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ High contrast ratios
- ✅ Focus indicators visible

---

## Console Log Validation

### **Expected Console Output Patterns**

**Auto-Trigger Flow**:
```
🔍 [DemoModal] Checking if new user should see demo...
🎯 [DemoModal] New user detected - starting demo fresh from step 1
🎯 Demo Tour Action: {action: "START_DEMO", currentStep: 1, totalSteps: 8}
[DemoModal] Rendering with state: {isOpen: true, currentStep: 1, isCompleted: false}
```

**Manual Trigger Flow**:
```
🎯 Demo Tour Action: {action: "START_DEMO_MANUAL", triggeredBy: "user_button"}
[DemoModal] Rendering with state: {isOpen: true, currentStep: 1, isCompleted: false}
```

**Navigation Actions**:
```
🎯 Demo Tour Action: {action: "NEXT_STEP", fromStep: 1, toStep: 2}
🎯 Demo Tour Action: {action: "GO_TO_STEP", fromStep: 2, toStep: 5}
🎯 Demo Tour Action: {action: "SKIP_STEP", skippedStep: 5}
```

**Completion Actions**:
```
🎯 Demo Tour Action: {action: "COMPLETE_DEMO", totalSteps: 8, completedSteps: [1,2,3,4,5,6,7,8]}
🎯 Demo Tour Action: {action: "SKIP_DEMO", currentStep: 3, completedSteps: [1,2]}
```

---

## Common Issues & Troubleshooting

### **Issue: Demo Modal Not Opening**
**Symptoms**: Button click doesn't trigger modal
**Debugging**:
1. Check console for error messages
2. Verify Firebase emulators are running
3. Check authentication state
4. Verify URL parameters

**Resolution**: Restart emulators and dev server

### **Issue: Demo Starting at Wrong Step**
**Symptoms**: Modal opens at Step 2+ instead of Step 1
**Debugging**:
1. Check console logs for state initialization
2. Verify `startDemo` vs `openDemo` action usage
3. Check localStorage for stale demo progress

**Resolution**: Clear localStorage and ensure `startDemo` action is used

### **Issue: Skip Demo Causes Re-opening**
**Symptoms**: Modal closes then immediately re-opens
**Debugging**:
1. Check useEffect dependencies in DemoModal
2. Verify URL parameter clearing
3. Check skip demo completion status

**Resolution**: Ensure proper skip demo handler implementation

### **Issue: Navigation Buttons Not Working**
**Symptoms**: Next/Back buttons don't change steps
**Debugging**:
1. Check for stale state closures in useDemoTour
2. Verify functional setState updates
3. Check button disabled states

**Resolution**: Ensure functional state updates in navigation actions

---

## Performance Benchmarks

### **Loading Times**
- ✅ **Demo Modal Open**: < 300ms
- ✅ **Step Transitions**: < 200ms
- ✅ **Auto-Trigger Detection**: < 1000ms
- ✅ **Progress Persistence**: < 500ms

### **Memory Usage**
- ✅ **Modal Open**: Minimal memory increase
- ✅ **Step Navigation**: No memory leaks
- ✅ **Modal Close**: Proper cleanup

### **Bundle Impact**
- ✅ **Demo Modal Component**: ~15KB gzipped
- ✅ **Demo Tour Hook**: ~8KB gzipped
- ✅ **Total Impact**: < 25KB additional bundle size

---

## Regression Testing Checklist

When making changes to demo modal functionality, validate:

- [ ] All three user flows work correctly
- [ ] No console errors during any flow
- [ ] Proper state management and persistence
- [ ] Responsive design across all screen sizes
- [ ] Accessibility features remain functional
- [ ] Performance benchmarks are maintained
- [ ] Firebase integration works correctly
- [ ] Authentication state changes handled properly

---

## Future Testing Considerations

### **Additional Test Scenarios**
- **Network Interruption**: Test demo behavior with poor connectivity
- **Browser Compatibility**: Test across Chrome, Firefox, Safari, Edge
- **Device Testing**: Test on actual mobile devices, not just browser simulation
- **Load Testing**: Test with multiple concurrent users
- **Error Scenarios**: Test Firebase connection failures, authentication errors

### **Analytics Validation**
- **Event Tracking**: Verify all demo actions are logged correctly
- **User Journey**: Track complete user journeys through analytics
- **Conversion Metrics**: Measure demo completion rates and user engagement
- **A/B Testing**: Test different demo content or flows

### **Accessibility Audits**
- **Screen Reader Testing**: Test with actual screen reader software
- **Keyboard-Only Navigation**: Complete demo using only keyboard
- **Color Contrast**: Verify WCAG AA compliance
- **Motion Sensitivity**: Test with reduced motion preferences

---

## Conclusion

This testing guide provides comprehensive coverage of all demo modal user flows and functionality. Regular execution of these test procedures ensures consistent, high-quality user experience across all scenarios. The document should be updated whenever new features are added or existing functionality is modified.

**Last Updated**: Current as of demo modal implementation completion
**Next Review**: Update when Phase 4 (Feature Simulation) is implemented 