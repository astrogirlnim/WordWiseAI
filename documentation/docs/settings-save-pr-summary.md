# PR Summary: Feat(Settings): Implement User Preferences Saving and Dynamic Name Update

## Overview

This pull request introduces functionality to the settings page, enabling users to save their profile information and writing preferences. A key feature of this update is the real-time update of the user's display name in the navigation bar upon saving changes. This enhancement improves user experience by providing immediate feedback and persistent settings.

## Key Changes

### 1. **Enabled Saving of User Preferences**
- **File Modified:** `components/user-preferences-form.tsx`
- The `handleSave` function was updated to persist the user's profile data, including their name, role, and writing preferences, to the Firestore database.
- Integrated `useToast` to provide users with clear success or error notifications upon attempting to save their preferences.

### 2. **Dynamic User Name Update in Navigation**
- **File Modified:** `lib/auth-context.tsx`
- Added an `updateUserProfile` function to the `AuthContext` to update the `displayName` property in Firebase Authentication. This ensures that the user's name is updated across the application.
- When a user saves a new name in their profile, the `handleSave` function now calls `updateUserProfile` to sync the change with Firebase Auth, which is then reflected in the navigation bar.

### 3. **Toast Notification System**
- **File Modified:** `app/layout.tsx`
- Added the `<Toaster />` component to the root layout, enabling app-wide toast notifications.
- **File Deleted:** `components/ui/use-toast.ts`
- Removed a duplicate `use-toast.ts` file to consolidate the toast logic into `hooks/use-toast.ts`, ensuring a single source of truth and reducing code redundancy.
- Updated the import path in `components/user-preferences-form.tsx` to use the correct `useToast` hook.

## How to Verify
1. Navigate to the **/settings** page.
2. Modify the **Name** field under **Profile Information**.
3. Adjust any of the settings under **Writing Preferences**.
4. Click the **Save Preferences** button.
5. **Observe:** A toast notification should appear confirming that the settings have been saved.
6. **Verify:** The name displayed in the user menu in the top-right corner of the navigation bar should update to the new name immediately.
7. Refresh the page and return to the **/settings** page to confirm that all changes have been successfully persisted. 