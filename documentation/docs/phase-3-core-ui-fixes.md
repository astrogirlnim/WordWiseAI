### PR Summary: Core Editor UI Fixes

This document summarizes two critical bug fixes applied to the Core Editor UI, resolving issues with the theme toggle and the autosave indicator.

#### 1. Fixed Non-Functional Theme Toggle

*   **Problem:** The dark/light mode toggle button in the navigation bar was not responsive to user clicks.
*   **Root Cause:** The application's root layout (`app/layout.tsx`) was missing the `ThemeProvider` from `next-themes`.
*   **Solution:** The `ThemeProvider` was added to `app/layout.tsx`, wrapping the entire application. It was configured with the necessary attributes (`attribute="class"`, `defaultTheme="system"`, `enableSystem`) to enable theme persistence and switching, making the toggle fully functional.

#### 2. Fixed Missing Autosave Spinner

*   **Problem:** The autosave spinner and status text ("Saving...") were not appearing in the document status bar during Firestore writes.
*   **Root Cause:** A stale state closure in the `useAutoSave` hook prevented the `onSave` function from receiving the latest document title, and an incorrect function signature stopped the `saving` status from being set.
*   **Solution:** The `useAutoSave` hook was refactored. Its `onSave` prop was changed to accept no arguments, turning the hook into a simple trigger. The `DocumentEditor` now passes a new anonymous function `() => onSave(content, title)`, which ensures the `useAutoSave` hook always calls the save function with the latest state, correctly updating the UI to show the "saving" status. 