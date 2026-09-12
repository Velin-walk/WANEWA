// INTEGRATION_CHECKLIST.md

# Walk Nepal Walk - Integration & Deployment Checklist

Complete this checklist to integrate all generated files into your project.

---

## 🎯 Phase 1: File Organization (30 minutes)

### Backend Files
- [ ] Copy `auth.ts` → `backend/src/middleware/auth.ts`
- [ ] Copy `cors.ts` → `backend/src/middleware/cors.ts`
- [ ] Copy `rateLimit.ts` → `backend/src/middleware/rateLimit.ts`
- [ ] Copy `queries.ts` → `backend/src/database/queries.ts`
- [ ] Copy `index.ts` → `backend/src/index.ts` (replace existing)
- [ ] Copy `.env.example.backend` → `backend/.env.local`

### Mobile Files - Services
- [ ] Create `mobile/src/services/` directory if not exists
- [ ] Copy `firebaseAuth.ts` → `mobile/src/services/firebaseAuth.ts`
- [ ] Copy `cloudflareAPI.ts` → `mobile/src/services/cloudflareAPI.ts`
- [ ] Copy `webSocketClient.ts` → `mobile/src/services/webSocketClient.ts` (replace existing)
- [ ] Copy `localDB.ts` → `mobile/src/services/localDB.ts`

### Mobile Files - Redux Store
- [ ] Create `mobile/src/store/redux/` directory if not exists
- [ ] Copy `store.ts` → `mobile/src/store/redux/store.ts`
- [ ] Copy `trekSlice.ts` → `mobile/src/store/redux/trekSlice.ts`
- [ ] Copy `bookingSlice.ts` → `mobile/src/store/redux/bookingSlice.ts`
- [ ] Copy `participantSlice.ts` → `mobile/src/store/redux/participantSlice.ts`
- [ ] Copy `hooks.ts` → `mobile/src/store/hooks.ts`

### Mobile Files - Components
- [ ] Copy `TrekCard.tsx` → `mobile/src/components/TrekCard.tsx` (replace existing)
- [ ] Copy `ShareButton.tsx` → `mobile/src/components/ShareButton.tsx`

### Mobile Files - Screens
- [ ] Copy `AuthScreen.tsx` → `mobile/src/screens/AuthScreen.tsx`
- [ ] Copy `BookingDetailsScreen.tsx` → `mobile/src/screens/BookingDetailsScreen.tsx`
- [ ] Copy `MyBookingsScreen.tsx` → `mobile/src/screens/MyBookingsScreen.tsx`

### Mobile Files - Utils
- [ ] Create `mobile/src/utils/` directory if not exists
- [ ] Copy `errorHandler.ts` → `mobile/src/utils/errorHandler.ts`
- [ ] Copy `helpers.ts` → `mobile/src/utils/helpers.ts`

### Mobile Files - Types
- [ ] Create `mobile/src/types/` directory if not exists
- [ ] Copy `types.ts` → `mobile/src/types/index.ts`

### Configuration
- [ ] Copy `.env.example.backend` → `backend/.env.local` (and fill in credentials)
- [ ] Copy `.env.example.mobile` → `mobile/.env` (and fill in credentials)

---

## 🔑 Phase 2: Configuration (45 minutes)

### Backend Configuration

#### Firebase Setup
- [ ] Get Firebase project ID from Firebase Console
- [ ] Get Firebase API Key from Project Settings
- [ ] Get service account private key (download JSON)
- [ ] Update `backend/.env.local`:
  ```env
  FIREBASE_PROJECT_ID=walk-nepal-walk
  FIREBASE_API_KEY=AIzaSyCa_4nUh2ABbrWQV2ybFYQ6LUu7ZaQbiLg
  ```

#### Cloudflare Setup
- [ ] Get Cloudflare Account ID
- [ ] Create API token for Wrangler
- [ ] Run: `wrangler login`
- [ ] Update `wrangler.toml` with credentials

#### D1 Database
- [ ] Create D1 database: `wrangler d1 create walk-nepal-prod`
- [ ] Get database ID from output
- [ ] Update `wrangler.toml`:
  ```toml
  [[d1_databases]]
  binding = "DB"
  database_id = "YOUR_ID"
  ```
- [ ] Run migrations: `wrangler d1 execute walk-nepal-prod --file=src/database/schema.sql`

#### R2 Bucket
- [ ] Create R2 bucket
- [ ] Update `wrangler.toml`:
  ```toml
  [[r2_buckets]]
  binding = "R2"
  bucket_name = "walk-nepal-media"
  ```

#### KV Namespace
- [ ] Create KV namespace
- [ ] Update `wrangler.toml`:
  ```toml
  [[kv_namespaces]]
  binding = "KV"
  id = "YOUR_KV_ID"
  ```

### Mobile Configuration

#### Firebase Setup
- [ ] Get Firebase web config from Firebase Console
- [ ] Update `mobile/src/services/firebaseAuth.ts`:
  ```typescript
  const firebaseConfig = {
    apiKey: "YOUR_KEY",
    authDomain: "YOUR_DOMAIN",
    projectId: "YOUR_ID",
    // ... other fields
  };
  ```

#### Google OAuth Setup
- [ ] Enable Google Sign-In in Firebase
- [ ] Create OAuth 2.0 credentials (Google Cloud Console)
- [ ] Add web client ID
- [ ] Update `mobile/.env`:
  ```env
  REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
  ```

#### API Configuration
- [ ] Get Cloudflare Workers URL after backend deployment
- [ ] Update `mobile/.env`:
  ```env
  REACT_APP_API_URL=https://your-domain.workers.dev
  ```

#### Push Notifications (FCM)
- [ ] Get FCM credentials from Firebase
- [ ] Create VAPID key pair
- [ ] Update `mobile/src/services/firebaseAuth.ts`:
  ```typescript
  vapidKey: 'YOUR_VAPID_KEY'
  ```

---

## 📦 Phase 3: Dependencies Installation (15 minutes)

### Backend
```bash
cd backend
npm install

# Verify Wrangler
wrangler --version
```

### Mobile
```bash
cd mobile
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Or for Android, let gradle handle it
```

---

## 🧪 Phase 4: Local Testing (30 minutes)

### Backend Testing
```bash
cd backend

# Start local dev server
wrangler dev

# Test endpoints:
curl http://localhost:8787/health
curl http://localhost:8787/treks

# Monitor logs in terminal
```

### Mobile Testing
```bash
cd mobile

# iOS
npm run ios

# Android
npm run android

# Or with Expo
npx expo start
```

### Test Scenarios
- [ ] User can sign in with Google
- [ ] User can browse treks anonymously
- [ ] User can see real-time participant updates (WebSocket)
- [ ] User can register for a trek
- [ ] User can see their bookings
- [ ] User can cancel a booking
- [ ] User can add team members to booking
- [ ] Offline mode caches treks and bookings

---

## 🚀 Phase 5: Backend Deployment (20 minutes)

### Pre-Deployment Checks
- [ ] All environment variables set in `wrangler.toml` and secrets
- [ ] Database migrations ran successfully
- [ ] Health check passing locally: `curl http://localhost:8787/health`
- [ ] All endpoints tested locally

### Secrets Configuration
```bash
cd backend

# Add Firebase private key as secret
wrangler secret put FIREBASE_PRIVATE_KEY

# Verify
wrangler secret list
```

### Deployment
```bash
# Build
npm run build

# Deploy to production
wrangler publish

# Verify deployment
curl https://your-domain.workers.dev/health
```

### Post-Deployment
- [ ] Test API endpoints in production
- [ ] Verify database connectivity
- [ ] Check Cloudflare Analytics
- [ ] Monitor error logs
- [ ] Test WebSocket connection

---

## 📱 Phase 6: Mobile Deployment

### iOS (App Store)
```bash
cd mobile

# Generate production build
npm run build:ios

# Or manually with Xcode
open ios/WalkNepalWalk.xcworkspace

# Product > Archive
# Distribute to App Store
```

### Android (Google Play)
```bash
cd mobile

# Generate production build
npm run build:android

# Or manually
cd android
./gradlew bundleRelease
cd ..

# Upload to Google Play Console
```

### Pre-Submission Checklist
- [ ] Update app version number
- [ ] Update app name and description
- [ ] Add app icon (1024x1024 PNG)
- [ ] Add screenshots for each screen
- [ ] Write release notes
- [ ] Verify all screens and functionality
- [ ] Test on multiple devices
- [ ] Check for console warnings/errors
- [ ] Verify no hardcoded credentials in code

---

## ✅ Phase 7: Post-Deployment Verification

### Backend
- [ ] GET /health returns 200
- [ ] GET /treks returns trek list
- [ ] GET /treks/:id returns trek details with participant count
- [ ] POST /bookings requires valid Firebase token
- [ ] WebSocket /ws/trek/:id connects successfully
- [ ] Rate limiting enforced (429 on excess requests)
- [ ] CORS headers present in responses
- [ ] Database queries perform efficiently

### Mobile App
- [ ] App launches without crashes
- [ ] Google Sign-In works
- [ ] Can browse treks anonymously
- [ ] Can see real-time participant updates
- [ ] Can register for trek with form validation
- [ ] Can view and manage bookings
- [ ] Offline mode works (cached data visible)
- [ ] Push notifications can be enabled
- [ ] App survives backgrounding/foregrounding

### Analytics
- [ ] Firebase Analytics events firing
- [ ] Cloudflare Workers analytics dashboard shows requests
- [ ] No errors in Sentry/error tracking
- [ ] Database query performance acceptable

---

## 🔧 Phase 8: Monitoring & Maintenance

### Set Up Monitoring
- [ ] Enable Cloudflare Analytics
- [ ] Set up error tracking (Sentry/similar)
- [ ] Configure Firebase Analytics events
- [ ] Set up alerts for errors/performance

### Regular Tasks
- [ ] Review error logs weekly
- [ ] Monitor database performance
- [ ] Check app store reviews and ratings
- [ ] Update dependencies monthly
- [ ] Backup production database regularly
- [ ] Review and analyze user analytics

### Scaling Considerations
- [ ] Monitor Cloudflare Workers requests
- [ ] Track D1 database query performance
- [ ] Monitor KV namespace usage
- [ ] Plan for data growth (consider archiving old treks)
- [ ] Optimize WebSocket connections if needed

---

## 🐛 Troubleshooting Guide

### Backend Issues
**Problem**: "D1 database not found"
```bash
# Solution: Check database ID in wrangler.toml
wrangler d1 list
# Update database_id in wrangler.toml
```

**Problem**: "Firebase token validation fails"
- Check Firebase credentials in secrets
- Verify API key is correct
- Ensure Firebase project has correct CORS settings

**Problem**: "WebSocket connection fails"
- Verify /ws/trek/:id endpoint is accessible
- Check network security (not blocking WebSocket)
- Verify Durable Object is deployed

### Mobile Issues
**Problem**: "API returns 401 Unauthorized"
```typescript
// Check Firebase token is being sent
// Verify token is not expired
// Check Firebase credentials in .env
```

**Problem**: "WebSocket doesn't receive messages"
- Verify API_URL in .env is correct
- Check network connectivity
- Ensure backend is running and deployed

**Problem**: "Local database is empty"
```typescript
// Reset database
import { localDB } from './services/localDB';
await localDB.init();
await localDB.cacheTreks(/* sample data */);
```

---

## 📞 Support Resources

### Documentation
- Backend: README.md "Backend Setup" section
- Mobile: README.md "Mobile App Setup" section
- API: README.md "API Documentation" section

### External Resources
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Firebase SDK Docs](https://firebase.google.com/docs)
- [React Native Docs](https://reactnative.dev/)
- [Redux Docs](https://redux.js.org/)

### Getting Help
- Check generated files for examples
- Review comments in source code
- Search GitHub issues for similar problems
- Consult service documentation (Cloudflare, Firebase)

---

## 📋 Sign-Off

- [ ] All files organized correctly
- [ ] Configuration complete and tested
- [ ] Dependencies installed
- [ ] Local testing passed
- [ ] Backend deployed successfully
- [ ] Mobile app builds without errors
- [ ] Deployment verified
- [ ] Monitoring set up
- [ ] Team trained on system
- [ ] Documentation reviewed

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Status**: [ ] Ready for Production [ ] Needs Fixes [ ] In Progress

---

## 🎉 Congratulations!

Your Walk Nepal Walk application is now fully integrated and deployed! 

**Next**: Continue to monitoring & maintenance phase, gather user feedback, and plan feature improvements.
