import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { linkingConfig } from './utils/deepLinking';
import EventWebScreen from './screens/Web/EventWebScreen';

const Stack = createStackNavigator();

// Public app for web-only public routes (no authentication required)
const PublicApp = () => {
  console.log('🌐 PublicApp: Rendering public-only app for web');
  
  return (
    <NavigationContainer linking={linkingConfig}>
      <Stack.Navigator
        initialRouteName="EventWeb"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="EventWeb"
          component={EventWebScreen}
          options={{
            title: 'Event Details',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default PublicApp;
