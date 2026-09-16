import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import EventListScreen from '../screens/User/EventListScreen';
import EventDetailScreen from '../screens/User/EventDetailScreen';
import TicketScreen from '../screens/User/TicketScreen';
import NotificationCenterScreen from '../screens/User/NotificationCenterScreen';
import RegistrationSuccessScreen from '../screens/User/RegistrationSuccessScreen';
import SavedScreen from '../screens/User/SavedScreen';
import MyTicketsScreen from '../screens/User/MyTicketsScreen';
import ProfileScreen from '../screens/User/ProfileScreen';

const PG = {
  red: '#f44929',
  fg: '#202220',
  bg: '#faf9f2',
  muted: '#65675d',
  line: '#deded4',
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HIDE_TAB_ON = ['EventDetail', 'Ticket', 'NotificationCenter', 'RegistrationSuccess'];

const EventsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EventList" component={EventListScreen} />
    <Stack.Screen
      name="EventDetail"
      component={EventDetailScreen}
      options={{
        presentation: 'transparentModal',
        gestureEnabled: Platform.OS === 'ios',
        gestureDirection: 'vertical',
        cardOverlayEnabled: true,
        cardStyleInterpolator: ({ current: { progress }, layouts }) => ({
          cardStyle: {
            transform: [{
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
                extrapolate: 'clamp',
              }),
            }],
          },
          overlayStyle: {
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
          },
        }),
      }}
    />
    <Stack.Screen name="Ticket" component={TicketScreen} />
    <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
    <Stack.Screen
      name="RegistrationSuccess"
      component={RegistrationSuccessScreen}
      options={{ presentation: 'modal', gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const MyTicketsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyTicketsList" component={MyTicketsScreen} />
    <Stack.Screen name="Ticket" component={TicketScreen} />
  </Stack.Navigator>
);

// Reference-style tab bar: sticky bottom, paper bg with blur, red for active
function PGTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  // Hide on deep screens
  const focusedRoute = state.routes[state.index];
  const focusedScreen = getFocusedRouteNameFromRoute(focusedRoute);
  if (focusedScreen && HIDE_TAB_ON.includes(focusedScreen)) return null;

  const tabs = [
    { name: 'Events', icon: 'compass', label: 'Discover' },
    { name: 'Saved', icon: 'heart', label: 'Saved' },
    { name: 'My Tickets', icon: 'credit-card', label: 'Tickets' },
    { name: 'Profile', icon: 'user', label: 'You' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map(({ name, icon, label }, i) => {
        const route = state.routes.find((r) => r.name === name);
        if (!route) return null;
        const index = state.routes.indexOf(route);
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(name);
        };

        return (
          <TouchableOpacity key={name} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.tabInner}>
              <Feather name={icon} size={22} color={focused ? PG.red : PG.muted} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const UserTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <PGTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Events" component={EventsStack} />
    <Tab.Screen name="Saved" component={SavedScreen} />
    <Tab.Screen name="My Tickets" component={MyTicketsStack} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(250,249,242,0.96)',
    borderTopWidth: 1,
    borderTopColor: PG.line,
    paddingTop: 11,
    paddingHorizontal: 5,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabTouch: { width: '100%' },
  tabInner: { alignItems: 'center', gap: 5 },
  tabLabel: { fontSize: 12, color: PG.muted, marginTop: 2 },
  tabLabelActive: { color: PG.red, fontWeight: '700' },
});

export default UserTabNavigator;
