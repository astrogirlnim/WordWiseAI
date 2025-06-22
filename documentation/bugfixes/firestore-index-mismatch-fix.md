# Firestore Index Mismatch for Funnel Suggestions

This document outlines the diagnosis and resolution of a critical production bug where funnel suggestions failed to load due to a Firestore index mismatch.

## 1. The Problem

Users reported that the "Funnel Suggestions" feature was not working in the production environment. The browser console revealed the following error:

```
[SuggestionService] Error subscribing to funnel suggestions: FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/...
```

This indicated that a Firestore query in the `SuggestionService` was attempting to use a composite index that was not available or enabled in the production Firestore database.

## 2. Investigation and Root Cause Analysis

The investigation revealed a specific conflict between the application's query definition and the deployed Firestore index configuration.

### 2.1. The Query

The query in `services/suggestion-service.ts` was designed to fetch suggestions and sort them by creation date in **descending** order:

```typescript
// services/suggestion-service.ts

const q = query(
  suggestionsRef,
  where('userId', '==', userId),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc') // <-- Required DESCENDING order
);
```

### 2.2. The Deployed Index

Analysis of the Firebase Console showed that the deployed index for the `funnelSuggestions` collection had the `createdAt` field sorted in **ascending** order:

-   **Collection**: `funnelSuggestions`
-   **Fields**:
    -   `userId`: Ascending
    -   `status`: Ascending
    -   `createdAt`: **Ascending**  *(Mismatch)*

This mismatch was the root cause of the `failed-precondition` error. The application requested a sort order that the production database's index could not support. This likely occurred when an engineer clicked the "auto-create" link in the Firebase error console, which defaults to creating all fields with an ascending sort order.

## 3. The Solution

To resolve this issue without requiring manual intervention in the Firebase Console, a code-based solution was implemented. This approach adapts the application to the existing production infrastructure.

### 3.1. Adapt the Query to the Index

The Firestore query in `services/suggestion-service.ts` for both `subscribeToSuggestions` and `subscribeToFunnelSuggestions` was modified to match the existing index. The `orderBy` clause was changed from `'desc'` to `'asc'`.

**Before:**
```typescript
orderBy('createdAt', 'desc')
```

**After:**
```typescript
orderBy('createdAt', 'asc')
```

### 3.2. Reverse the Results on the Client

Changing the query order meant that Firestore would return results from oldest to newest. To preserve the application's business logic (displaying newest suggestions first), the resulting array was reversed on the client-side before being passed to the UI.

**Before:**
```typescript
onUpdate(suggestions)
```

**After:**
```typescript
onUpdate(suggestions.reverse())
```

### 3.3. Update Index Configuration File

Finally, the `firestore.indexes.json` file was updated to reflect the actual state of the production indexes. The `createdAt` field's order was changed to `ASCENDING` to ensure that the configuration file remains the single source of truth for the project's infrastructure.

## 4. Conclusion

This fix resolves the production bug by aligning the application's code with the deployed Firestore indexes. This robust workaround avoids manual database changes and ensures that the funnel suggestions feature is once again fully functional for all users. The fix has been deployed, and the functionality is verified as working. 