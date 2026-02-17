import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../styles/designSystem';

const ThemeContext = createContext({});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Dark mode color palette (aligned with web dashboard .dark CSS variables)
const DarkColors = {
  // Primary (inverted for dark mode — light on dark, matches web .dark --primary oklch(0.922 0 0))
  primary: {
    50: '#0a0a0a',
    100: '#141414',
    200: '#1a1a1a',
    300: '#2a2a2a',
    400: '#525252',
    500: '#e8e8e8', // Light primary in dark mode
    600: '#d4d4d4',
    700: '#a3a3a3',
    800: '#737373',
    900: '#525252',
  },

  // Secondary (matches web .dark --secondary oklch(0.269 0 0))
  secondary: {
    50: '#0a0a0a',
    100: '#141414',
    200: '#1a1a1a',
    300: '#2a2a2a',
    400: '#3a3a3a', // Matches web dark --secondary
    500: '#525252',
    600: '#737373',
    700: '#a3a3a3',
    800: '#d4d4d4',
    900: '#e8e8e8',
  },

  // Success (optimized for dark backgrounds)
  success: {
    50: '#0F2E1D',
    100: '#166534',
    200: '#15803D',
    300: '#16A34A',
    400: '#22C55E',
    500: '#4ADE80',
    600: '#86EFAC',
    700: '#BBF7D0',
    800: '#DCFCE7',
    900: '#F0FDF4',
  },
  warning: {
    50: '#451A03',
    100: '#92400E',
    200: '#B45309',
    300: '#D97706',
    400: '#F59E0B',
    500: '#FBBF24',
    600: '#FCD34D',
    700: '#FDE68A',
    800: '#FEF3C7',
    900: '#FFFBEB',
  },
  error: {
    50: '#450A0A',
    100: '#991B1B',
    200: '#B91C1C',
    300: '#DC2626',
    400: '#EF4444',
    500: '#F87171',
    600: '#FCA5A5',
    700: '#FECACA',
    800: '#FEE2E2',
    900: '#FEF2F2',
  },

  // Info Blue (optimized for dark backgrounds)
  info: {
    50: '#1E3A8A',
    100: '#1E40AF',
    200: '#1D4ED8',
    300: '#2563EB',
    400: '#3B82F6',
    500: '#60A5FA',
    600: '#93C5FD',
    700: '#BFDBFE',
    800: '#DBEAFE',
    900: '#EFF6FF',
  },

  // Neutral Grays
  gray: {
    50: '#0A0A0A',
    100: '#1A1A1A',
    200: '#2A2A2A',
    300: '#3A3A3A',
    400: '#525252',
    500: '#737373',
    600: '#A3A3A3',
    700: '#D4D4D4',
    800: '#E5E5E5',
    900: '#F5F5F5',
  },

  // Pure Colors
  white: '#FFFFFF',
  black: '#000000',

  // Dark Backgrounds (matches web .dark --background oklch(0.145 0 0))
  background: {
    primary: '#141414',   // Matches web .dark --background
    secondary: '#1a1a1a', // Matches web .dark --card oklch(0.205 0 0)
    tertiary: '#2a2a2a',  // Elevated surfaces
  },

  // Dark Text Colors (matches web .dark --foreground oklch(0.985 0 0))
  text: {
    primary: '#fafafa',    // Matches web .dark --foreground
    secondary: '#d4d4d4',
    tertiary: '#7a7a7a',   // Matches web .dark --muted-foreground oklch(0.708 0 0)
    disabled: '#525252',
    inverse: '#141414',
  },

  // Dark Borders (matches web .dark --border oklch(1 0 0 / 10%))
  border: {
    light: 'rgba(255,255,255,0.1)',   // Matches web dark --border
    medium: 'rgba(255,255,255,0.15)', // Matches web dark --input
    dark: '#3a3a3a',
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Get current theme colors
  const currentColors = isDarkMode ? DarkColors : Colors;

  const value = {
    isDarkMode,
    toggleTheme,
    colors: currentColors,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
