import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../styles/designSystem';

// Import tab navigators
import UserTabNavigator from './UserTabNavigator';
import OrganiserTabNavigator from './OrganiserTabNavigator';

// Import onboarding and auth screens
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import AuthChoiceScreen from '../screens/Auth/AuthChoiceScreen';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Import deep linking utilities
import { linkingConfig, handleDeepLink, getInitialRoute } from '../utils/deepLinking';

const Stack = createStackNavigator();

// Main App Navigator
const AppNavigator = () => {
  const { user, userProfile, loading } = useAuth();
  
  // Debug logging
  console.log('🔍 AppNavigator Debug:');
  console.log('  - User:', user?.email);
  console.log('  - UserProfile:', userProfile);
  console.log('  - AccountType:', userProfile?.accountType);
  console.log('  - Loading:', loading);
  
  // Get initial route (for web deep linking)
  const initialRoute = getInitialRoute();
  
  // Wait for user profile to load for authenticated users
  // Show loading if we're still loading auth state, OR if we have a user but no profile yet
  const shouldShowLoading = loading || (user && !userProfile);

  // Show loading screen while authentication state is being determined
  if (shouldShowLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.primary }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={{ marginTop: 16, color: Colors.text.secondary }}>Loading...</Text>
      </View>
    );
  }

  // Determine the initial route
  const getInitialRouteName = () => {
    // If we have a web deep link (like EventWeb), use it regardless of auth state
    if (initialRoute?.name === 'EventWeb') {
      console.log('🌐 Web deep link detected, routing to EventWeb');
      return 'EventWeb';
    }
    
    if (!user) {
      return initialRoute?.name || 'Onboarding';
    }
    
    // Ensure we have a userProfile before making routing decisions
    if (!userProfile) {
      console.log('⚠️ No userProfile available yet, defaulting to UserFlow');
      return 'UserFlow';
    }
    
    console.log('🔍 Routing decision based on accountType:', userProfile.accountType);
    
    if (userProfile.accountType === 'organizer') {
      console.log('🎯 Routing to OrganiserFlow');
      return 'OrganiserFlow';
    } else {
      console.log('🎯 Routing to UserFlow (accountType:', userProfile.accountType, ')');
      return 'UserFlow';
    }
  };

  const initialRouteName = getInitialRouteName();

  return (
    <NavigationContainer
      linking={linkingConfig}
      onReady={() => {
        // Handle any pending deep links when navigation is ready
        if (Platform.OS === 'web') {
          // Web deep link handling is automatic via linking config
          console.log('🔗 Navigation ready, current URL:', window.location.href);
        }
      }}
      onStateChange={(state) => {
        if (Platform.OS === 'web') {
          console.log('🔄 Navigation state changed:', state);
        }
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Web Event View - Available for ALL users (public sharing) */}
        <Stack.Screen
          name="EventWeb"
          component={require('../screens/Web/EventWebScreen').default}
          options={{
            title: 'Event Details',
            headerShown: false, // Hide header for web view
          }}
          initialParams={initialRoute?.name === 'EventWeb' ? initialRoute.params : undefined}
        />

        {/* Auth Flow - Only shown when not authenticated */}
        {!user && (
          <>
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{
                title: 'Welcome to Tikiti',
              }}
            />
            <Stack.Screen
              name="AuthChoice"
              component={AuthChoiceScreen}
              options={{
                title: 'Get Started',
              }}
            />
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{
                title: 'Choose Account Type',
              }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                title: 'Sign In',
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Create Account',
              }}
            />
          </>
        )}
        
        {/* Main App Flows - Only shown when authenticated */}
        {user && (
          <>
            <Stack.Screen
              name="UserFlow"
              component={UserTabNavigator}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="OrganiserFlow"
              component={OrganiserTabNavigator}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;