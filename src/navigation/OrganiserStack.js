import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Organiser screens
import DashboardScreen from '../screens/Organiser/DashboardScreen';
import CreateEventFlow from '../screens/Organiser/CreateEventFlow';
import ScanTicketScreen from '../screens/Organiser/ScanTicketScreen';
import EventAttendeesScreen from '../screens/Organiser/EventAttendeesScreen';
import EventDetailScreen from '../screens/Organiser/EventDetailScreen';

const Stack = createStackNavigator();

const OrganiserStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Organiser Dashboard',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: '#007AFF',
          headerTransparent: true,
          headerTitle: '',
        }}
      />
      
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventFlow}
        options={{
          title: 'Create New Event',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
        }}
      />
      
      <Stack.Screen
        name="ScanTicket"
        component={ScanTicketScreen}
        options={{
          title: 'Scan Tickets',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: '#fff',
          headerTransparent: true,
          headerTitle: '',
        }}
      />
      
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          title: 'Event Details',
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="EventAttendees"
        component={EventAttendeesScreen}
        options={{
          title: 'Event Attendees',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default OrganiserStack;