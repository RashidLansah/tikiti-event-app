# TestFlight Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Apple Developer Account
- [ ] **Apple Developer Program membership** ($99/year)
- [ ] **App Store Connect access** configured
- [ ] **Team ID** and **Apple ID** ready for eas.json

### 2. EAS Setup
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Configure project: `eas build:configure`
- [ ] Update `eas.json` with your Apple ID and Team ID

### 3. App Configuration
- [x] **Bundle Identifier**: com.tikiti.eventapp
- [x] **App Name**: Tikiti
- [x] **Version**: 1.0.0
- [x] **Build Number**: 1
- [x] **iOS Permissions**: Camera, Photo Library
- [x] **Description**: Added to app.json

### 4. Assets & Icons
- [x] **App Icon**: 1024x1024 PNG (assets/icon.png)
- [x] **Splash Screen**: assets/splash-icon.png
- [ ] **App Store Screenshots**: Need to create 6.5", 5.5", and 12.9" sizes
- [ ] **App Preview Video**: Optional but recommended

## 🔧 Technical Requirements

### Firebase Configuration
- [x] **Production Firebase project** configured
- [x] **Authentication** set up
- [x] **Firestore database** configured
- [x] **Storage** configured for image uploads

### App Functionality
- [x] **Authentication flow** working
- [x] **Event creation** working
- [x] **Event discovery** working
- [x] **QR code scanning** working
- [x] **Ticket generation** working
- [x] **Deep linking** configured

### Performance & Quality
- [ ] **Test on physical iOS device**
- [ ] **Memory usage** optimized
- [ ] **Crash testing** completed
- [ ] **Network error handling** implemented
- [ ] **Offline functionality** tested

## 📱 Build & Deploy Commands

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure Build
```bash
eas build:configure
```

### Step 4: Create iOS Build for TestFlight
```bash
eas build --platform ios --profile production
```

### Step 5: Submit to App Store Connect
```bash
eas submit --platform ios
```

## 📋 App Store Connect Setup

### App Information
- [ ] **App Name**: Tikiti
- [ ] **Bundle ID**: com.tikiti.eventapp
- [ ] **Primary Language**: English
- [ ] **Category**: Lifestyle
- [ ] **Age Rating**: 4+

### App Privacy
- [ ] **Data Collection**: Configure based on Firebase usage
- [ ] **Privacy Policy URL**: Add your privacy policy URL
- [ ] **Data Use**: Camera (QR scanning), Photos (Event images)

### TestFlight Information
- [ ] **Test Information**: What to test, known issues
- [ ] **Beta App Description**: Brief description for testers
- [ ] **Feedback Email**: support@tikiti.com
- [ ] **Marketing URL**: Optional

### Required Metadata
- [ ] **App Description**: From APP_STORE_DESCRIPTION.md
- [ ] **Keywords**: events, tickets, QR codes, etc.
- [ ] **Screenshots**: 6.5", 5.5", 12.9" sizes
- [ ] **App Icon**: 1024x1024 PNG

## 🧪 Testing Checklist

### Core Functionality
- [ ] **User Registration** (Attendee & Organizer)
- [ ] **Login/Logout** flow
- [ ] **Event Creation** with images
- [ ] **Event Discovery** and search
- [ ] **RSVP/Ticket Purchase** flow
- [ ] **QR Code Generation** in tickets
- [ ] **QR Code Scanning** by organizers
- [ ] **Deep Linking** from shared events

### Edge Cases
- [ ] **No Internet Connection** handling
- [ ] **Camera Permission Denied**
- [ ] **Photo Library Permission Denied**
- [ ] **Invalid QR Codes** scanning
- [ ] **Event Not Found** scenarios
- [ ] **Firebase Connection Issues**

### Device Testing
- [ ] **iPhone SE** (small screen)
- [ ] **iPhone 14** (standard size)
- [ ] **iPhone 14 Pro Max** (large screen)
- [ ] **iPad** (tablet support)
- [ ] **iOS 15+** compatibility

## 🚀 Deployment Steps

### 1. Final Code Preparation
```bash
# Ensure all changes are committed
git add .
git commit -m "🚀 Prepare for TestFlight release v1.0.0"
git push origin master
```

### 2. Build for iOS
```bash
# Create production build
eas build --platform ios --profile production --non-interactive
```

### 3. Submit to TestFlight
```bash
# Submit build to App Store Connect
eas submit --platform ios --latest
```

### 4. Configure TestFlight
- Add internal testers
- Add external testers (requires App Store review)
- Set up test groups
- Add test instructions

## 📝 Beta Testing Information

### Internal Testing (No Review Required)
- Up to 100 internal testers
- Team members and stakeholders
- Immediate access after build processing

### External Testing (Requires Review)
- Up to 10,000 external testers
- Public beta testers
- Requires App Store review (1-3 days)

### Test Instructions for Testers
```
Welcome to Tikiti Beta!

Please test the following features:
1. Create an account (try both Attendee and Organizer)
2. Browse and search for events
3. Create a test event (Organizers only)
4. RSVP to an event and download your ticket
5. Test QR code scanning (Organizers only)
6. Share an event link and test deep linking

Known Issues:
- [List any known issues]

Please report bugs and feedback to: beta@tikiti.com
```

## ⚠️ Important Notes

1. **Apple Review**: First TestFlight submission requires App Store review (1-3 days)
2. **Build Processing**: iOS builds take 10-20 minutes to process
3. **Certificates**: EAS handles certificates automatically
4. **Provisioning**: EAS manages provisioning profiles
5. **Updates**: Subsequent builds are available immediately to internal testers

## 📞 Support & Resources

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **TestFlight Guide**: https://developer.apple.com/testflight/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Expo Discord**: https://discord.gg/4gtbPAdpaE

---

**Ready to deploy?** Make sure all checkboxes are completed before running the build commands!
