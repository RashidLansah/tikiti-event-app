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

// Premium Dark mode color palette (inspired by reference image)
const DarkColors = {
  // Primary Brand Colors (enhanced for dark theme)
  primary: {
    50: '#1E3A8A',
    100: '#1E40AF',
    200: '#2563EB',
    300: '#3B82F6',
    400: '#60A5FA',
    500: '#3B82F6', // Main brand blue
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Secondary Colors (refined for dark theme)
  secondary: {
    50: '#0F172A',
    100: '#1E293B',
    200: '#334155',
    300: '#475569',
    400: '#64748B',
    500: '#94A3B8',
    600: '#CBD5E1',
    700: '#E2E8F0',
    800: '#F1F5F9',
    900: '#F8FAFC',
  },
  
  // Success, Warning, Error (optimized for dark backgrounds)
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
  
  // Rich Dark Grays (like reference image)
  gray: {
    50: '#0A0A0A',   // Almost black
    100: '#1A1A1A',  // Very dark gray
    200: '#2A2A2A',  // Dark gray
    300: '#3A3A3A',  // Medium dark gray
    400: '#525252',  // Medium gray
    500: '#737373',  // Light gray
    600: '#A3A3A3',  // Lighter gray
    700: '#D4D4D4',  // Very light gray
    800: '#E5E5E5',  // Almost white gray
    900: '#F5F5F5',  // Very light
  },
  
  // Pure Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Premium Dark Backgrounds (matching reference)
  background: {
    primary: '#0A0A0A',    // Deep black like reference
    secondary: '#1A1A1A',  // Card backgrounds
    tertiary: '#2A2A2A',   // Elevated surfaces
  },
  
  // Optimized Dark Text Colors
  text: {
    primary: '#FFFFFF',     // Pure white for main text
    secondary: '#E5E5E5',   // Light gray for secondary text
    tertiary: '#A3A3A3',    // Medium gray for tertiary text
    disabled: '#525252',    // Darker gray for disabled
    inverse: '#0A0A0A',     // Dark text for light backgrounds
  },
  
  // Refined Dark Borders
  border: {
    light: '#2A2A2A',      // Subtle borders
    medium: '#3A3A3A',     // Medium borders
    dark: '#525252',       // Strong borders
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
