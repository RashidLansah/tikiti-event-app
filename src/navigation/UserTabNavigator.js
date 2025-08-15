import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../styles/designSystem';
import { useTheme } from '../context/ThemeContext';

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
  
  // Safe access to design system values
  const safeColors = colors || defaultColors;
  const safeTypography = Typography || defaultTypography;
  const safeSpacing = Spacing || defaultSpacing;
  const safeShadows = Shadows || defaultShadows;

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