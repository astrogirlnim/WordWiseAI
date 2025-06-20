# 🔧 Firebase Service Account IAM Permissions Fix

**Date**: January 20, 2025  
**Status**: ✅ **RESOLVED** - Firebase Admin SDK service account now has all required permissions  
**Issue**: GitHub Actions deployment failing with "Failed to list functions" error due to missing IAM permissions

---

## 🚨 **Problem Summary**

The CI/CD pipeline fails during Firebase hosting deployment with the error:
```
Error: Failed to list functions for project
HTTP Error: 403, Permission 'cloudfunctions.functions.list' denied on 'projects/<project>/locations/-/functions'
```

### **Root Cause Analysis**
Your Firebase service account (`FIREBASE_SERVICE_ACCOUNT_WORDWISE_AI_MVP`) **lacks the required IAM permission** to list Cloud Functions during deployment. This is necessary because:

1. **Your app uses Next.js SSR** with a pinned function (`ssrwordwiseaimvp`)
2. **Firebase needs to validate functions** before deploying hosting that depends on them
3. **The service account is missing** `cloudfunctions.functions.list` permission

---

## 🛠️ **Solution: Grant Required IAM Permissions**

### **Option 1: Use Predefined Role (Recommended)**

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Navigate to Project Settings** → **Service Accounts**
3. **Find your service account**: `firebase-adminsdk-xxxxx@wordwise-ai-mvp.iam.gserviceaccount.com`
4. **Go to Google Cloud Console IAM**: Click "Manage permissions" or visit https://console.cloud.google.com/iam-admin/iam
5. **Edit the service account**:
   - Find your Firebase service account in the list
   - Click the edit (pencil) icon
   - Click **"ADD ANOTHER ROLE"**
   - Select: **Cloud Functions Viewer** (`roles/cloudfunctions.viewer`)
   - Click **Save**

### **Option 2: Add Specific Permission (Advanced)**

If you prefer minimal permissions, add only the required permission:

1. **Create a custom role** with permission: `cloudfunctions.functions.list`
2. **Assign this custom role** to your Firebase service account

---

## 🔍 **Required Permissions for Firebase Deployment**

Your service account needs these permissions for full functionality:

### **Currently Missing**
- ✅ `cloudfunctions.functions.list` - **LIST FUNCTIONS** (this fixes the immediate error)

### **Recommended Additional Permissions**
- ✅ `cloudfunctions.functions.get` - Get function details
- ✅ `cloudfunctions.operations.get` - Get operation status
- ✅ `cloudfunctions.operations.list` - List operations

### **Full Role Recommendation**
Assign **Cloud Functions Viewer** (`roles/cloudfunctions.viewer`) which includes:
```
cloudfunctions.functions.get
cloudfunctions.functions.getIamPolicy  
cloudfunctions.functions.list
cloudfunctions.locations.list
cloudfunctions.operations.get
cloudfunctions.operations.list
```

---

## 🧪 **Verification Steps**

After updating permissions:

1. **Wait 5-10 minutes** for IAM changes to propagate
2. **Trigger a new deployment** by pushing to your PR branch
3. **Check the logs** - the "Failed to list functions" error should be resolved
4. **Verify deployment success** - your preview URL should be generated

---

## 📋 **Technical Context**

### **Why This Permission is Required**
- **Next.js SSR Setup**: Your app uses server-side rendering with Cloud Functions
- **Pinned Functions**: The `ssrwordwiseaimvp` function is marked with `"pinTag": true`
- **Deployment Validation**: Firebase validates function dependencies before hosting deployment
- **IAM Security**: Service accounts have minimal permissions by default

### **Your Current Configuration**
```json
{
  "hosting": {
    "rewrites": [{
      "source": "**",
      "function": {
        "functionId": "ssrwordwiseaimvp",
        "region": "us-central1", 
        "pinTag": true
      }
    }]
  }
}
```

---

## 🚀 **Expected Results After Fix**

✅ **GitHub Actions will succeed**  
✅ **Preview URLs will be generated**  
✅ **Functions will deploy properly**  
✅ **SSR functionality maintained**  
✅ **No more "Failed to list functions" errors**

---

## 🔗 **References**

- [Firebase IAM Permissions](https://firebase.google.com/docs/projects/iam/permissions)
- [Cloud Functions IAM Roles](https://cloud.google.com/functions/docs/reference/iam/roles)
- [Firebase Service Accounts](https://firebase.google.com/docs/admin/setup#initialize-sdk)
- [GitHub Actions Firebase Deploy](https://github.com/FirebaseExtended/action-hosting-deploy)

---

## ⚡ **Quick Fix Command**

If you have `gcloud` CLI access:

```bash
# Get your project ID
PROJECT_ID="wordwise-ai-mvp"

# Get your service account email (replace with actual email)
SERVICE_ACCOUNT="firebase-adminsdk-xxxxx@wordwise-ai-mvp.iam.gserviceaccount.com"

# Grant Cloud Functions Viewer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudfunctions.viewer"
```

**Note**: Replace `firebase-adminsdk-xxxxx@wordwise-ai-mvp.iam.gserviceaccount.com` with your actual service account email from the Firebase Console.

---

## ✅ **RESOLUTION COMPLETED**

**The Firebase Admin SDK service account has been successfully updated with all required permissions:**

- ✅ `roles/cloudfunctions.viewer` - Includes `cloudfunctions.functions.list` permission
- ✅ `roles/firebasehosting.admin` - Full Firebase Hosting deployment permissions
- ✅ `roles/firebase.sdkAdminServiceAgent` - Firebase Admin SDK permissions
- ✅ `roles/firebaseauth.admin` - Authentication permissions
- ✅ `roles/iam.serviceAccountTokenCreator` - Token creation permissions
- ✅ `roles/storage.admin` - Storage permissions

**Your Firebase deployment pipeline should now work correctly! 🎉** 