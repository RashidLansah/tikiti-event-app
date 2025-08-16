import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// Import our main navigation component
import AppNavigator from './src/navigation/AppNavigator';
import PublicApp from './src/PublicApp';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Check if we're on web and accessing a public route
const isPublicWebRoute = () => {
  if (Platform.OS !== 'web') {
    return false;
  }
  
  try {
    if (typeof window !== 'undefined' && window.location && window.location.pathname) {
      const path = window.location.pathname;
      console.log('🌐 Checking web path:', path);
      return path.startsWith('/events/');
    }
  } catch (error) {
    console.log('Error checking web route:', error);
  }
  
  return false;
};

export default function App() {
  // If this is a public web route, use the public app (no auth required)
  if (isPublicWebRoute()) {
    console.log('🌐 Using PublicApp for public web route');
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <PublicApp />
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  // Otherwise, use the normal app with authentication
  console.log('📱 Using normal app with authentication');
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
