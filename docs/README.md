// README.md

# Walk Nepal Walk - Complete Implementation

A full-stack trekking registration platform with real-time participant updates, built with **Cloudflare Workers**, **Durable Objects**, **React Native**, and **Firebase**.

---

## 📋 Project Structure

```
walk-nepal/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Main API routes and handlers
│   │   ├── durable-objects/
│   │   │   └── TrekInstance.ts      # Real-time participant tracking
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Firebase authentication
│   │   │   ├── cors.ts              # CORS headers
│   │   │   └── rateLimit.ts         # Rate limiting
│   │   └── database/
│   │       ├── schema.sql           # Database schema
│   │       └── queries.ts           # Query helpers
│   ├── wrangler.toml                # Cloudflare config
│   └── .env.example                 # Environment template
│
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── AuthScreen.tsx       # Login/signup
│   │   │   ├── TrekListScreen.tsx   # Trek list with filters
│   │   │   ├── BookingDetailsScreen.tsx # Registration form
│   │   │   └── MyBookingsScreen.tsx # User's bookings
│   │   ├── components/
│   │   │   ├── TrekCard.tsx         # Trek display card
│   │   │   ├── ParticipantStack.tsx # Avatar stack
│   │   │   ├── ShareButton.tsx      # Share functionality
│   │   │   └── PushNotificationHandler.tsx
│   │   ├── services/
│   │   │   ├── firebaseAuth.ts      # Firebase wrapper
│   │   │   ├── cloudflareAPI.ts     # API client
│   │   │   ├── webSocketClient.ts   # Real-time updates
│   │   │   └── localDB.ts           # SQLite storage
│   │   ├── store/
│   │   │   ├── redux/
│   │   │   │   ├── store.ts         # Redux config
│   │   │   │   ├── trekSlice.ts     # Trek state
│   │   │   │   ├── bookingSlice.ts  # Booking state
│   │   │   │   └── participantSlice.ts # Participant state
│   │   │   └── hooks.ts             # Custom Redux hooks
│   │   ├── utils/
│   │   │   ├── errorHandler.ts      # Error handling
│   │   │   ├── helpers.ts           # Utility functions
│   │   │   └── constants.ts         # App constants
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── theme/
│   │   │   └── colors.ts            # Design tokens
│   │   └── App.tsx                  # Root component
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Backend Setup

### Prerequisites
- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare Account with D1, R2, KV, and Durable Objects

### Installation

1. **Navigate to backend directory**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
```

3. **Set up D1 Database**
```bash
wrangler d1 create walk-nepal-prod
# Run migrations
wrangler d1 execute walk-nepal-prod --file=src/database/schema.sql
```

4. **Configure Wrangler**
Edit `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "walk-nepal-prod"
database_id = "YOUR_ID"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_ID"
```

5. **Run locally**
```bash
wrangler dev
```

6. **Deploy**
```bash
wrangler publish
```

### API Endpoints

#### Public Routes
- `GET /treks` - Get all upcoming treks
- `GET /treks/:trekId` - Get trek details with live count
- `GET /invites/join?code=XXX` - Validate invite code
- `GET /health` - Health check

#### Protected Routes (Require Firebase token)
- `GET /bookings` - Get user's bookings
- `POST /bookings` - Register for trek
- `DELETE /bookings/:bookingId` - Cancel booking
- `POST /treks/:trekId/invite` - Create invite link

#### WebSocket
- `GET /ws/trek/:trekId` - Real-time participant updates

---

## 📱 Mobile App Setup

### Prerequisites
- Node.js 16+
- React Native CLI or Expo
- Firebase project configured
- Android SDK / Xcode

### Installation

1. **Navigate to mobile directory**
```bash
cd mobile
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your Firebase and API URL
```

3. **Link Firebase**
```bash
# iOS
pod install --repo-update

# Android
# Download google-services.json to android/app/
```

4. **Run on device**
```bash
# iOS
npm run ios

# Android
npm run android

# Expo
npx expo start
```

---

## 🔑 Firebase Configuration

### Required Firebase Features

1. **Authentication**
   - Enable Google Sign-In
   - Enable Anonymous Sign-In (for browsing)

2. **Firestore/Realtime Database** (optional)
   - For storing user profiles

3. **Cloud Messaging**
   - For push notifications

4. **Storage**
   - For storing trek images/documents

### Firebase Setup

1. Create project at [Firebase Console](https://console.firebase.google.com)

2. Enable authentication methods:
   ```
   - Google Sign-In
   - Anonymous
   - Email/Password (optional)
   ```

3. Configure CORS origins:
   ```
   Add your app domain and localhost:3000 to authorized redirect URIs
   ```

4. Get credentials:
   - Web App: Copy config to `firebaseAuth.ts`
   - Backend: Download service account JSON

---

## 🔄 Real-Time Updates

### WebSocket Flow

1. **Client connects** → `/ws/trek/:trekId`
2. **Receives initial state** with participant count
3. **Listens for events:**
   - `participant_joined`
   - `participant_left`
4. **Durable Object broadcasts** updates to all connected clients

### Example WebSocket Message
```json
{
  "type": "participant_joined",
  "new_person": "John Doe",
  "gender": "m",
  "count": {
    "total": 23,
    "male": 15,
    "female": 8
  },
  "timestamp": 1694700000000
}
```

---

## 🗄️ Database Schema

### Tables

#### `treks`
- `id` (TEXT, PRIMARY KEY)
- `name`, `date`, `days`, `difficulty`
- `leader`, `capacity`, `itinerary`
- `created_at` (DATETIME)

#### `bookings`
- `id` (INTEGER, PRIMARY KEY)
- `trek_id`, `user_email`, `full_name`
- `phone`, `whatsapp`, `age_group`, `gender`
- `joined_at` (DATETIME)

#### `team_members`
- `id` (INTEGER, PRIMARY KEY)
- `booking_id` (FOREIGN KEY)
- `full_name`, `gender`, `age_group`, `phone`

#### `invites`
- `code` (TEXT, PRIMARY KEY)
- `trek_id`, `created_by`
- `used_count`, `created_at`

---

## 🔐 Authentication Flow

1. **User signs in** with Google or anonymously
2. **Firebase generates ID token**
3. **Client includes token** in API requests:
   ```
   Authorization: Bearer <id_token>
   ```
4. **Backend validates token** with Firebase
5. **Extracts user email** and performs action

---

## 📦 Deployment

### Backend (Cloudflare Workers)

1. **Build**
```bash
cd backend
npm run build
```

2. **Deploy**
```bash
wrangler publish
```

3. **Verify**
```bash
curl https://your-domain.workers.dev/health
```

### Mobile App

#### iOS
```bash
# Generate build
npm run build:ios

# Or use Xcode
open ios/WalkNepalWalk.xcworkspace
# Build and archive
```

#### Android
```bash
# Generate build
npm run build:android

# Or manual
cd android
./gradlew bundleRelease
```

#### Push to App Store/Google Play
- Follow respective platform guidelines
- Use TestFlight for iOS beta testing
- Use Google Play Console for Android

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Mobile Tests
```bash
cd mobile
npm run test

# E2E tests
npm run test:e2e
```

---

## 📊 Monitoring

### Backend
- **Cloudflare Analytics** - Worker performance
- **D1 Insights** - Database queries
- **Sentry** (optional) - Error tracking

### Mobile
- **Firebase Analytics** - User events
- **Crashlytics** - Crash reporting

---

## 🔧 Configuration

### Rate Limiting
- **Default**: 30 requests per 60 seconds per IP
- **Registration**: 5 registrations per hour per email

### WebSocket
- **Max retries**: 5
- **Min reconnection delay**: 1.5 seconds
- **Max reconnection delay**: 10 seconds

### Local Database
- **Auto cleanup**: 24 hours
- **Max cache**: 500 MB
- **Tables**: Treks, Bookings, Favorites, Search history

---

## 🆘 Troubleshooting

### Backend Issues

**D1 Connection Error**
```bash
# Check database ID
wrangler d1 list

# Test query
wrangler d1 execute walk-nepal-prod --command="SELECT 1"
```

**Durable Object Not Found**
```bash
# Ensure migration ran
wrangler publish
```

### Mobile Issues

**Firebase Authentication Failed**
- Verify Firebase credentials in `.env`
- Check Google Sign-In enabled in Firebase Console
- Ensure bundle ID matches in Firebase

**WebSocket Connection Timeout**
- Check network connectivity
- Verify API URL in `.env`
- Check backend deployment status

**Local Database Not Found**
```bash
# Reset local database
import { localDB } from './services/localDB';
await localDB.clearAll();
```

---

## 📚 API Documentation

### Get All Treks
```http
GET /treks
Accept: application/json

Response:
[
  {
    "id": "langtang-trek",
    "name": "Langtang Trek",
    "date": "2024-11-15",
    "days": "7",
    "difficulty": "moderate",
    "capacity": 20,
    "participants": 12
  }
]
```

### Register for Trek
```http
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "trek_id": "langtang-trek",
  "full_name": "John Doe",
  "phone": "9800000000",
  "whatsapp": "9800000000",
  "age_group": "30-40",
  "gender": "m",
  "team_members": [
    {
      "full_name": "Jane Doe",
      "gender": "f",
      "age_group": "25-30"
    }
  ]
}

Response:
{
  "success": true,
  "booking_id": 123
}
```

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details

---

## 📞 Support

For issues and questions:
- **Issues**: GitHub Issues
- **Email**: support@walk-nepal.app
- **Discord**: [Join our community](https://discord.gg/walk-nepal)

---

## 🙏 Acknowledgments

- Cloudflare for Workers and Durable Objects
- Firebase for authentication and messaging
- React Native community
- Redux team for state management
