# Demo Modal Exit & Redirect Logic

## Overview
This document describes the logic and user experience for exiting the WordWise AI demo modal, including all cases where the user skips, completes, or closes the demo. It covers both authenticated and unauthenticated user flows.

---

## User Experience

- **When a user clicks any of the following in the demo modal:**
  - "Skip Demo" button
  - "Complete Demo" button (on the last step)
  - The "X" (close) button in the top right
- **They are immediately redirected:**
  - **If authenticated:** to the home/dashboard page (`/`)
  - **If not authenticated:** to the sign-in page (`/sign-in`)
- This ensures users never remain in a half-finished or abandoned demo state and always return to a clear entry point.

---

## Technical Implementation

- All exit actions are handled in `components/demo-modal.tsx`:
  - `handleSkipDemo` is called for "Skip Demo" and the "X" button.
  - `handleComplete` is called for "Complete Demo".
- Both handlers:
  - Mark the demo as completed/skipped in state and analytics.
  - Clear the `?demo` URL parameter to prevent auto-reopening.
  - **Redirect:**
    - If `user` is present (from `useAuth()`), call `router.push('/')`.
    - If not, call `router.push('/sign-in')`.
  - Logging is added for all redirects for debugging and analytics.
- The `<Dialog>`'s `onOpenChange` prop is set to call `handleSkipDemo` when the modal is closed via the "X" button or backdrop.

---

## Edge Cases
- If the user is already on the correct page, the redirect is a no-op.
- All redirects are client-side and do not require a full page reload.
- The logic is robust to both manual and programmatic modal closure.

---

## Related Files
- `components/demo-modal.tsx`
- `lib/auth-context.tsx` (for user state)
- `next/navigation` (for router)

---

## Last Updated
2025-06-23 