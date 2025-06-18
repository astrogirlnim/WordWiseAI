# 🔍 Deployment Verification Guide

This document provides comprehensive steps to verify successful deployment of WordWiseAI.

## 📋 Pre-Deployment Checklist

### Environment Validation
```bash
# Validate all required environment variables
pnpm prestart

# Verify Firebase project configuration
firebase projects:list
firebase use --show
```

### Code Quality & Build
```bash
# Run linting and fix issues
pnpm lint

# Test local build
pnpm build

# Verify no build errors or warnings
echo "✅ Build completed successfully"
```

## 🚀 Deployment Verification Steps

### 1. Firebase Hosting Verification

**Check Hosting Status:**
```bash
# Deploy to hosting
firebase deploy --only hosting

# Verify hosting URL is accessible
curl -I https://your-project-id.web.app
# Expected: HTTP/2 200 status
```

**Manual Testing:**
- [ ] **Site loads**: Navigate to your Firebase hosting URL
- [ ] **No 404 errors**: Check main routes (`/`, `/sign-in`, `/sign-up`, `/settings`)
- [ ] **Assets loading**: Verify CSS, JS, and images load correctly
- [ ] **Responsive design**: Test on mobile and desktop viewports

### 2. Authentication Verification

**Test Authentication Flow:**
```bash
# Test auth endpoints
curl -X POST https://your-project-id.web.app/api/auth/test
```

**Manual Testing:**
- [ ] **Sign-up flow**: Create new user account
- [ ] **Sign-in flow**: Login with existing credentials
- [ ] **Sign-out flow**: Logout functionality works
- [ ] **Password reset**: Password reset email is sent
- [ ] **Protected routes**: Unauthorized access redirects to sign-in

### 3. Firestore Database Verification

**Test Database Rules:**
```bash
# Test Firestore rules compilation
firebase firestore:rules --project your-project-id

# Deploy rules
firebase deploy --only firestore:rules
```

**Manual Testing:**
- [ ] **Document creation**: Create new documents as authenticated user
- [ ] **Document reading**: Read own documents only
- [ ] **Document updates**: Update document permissions work
- [ ] **Document deletion**: Delete own documents only
- [ ] **Security rules**: Unauthorized access is blocked

### 4. Realtime Database Verification

**Test Collaboration Features:**
```bash
# Deploy database rules
firebase deploy --only database:rules

# Test realtime connection
firebase database:get / --project your-project-id
```

**Manual Testing:**
- [ ] **Real-time sync**: Changes sync between browser tabs
- [ ] **Presence system**: User presence updates in real-time
- [ ] **Collaboration**: Multiple users can edit simultaneously
- [ ] **Database rules**: Only document owners have access

### 5. Cloud Functions Verification

**Deploy and Test Functions:**
```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Test function endpoints
curl -X POST "https://us-central1-your-project-id.cloudfunctions.net/generateSuggestions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text": "test document", "userId": "test-user"}'
```

**Manual Testing:**
- [ ] **AI Suggestions**: Grammar and style suggestions work
- [ ] **Function logs**: Check Cloud Functions logs for errors
- [ ] **Performance**: Functions respond within acceptable time
- [ ] **Error handling**: Functions handle invalid inputs gracefully

### 6. Storage Verification

**Test File Upload:**
```bash
# Deploy storage rules
firebase deploy --only storage

# Test storage access
firebase storage:get gs://your-project-id.appspot.com/test.txt
```

**Manual Testing:**
- [ ] **File uploads**: Documents and images upload successfully
- [ ] **File downloads**: Uploaded files are accessible
- [ ] **Storage rules**: Only authenticated users can upload
- [ ] **File permissions**: Users can only access their own files

## 🔄 Automated Verification Script

Create this verification script for automated testing:

```bash
#!/bin/bash
# deployment-verify.sh

echo "🔍 Starting deployment verification..."

# Test hosting
echo "Testing hosting..."
HOSTING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-project-id.web.app)
if [ "$HOSTING_STATUS" = "200" ]; then
    echo "✅ Hosting is live"
else
    echo "❌ Hosting failed (Status: $HOSTING_STATUS)"
fi

# Test authentication
echo "Testing authentication..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-project-id.web.app/sign-in)
if [ "$AUTH_STATUS" = "200" ]; then
    echo "✅ Authentication page accessible"
else
    echo "❌ Authentication failed (Status: $AUTH_STATUS)"
fi

# Test API endpoints
echo "Testing API endpoints..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-project-id.web.app/api/health)
if [ "$API_STATUS" = "200" ]; then
    echo "✅ API endpoints working"
else
    echo "❌ API endpoints failed (Status: $API_STATUS)"
fi

echo "🎉 Deployment verification completed!"
```

## 📊 Performance Verification

### Core Web Vitals
```bash
# Use Lighthouse CLI for performance testing
npm install -g lighthouse

# Run performance audit
lighthouse https://your-project-id.web.app --output=html --output-path=./lighthouse-report.html

# Check specific metrics
lighthouse https://your-project-id.web.app --only-categories=performance --output=json
```

**Performance Targets:**
- [ ] **First Contentful Paint**: < 1.8s
- [ ] **Largest Contentful Paint**: < 2.5s
- [ ] **Cumulative Layout Shift**: < 0.1
- [ ] **Total Blocking Time**: < 200ms

### Load Testing
```bash
# Basic load test with curl
for i in {1..10}; do
    curl -w "@curl-format.txt" -o /dev/null -s https://your-project-id.web.app &
done
wait
```

## 🚨 Error Monitoring

### Firebase Console Checks
- [ ] **Error rates**: Check error rates in Firebase Console
- [ ] **Function logs**: Review Cloud Functions execution logs
- [ ] **Performance monitoring**: Monitor app performance metrics
- [ ] **Usage analytics**: Verify user analytics are being tracked

### Alerting Setup
```bash
# Set up Firebase Performance Monitoring alerts
# Configure alerts for:
# - High error rates (>5%)
# - Slow response times (>3s)
# - Function failures
# - Storage quota warnings
```

## ✅ Deployment Success Criteria

**All systems operational when:**
- [ ] All verification steps pass
- [ ] Performance metrics meet targets
- [ ] Error rates are below 1%
- [ ] All critical user flows work end-to-end
- [ ] Security rules are properly enforced
- [ ] Monitoring and alerting are active

## 🔧 Rollback Procedures

**If deployment fails:**
```bash
# Quick rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID

# Or deploy previous version
git checkout previous-stable-commit
firebase deploy --only hosting

# Verify rollback success
curl -I https://your-project-id.web.app
```

## 📞 Support Contacts

**If critical issues arise:**
- **Firebase Support**: Firebase Console → Support
- **GitHub Issues**: Create issue with `deployment` label
- **Team Escalation**: [Internal escalation procedures]

---

**Remember**: Always test deployment in a staging environment before production deployment.

## 🔗 Related Documentation

- [`firebase-refactor-checklist.md`](./firebase-refactor-checklist.md) - Firebase configuration checklist
- [`README.md`](../README.md) - Development and deployment setup
- [Firebase Console](https://console.firebase.google.com) - Project monitoring 