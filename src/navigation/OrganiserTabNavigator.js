import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../styles/designSystem';

// Import Organiser screens
import DashboardScreen from '../screens/Organiser/DashboardScreen';
import CreateEventScreen from '../screens/Organiser/CreateEventScreen';
import ScanTicketScreen from '../screens/Organiser/ScanTicketScreen';
import EventDetailScreen from '../screens/Organiser/EventDetailScreen';
import EventAttendeesScreen from '../screens/Organiser/EventAttendeesScreen';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Dashboard (to handle CreateEvent and EventDetail navigation)
const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    <Stack.Screen name="EventAttendees" component={EventAttendeesScreen} />
    <Stack.Screen name="ScanTicket" component={ScanTicketScreen} />
  </Stack.Navigator>
);

// Import the Organiser Profile Screen
import OrganiserProfileScreen from '../screens/Organiser/OrganiserProfileScreen';

const OrganiserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'grid';
          } else if (route.name === 'Scanner') {
            iconName = 'camera';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.success[500],
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border.light,
          paddingBottom: Spacing[2],
          paddingTop: Spacing[2],
          height: 80,
          ...Shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.semibold,
          marginTop: Spacing[1],
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{
          tabBarLabel: 'Events',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Reset the stack to the root screen when tab is pressed
            navigation.navigate('Dashboard', { screen: 'Dashboard' });
          },
        })}
      />
      <Tab.Screen 
        name="Scanner" 
        component={ScanTicketScreen}
        options={{
          tabBarLabel: 'Scanner',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={OrganiserProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  placeholderText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default OrganiserTabNavigator;