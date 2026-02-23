import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shadows } from '../styles/designSystem';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

// Screens where the tab bar should be hidden
const HIDDEN_ON_SCREENS = ['EventDetail', 'Ticket', 'NotificationCenter', 'ScanConnection', 'ConnectionDetail', 'SocialCard', 'EditSocialLinks'];

const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();

  // Check if the currently focused tab's nested stack screen should hide the tab bar
  const focusedRoute = state.routes[state.index];
  const focusedScreenName = getFocusedRouteNameFromRoute(focusedRoute);

  if (focusedScreenName && HIDDEN_ON_SCREENS.includes(focusedScreenName)) {
    return null;
  }

  // Map route names to icons (matching Figma design)
  const iconMap = {
    'Events': 'calendar',
    'My Tickets': 'heart',
    'Network': 'globe',
    'Profile': 'user',
    'Dashboard': 'grid',
    'Scanner': 'camera',
  };

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 20) }]}>
      <View style={[styles.container, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = iconMap[route.name] || 'circle';

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (isFocused) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: true }}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.activeTab, { backgroundColor: isDarkMode ? colors.background.secondary : Colors.white }]}
              >
                <Feather name={iconName} size={16} color={colors.primary[500]} />
                <Text style={[styles.activeLabel, { color: colors.primary[500] }]}>{label}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: false }}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.inactiveTab}
            >
              <Feather name={iconName} size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: 58,
    paddingHorizontal: 10,
    gap: 16,
    ...Shadows.md,
  },
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 30,
    paddingHorizontal: 12,
    height: 36,
    gap: 9,
  },
  activeLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    color: Colors.primary[500],
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    width: 36,
    borderRadius: 30,
  },
});

export default FloatingTabBar;
