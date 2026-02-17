import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../styles/designSystem';
import FloatingTabBar from '../components/FloatingTabBar';

// Import Organiser screens
import DashboardScreen from '../screens/Organiser/DashboardScreen';
import CreateEventFlow from '../screens/Organiser/CreateEventFlow';
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
    <Stack.Screen name="DashboardHome" component={DashboardScreen} />
    <Stack.Screen name="CreateEvent" component={CreateEventFlow} />
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
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
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
            navigation.navigate('Dashboard', { screen: 'DashboardHome' });
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