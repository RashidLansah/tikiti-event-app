import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { View, Text, Dimensions } from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../styles/designSystem';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import FloatingTabBar from '../components/FloatingTabBar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fallback design tokens in case imports fail
const defaultColors = {
  primary: { 500: '#333333' },
  text: { tertiary: '#7a7a7a' },
  white: '#FFFFFF',
  border: { light: '#f0f0f0' },
  background: { secondary: '#fafafa' },
  error: { 500: '#EF4444' },
};

const defaultSpacing = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48];
const defaultTypography = {
  fontSize: { xs: 12 },
  fontWeight: { semibold: '600' }
};
const defaultShadows = { lg: {} };

// Import User screens
import EventListScreen from '../screens/User/EventListScreen';
import EventDetailScreen from '../screens/User/EventDetailScreen';
import TicketScreen from '../screens/User/TicketScreen';
import MyTicketsScreen from '../screens/User/MyTicketsScreen';
import ProfileScreen from '../screens/User/ProfileScreen';
import NotificationCenterScreen from '../screens/User/NotificationCenterScreen';
import SocialCardScreen from '../screens/User/SocialCardScreen';
import EditSocialLinksScreen from '../screens/User/EditSocialLinksScreen';
import NetworkScreen from '../screens/User/NetworkScreen';
import ScanConnectionScreen from '../screens/User/ScanConnectionScreen';
import ConnectionDetailScreen from '../screens/User/ConnectionDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Events (to handle EventDetail navigation)
const EventsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="EventList" component={EventListScreen} />
    <Stack.Screen
      name="EventDetail"
      component={EventDetailScreen}
      options={{
        presentation: 'transparentModal',
        gestureEnabled: true,
        gestureDirection: 'vertical',
        cardOverlayEnabled: true,
        cardStyleInterpolator: ({ current: { progress }, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
          overlayStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        }),
      }}
    />
    <Stack.Screen name="Ticket" component={TicketScreen} />
    <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
  </Stack.Navigator>
);

// Stack navigator for My Tickets (to handle Ticket navigation)
const MyTicketsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="MyTicketsList" component={MyTicketsScreen} />
    <Stack.Screen name="Ticket" component={TicketScreen} />
  </Stack.Navigator>
);

// Stack navigator for Network (connections + QR scanning)
const NetworkStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="NetworkMain" component={NetworkScreen} />
    <Stack.Screen name="ScanConnection" component={ScanConnectionScreen} />
    <Stack.Screen name="ConnectionDetail" component={ConnectionDetailScreen} />
  </Stack.Navigator>
);

// Stack navigator for Profile (social card + edit links)
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="SocialCard" component={SocialCardScreen} />
    <Stack.Screen name="EditSocialLinks" component={EditSocialLinksScreen} />
  </Stack.Navigator>
);

const UserTabNavigator = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Safe access to design system values
  const safeColors = colors || defaultColors;
  const safeTypography = Typography || defaultTypography;
  const safeSpacing = Spacing || defaultSpacing;
  const safeShadows = Shadows || defaultShadows;

  // Load unread count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (user?.uid) {
        try {
          const count = await notificationService.getUnreadCount(user.uid);
          setUnreadCount(count);
        } catch (error) {
          console.error('Error loading unread count:', error);
        }
      }
    };

    loadUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventsStack}
        options={{
          tabBarLabel: 'Events',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Reset the stack to the root screen when tab is pressed
            navigation.navigate('Events', { screen: 'EventList' });
          },
        })}
      />
      <Tab.Screen
        name="My Tickets"
        component={MyTicketsStack}
        options={{
          tabBarLabel: 'My Events',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Reset the stack to the root screen when tab is pressed
            navigation.navigate('My Tickets', { screen: 'MyTicketsList' });
          },
        })}
      />
      <Tab.Screen
        name="Network"
        component={NetworkStack}
        options={{
          tabBarLabel: 'Network',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Network', { screen: 'NetworkMain' });
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Profile', { screen: 'ProfileMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default UserTabNavigator;