# Tikiti Admin Dashboard - Deployment Guide

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Clone or create the admin dashboard
cd tikiti-admin

# Install dependencies
npm install

# Copy environment variables
cp env.example .env
```

### 2. Configure Firebase

Update `.env` with your Firebase credentials (same as mobile app):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Create Admin Users

Update `scripts/setup-admin.js` with your Firebase config and run:

```bash
node scripts/setup-admin.js
```

This creates:
- `admin@tikiti.com` (Super Admin)
- `moderator@tikiti.com` (Regular Admin)

### 4. Development

```bash
npm run dev
# Open http://localhost:3001
```

### 5. Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Deploy to production
vercel --prod
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@firebase_auth_domain",
    "VITE_FIREBASE_PROJECT_ID": "@firebase_project_id",
    "VITE_FIREBASE_STORAGE_BUCKET": "@firebase_storage_bucket",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "@firebase_messaging_sender_id",
    "VITE_FIREBASE_APP_ID": "@firebase_app_id"
  }
}
```

### Option 2: Netlify

```bash
# Build
npm run build

# Deploy to Netlify
# Upload dist/ folder or connect GitHub repo
```

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init hosting

# Build and deploy
npm run build
firebase deploy --only hosting
```

### Option 4: Custom Server

```bash
# Build
npm run build

# Serve with any static server
npx serve dist
# or
python -m http.server 3001 --directory dist
```

## 🔒 Security Setup

### 1. Firebase Security Rules

Update Firestore rules to protect admin data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin collection - only admins can read/write
    match /admins/{adminId} {
      allow read, write: if request.auth != null 
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Users collection - admins can read/write
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Events collection - admins can read/write
    match /events/{eventId} {
      allow read, write: if request.auth != null 
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

### 2. Environment Variables

**Never commit sensitive data!**

Production environment variables:
- `VITE_FIREBASE_*` - Firebase config
- `VITE_ENVIRONMENT=production`
- `VITE_API_BASE_URL` - Your API endpoint

### 3. Admin User Management

Create admin users securely:

```javascript
// In Firebase Console or using Admin SDK
{
  uid: "admin-user-id",
  email: "admin@yourcompany.com",
  displayName: "Admin Name",
  role: "super_admin", // or "admin"
  permissions: ["all"], // or specific permissions
  createdAt: firestore.Timestamp.now(),
  isActive: true
}
```

## 📊 Monitoring & Analytics

### 1. Error Tracking

Add Sentry for error monitoring:

```bash
npm install @sentry/react @sentry/tracing
```

```javascript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
});
```

### 2. Analytics

Add Google Analytics:

```bash
npm install gtag
```

```javascript
// src/lib/analytics.ts
import { gtag } from 'gtag';

gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID);
```

### 3. Performance Monitoring

Monitor Core Web Vitals and user interactions.

## 🔧 Maintenance

### Regular Tasks

1. **Update Dependencies**:
   ```bash
   npm audit
   npm update
   ```

2. **Monitor Logs**:
   - Check deployment logs
   - Monitor Firebase usage
   - Review error reports

3. **Backup Admin Data**:
   - Export admin configurations
   - Backup Firebase data
   - Document admin procedures

4. **Security Audits**:
   - Review admin access logs
   - Update passwords regularly
   - Monitor suspicious activity

### Scaling Considerations

- **CDN**: Use Cloudflare for global distribution
- **Caching**: Implement proper caching headers
- **Database**: Monitor Firestore usage and optimize queries
- **Performance**: Use React.lazy() for code splitting

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**:
   ```bash
   # Clear cache
   rm -rf node_modules dist .vite
   npm install
   npm run build
   ```

2. **Firebase Connection**:
   - Verify environment variables
   - Check Firebase project settings
   - Ensure admin users exist in Firestore

3. **Authentication Issues**:
   - Verify admin collection structure
   - Check Firebase Auth settings
   - Review security rules

4. **Deployment Failures**:
   - Check build logs
   - Verify environment variables
   - Test locally first

### Support

For issues:
1. Check Firebase Console logs
2. Review browser developer tools
3. Check deployment platform logs
4. Verify environment configuration

## 📱 Mobile App Integration

The admin dashboard manages your React Native app through shared Firebase backend:

### Real-time Updates
- Changes in admin dashboard instantly affect mobile app
- User suspensions take effect immediately
- Feature flags update mobile app behavior
- Push notifications reach mobile users

### Data Flow
```
Admin Dashboard → Firebase → Mobile App
     ↓              ↓           ↓
   Actions      Database    Real-time
   Settings     Updates     Updates
```

### Testing Integration
1. Make changes in admin dashboard
2. Verify changes in mobile app
3. Test user flows end-to-end
4. Monitor Firebase logs

---

🎉 **Your Tikiti Admin Dashboard is ready to manage your mobile app empire!**

Need help? Check the main README.md or contact your development team.
