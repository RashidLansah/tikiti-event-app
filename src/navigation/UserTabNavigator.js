import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../styles/designSystem';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

// Fallback design tokens in case imports fail
const defaultColors = {
  primary: { 500: '#007AFF' },
  text: { tertiary: '#999' },
  white: '#FFFFFF',
  border: { light: '#E5E5E5' }
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
    <Stack.Screen name="EventDetail" component={EventDetailScreen} />
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
      screenOptions={({ route }) => {
        // Ensure route exists before accessing its properties
        const routeName = route?.name || '';
        
        return {
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'circle'; // default icon

            if (routeName === 'Events') {
              iconName = 'calendar';
            } else if (routeName === 'My Tickets') {
              iconName = 'bookmark';
            } else if (routeName === 'Notifications') {
              iconName = 'bell';
            } else if (routeName === 'Profile') {
              iconName = 'user';
            }

            return <Feather name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: safeColors.primary[500],
          tabBarInactiveTintColor: safeColors.text.tertiary,
          tabBarStyle: {
            backgroundColor: safeColors.background.secondary,
            borderTopWidth: 1,
            borderTopColor: safeColors.border.light,
            height: 90,
            paddingBottom: 25,
            paddingTop: safeSpacing[3],
            ...safeShadows.lg,
          },
          tabBarLabelStyle: {
            fontSize: safeTypography.fontSize.xs,
            fontWeight: safeTypography.fontWeight.semibold,
            marginTop: safeSpacing[1],
          },
          headerShown: false,
        };
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
          tabBarLabel: 'Tickets',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Reset the stack to the root screen when tab is pressed
            navigation.navigate('My Tickets', { screen: 'MyTicketsList' });
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationCenterScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ position: 'relative' }}>
              <Feather name="bell" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -6,
                  backgroundColor: safeColors.error?.[500] || '#FF3B30',
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Mark all notifications as read when viewing
            if (user?.uid && unreadCount > 0) {
              notificationService.markAllAsRead(user.uid).then(() => {
                setUnreadCount(0);
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default UserTabNavigator;