# 🧪 Local Testing Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd tikiti-admin
npm install
```

### 2. Setup Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env with your Firebase config
# Use the SAME Firebase project as your mobile app
```

### 3. Add Firebase Config
Edit `.env` file:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

### 4. Create Test Admin User

**Option A: Using Firebase Console (Recommended)**
1. Go to Firebase Console → Authentication
2. Add user: `admin@test.com` / `password123`
3. Go to Firestore → Create collection `admins`
4. Add document with user's UID:
```json
{
  "uid": "the_user_uid_from_auth",
  "email": "admin@test.com",
  "displayName": "Test Admin",
  "role": "admin",
  "permissions": ["all"],
  "createdAt": "2024-01-01T00:00:00Z",
  "isActive": true
}
```

**Option B: Using Setup Script**
```bash
# Edit scripts/setup-admin.js with your Firebase config first
node scripts/setup-admin.js
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Open Browser
Navigate to `http://localhost:3001`

Login with:
- **Email**: `admin@test.com`
- **Password**: `password123`

## 🎯 What You'll See

### Dashboard Features (Working with Mock Data)
- ✅ **Dashboard Overview** - Stats cards, charts, recent activity
- ✅ **User Management** - View users from your mobile app
- ✅ **Event Management** - View events from your mobile app  
- ✅ **Analytics** - Mock charts and data visualization
- ✅ **Settings** - Configuration panels

### Real Data Integration
The dashboard will show **real data** from your mobile app:
- Users who registered in your React Native app
- Events created by organizers
- Tickets purchased
- All Firebase collections

## 🔧 Troubleshooting

### "Access Denied" Error
**Problem**: Can't login or see "Access Denied"
**Solution**: Make sure admin user exists in Firestore `admins` collection

### "Firebase Not Connected"  
**Problem**: Can't connect to Firebase
**Solution**: 
1. Check `.env` file has correct Firebase config
2. Verify Firebase project is active
3. Check browser console for errors

### "No Data Showing"
**Problem**: Dashboard shows empty or mock data
**Solution**:
1. Make sure you're using the same Firebase project as mobile app
2. Check if mobile app has created users/events
3. Verify Firestore collections exist (`users`, `events`, etc.)

### Build Errors
**Problem**: TypeScript or build errors
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules dist .vite
npm install
npm run dev
```

## 🧪 Testing Features

### Test User Management
1. Register users in your mobile app
2. Refresh admin dashboard
3. Users should appear in Users section
4. Try editing user profiles
5. Test suspend/activate actions

### Test Event Management  
1. Create events in mobile app (as organizer)
2. View events in admin dashboard
3. Test approve/reject functionality
4. Try featuring events

### Test Real-time Updates
1. Make changes in admin dashboard
2. Check mobile app for updates
3. Changes should reflect immediately

## 🚀 Demo Mode

If you don't have mobile app data yet, the dashboard works with **mock data**:
- Sample users and events
- Realistic analytics charts  
- Demonstration of all features
- Perfect for showcasing capabilities

## 📱 Mobile App Integration

To test full integration:

1. **Mobile App Setup**:
   - Ensure mobile app uses same Firebase project
   - Create some test users and events

2. **Admin Actions**:
   - Suspend user in dashboard → User can't login to mobile
   - Approve event in dashboard → Event appears in mobile app
   - Send notification → Mobile users receive it

3. **Real-time Sync**:
   - Changes in admin dashboard instantly affect mobile app
   - New mobile registrations appear in admin dashboard

## 🎨 UI Components

The dashboard uses modern UI components:
- **Responsive design** - Works on desktop, tablet, mobile
- **Dark/light mode** - Automatic theme switching
- **Interactive charts** - Hover effects, drill-down
- **Real-time updates** - Live data refresh

## 🔍 Development Tips

### Hot Reload
Changes to code automatically refresh browser

### React DevTools
Install React DevTools browser extension for debugging

### Firebase Emulator (Optional)
For advanced testing:
```bash
firebase emulators:start
# Update .env to use emulator URLs
```

### TypeScript Support
Full TypeScript support with proper types for Firebase

## ✅ Testing Checklist

- [ ] Admin dashboard loads successfully
- [ ] Can login with admin credentials  
- [ ] Dashboard shows stats and charts
- [ ] User management page works
- [ ] Event management page works
- [ ] Settings page loads
- [ ] Real mobile app data appears (if available)
- [ ] Mock data displays properly (if no real data)

## 🎉 Success!

You now have a fully functional admin dashboard running locally! 

**Next steps**:
1. Customize the dashboard for your needs
2. Add more admin users
3. Deploy to production (see DEPLOYMENT.md)
4. Integrate with your mobile app workflow

Need help? Check the main README.md or create an issue!
