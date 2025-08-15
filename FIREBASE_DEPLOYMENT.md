# Firebase Image Storage Guide

## Current Implementation: Firestore Base64 Storage

Since Firebase Storage requires a paid plan upgrade, we're currently storing images as base64 strings directly in Firestore documents. This approach:

✅ **Advantages:**
- Works with free Firebase plan
- No additional service setup required
- Images are stored with event data
- Immediate availability

⚠️ **Limitations:**
- Firestore document size limit (1MB)
- Larger images increase document size
- Base64 encoding increases size by ~33%
- Not ideal for high-resolution images

## Image Size Recommendations

Keep images under **700KB** to stay well within Firestore limits:
- **Optimal**: Under 500KB
- **Acceptable**: 500KB - 700KB  
- **Too Large**: Over 700KB (may cause errors)

### Option 1: Using Firebase CLI (Recommended)

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project (if not already done):
```bash
firebase init storage
```

4. Deploy the storage rules:
```bash
firebase deploy --only storage
```

### Option 2: Manual Deployment via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `tikiti-45ac4`
3. Go to **Storage** in the left sidebar
4. Click on **Rules** tab
5. Replace the existing rules with the content from `firebase-storage.rules`
6. Click **Publish**

## Current Storage Rules

The rules allow:
- ✅ Authenticated users to upload images to their own folders
- ✅ Anyone to read event and profile images
- ✅ Proper security with user ID validation

## Troubleshooting

If you still get upload errors after deploying rules:

1. **Check Firebase Console** for any error messages
2. **Verify Storage is enabled** in your Firebase project
3. **Check authentication** - make sure user is properly logged in
4. **Review console logs** for detailed error information

## Test the Current Implementation

1. Try creating an event with an image
2. Check the console for detailed conversion logs
3. Verify the base64 image is saved to Firestore
4. Confirm the image displays in the dashboard

## Future: Upgrade to Firebase Storage

When you're ready to upgrade your Firebase plan:

1. **Upgrade to Blaze (pay-as-you-go) plan**
2. **Enable Firebase Storage** in your project
3. **Deploy the storage rules** from `firebase-storage.rules`
4. **Update the code** to use Firebase Storage instead of base64

The current code is designed to easily switch between storage methods when you upgrade. 