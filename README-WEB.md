# Tikiti Web Implementation Guide

## 🌐 Web Event Sharing Implementation

This document explains how the web version of Tikiti event sharing works and how to deploy it.

## 📋 Implementation Overview

### **Architecture Choice: React Native Web**
We've implemented **React Native Web** to share code between mobile and web platforms:

- ✅ **80-90% Code Reuse**: Same components work on mobile and web
- ✅ **Consistent UI**: Identical design across platforms  
- ✅ **Expo Integration**: Built-in web compilation support
- ✅ **SEO Friendly**: Server-side rendering capable
- ✅ **Responsive Design**: Adapts to different screen sizes

## 🚀 How It Works

### **1. Event Sharing Flow**
```
Mobile App → Share Event → Generate Link → Web View
```

1. **User shares event** from mobile app or organiser dashboard
2. **System generates shareable link**: `https://tikiti.com/events/{eventId}`
3. **Recipients click link** on any device
4. **Web version loads** with identical UI to mobile app
5. **Users can view details** and purchase/RSVP directly

### **2. Deep Linking Configuration**
```javascript
// src/utils/deepLinking.js
const linkingConfig = {
  prefixes: ['tikiti://', 'https://tikiti.com'],
  config: {
    screens: {
      EventWeb: 'events/:eventId',
      // ... other routes
    },
  },
};
```

### **3. Web-Specific Features**
- **Responsive Layout**: Adapts to desktop/tablet/mobile
- **SEO Optimization**: Meta tags for social sharing
- **App Download Promotion**: Header button to download mobile app
- **Web Share API**: Native sharing on supported browsers
- **Clipboard Fallback**: Copy link when native share unavailable

## 📱 Key Components

### **EventWebScreen.js**
- **Platform Detection**: Adapts UI for web vs mobile
- **Responsive Design**: Different layouts for different screen sizes
- **Share Integration**: Web Share API with fallbacks
- **App Promotion**: Download buttons for mobile apps

### **ShareButton.js**
- **Universal Sharing**: Works on both mobile and web
- **Platform Detection**: Uses appropriate sharing method
- **Error Handling**: Graceful fallbacks

### **Deep Linking Utils**
- **URL Parsing**: Handles incoming event links
- **Navigation**: Routes to appropriate screens
- **Link Generation**: Creates shareable URLs

## 🛠 Development Setup

### **1. Install Web Dependencies**
```bash
# Already included in Expo
npm install @expo/webpack-config
```

### **2. Update Configuration**
The `app.config.js` includes web configuration:
```javascript
web: {
  favicon: "./assets/favicon.png",
  bundler: "metro",
  output: "static"
}
```

### **3. Run Web Development**
```bash
# Start web development server
npx expo start --web

# Build for production
npx expo build:web
```

## 🌍 Deployment Options

### **Option 1: Static Hosting (Recommended)**
Deploy to Netlify, Vercel, or GitHub Pages:

```bash
# Build static files
npx expo build:web

# Deploy dist/ folder to your hosting provider
```

### **Option 2: Server with SSR**
For better SEO, use Next.js with React Native Web:

```bash
# Convert to Next.js (advanced)
npx create-next-app --example with-react-native-web
```

### **Option 3: CDN Distribution**
Use CloudFront or similar CDN for global distribution.

## 🔗 URL Structure

### **Event Links**
```
https://tikiti.com/events/northern-music-festival-2025
https://tikiti.com/events/1
```

### **Deep Link Handling**
- **Web**: Direct navigation to EventWebScreen
- **Mobile App**: Opens in native app if installed
- **Fallback**: Web version in browser

## 📊 Analytics & SEO

### **Meta Tags for Events**
```html
<meta property="og:title" content="Northern Music Festival 2025">
<meta property="og:description" content="Join us for an unforgettable night...">
<meta property="og:image" content="https://tikiti.com/events/1/poster.jpg">
```

### **Event Schema Markup**
```json
{
  "@type": "Event",
  "name": "Northern Music Festival 2025",
  "startDate": "2025-09-15T18:00",
  "location": "Tamale Cultural Centre",
  "offers": {
    "@type": "Offer",
    "price": "80",
    "priceCurrency": "GHS"
  }
}
```

## 🎯 User Experience

### **Desktop View**
- **Centered Layout**: Max-width container for readability
- **Larger Images**: Enhanced visual presentation
- **App Download Header**: Prominent mobile app promotion

### **Mobile Web**
- **Native-like Experience**: Identical to mobile app
- **Touch-Optimized**: Large buttons and touch targets
- **Fast Loading**: Optimized bundle size

### **Tablet View**
- **Adaptive Layout**: Between mobile and desktop
- **Touch & Mouse**: Supports both interaction methods

## 🔧 Customization

### **Styling Differences**
```javascript
const styles = StyleSheet.create({
  container: {
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    marginHorizontal: 'auto',
  },
  // ... responsive styles
});
```

### **Web-Only Features**
```javascript
if (Platform.OS === 'web') {
  // Web-specific functionality
  window.gtag('event', 'page_view');
}
```

## 📈 Performance Optimization

### **Bundle Splitting**
- **Core App**: Essential components
- **Web Specific**: Additional web features
- **Lazy Loading**: Event images and non-critical components

### **SEO Optimization**
- **Server-Side Rendering**: Pre-render event pages
- **Meta Tag Generation**: Dynamic meta tags per event
- **Structured Data**: Event schema markup

## 🧪 Testing

### **Cross-Platform Testing**
```bash
# Test mobile
npx expo start

# Test web
npx expo start --web

# Test deep links
npx uri-scheme open tikiti://events/1 --ios
```

### **Browser Compatibility**
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile browsers
- ✅ Progressive Web App support

## 🚀 Production Deployment

### **Environment Variables**
```bash
EXPO_PUBLIC_API_URL=https://api.tikiti.com
EXPO_PUBLIC_WEB_URL=https://tikiti.com
```

### **Build & Deploy**
```bash
# Production build
npx expo build:web

# Deploy to hosting
npm run deploy
```

## 🔜 Future Enhancements

### **Progressive Web App**
- **Offline Support**: Cache event data
- **Push Notifications**: Event reminders
- **Home Screen Install**: Native app-like experience

### **Advanced Features**
- **Payment Integration**: Stripe web checkout
- **Social Login**: OAuth for web
- **Real-time Updates**: Live ticket availability

## 📞 Support

For web implementation questions:
1. Check Expo Web documentation
2. Review React Native Web guides  
3. Test on multiple browsers
4. Monitor web analytics

---

**The web implementation provides a seamless way for users to discover and book events directly from shared links, driving conversion and user acquisition! 🎉**