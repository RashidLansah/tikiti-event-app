import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import User screens
import EventListScreen from '../screens/User/EventListScreen';
import EventDetailScreen from '../screens/User/EventDetailScreen';
import TicketScreen from '../screens/User/TicketScreen';

const Stack = createStackNavigator();

const UserStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="EventList"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="EventList"
        component={EventListScreen}
        options={{
          title: 'Events',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: '#007bff',
          headerTransparent: true,
          headerTitle: '',
        }}
      />
      
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={({ route }) => ({
          title: route.params?.event?.name || 'Event Details',
          headerStyle: {
            backgroundColor: '#007bff',
          },
          headerTintColor: '#fff',
        })}
      />
      
      <Stack.Screen
        name="Ticket"
        component={TicketScreen}
        options={{
          title: 'My Ticket',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: '#007bff',
          headerTransparent: true,
          headerTitle: '',
        }}
      />
    </Stack.Navigator>
  );
};

export default UserStack;