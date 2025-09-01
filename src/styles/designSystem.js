// Tikiti Design System
// Inspired by GoFundMe and Eventbrite's modern, elegant design

export const Colors = {
  // Primary Brand Colors - Tikiti Orange
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5', 
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#FF6B35', // Main brand color - Tikiti Orange
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  
  // Secondary Colors
  secondary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  
  // Success Green
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  // Warning Orange
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Error Red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Neutral Grays
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Pure Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
  },
  
  // Text Colors
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    disabled: '#94A3B8',
    inverse: '#FFFFFF',
  },
  
  // Border Colors
  border: {
    light: '#F1F5F9',
    medium: '#E2E8F0',
    dark: '#CBD5E1',
  },
};

export const Typography = {
  // Font Families - System Fonts
  fontFamily: {
    primary: 'System', // System font for headings
    text: 'System', // System font for body text
    mono: 'Courier New', // Monospace font
  },
  
  // Font Sizes - SF Pro Scale
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
  },
  
  // Font Weights - SF Pro Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },

  // Typography Hierarchy - SF Pro Styles
  styles: {
    // Display Styles
    display: {
      fontFamily: 'System',
      fontSize: 72,
      fontWeight: '900',
      lineHeight: 1.1,
      letterSpacing: -1,
    },
    
    // Heading Styles
    h1: {
      fontFamily: 'System',
      fontSize: 48,
      fontWeight: '800',
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: 'System',
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 1.25,
      letterSpacing: -0.25,
    },
    h3: {
      fontFamily: 'System',
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: 'System',
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.35,
    },
    h5: {
      fontFamily: 'System',
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: 'System',
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.45,
    },
    
    // Body Text Styles
    bodyLarge: {
      fontFamily: 'System',
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 1.6,
    },
    body: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    bodySmall: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    
    // UI Text Styles
    button: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0.25,
    },
    caption: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    overline: {
      fontFamily: 'System',
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  },
};

export const Spacing = {
  // Base spacing unit: 4px
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Component Styles
export const Components = {
  // Button Variants
  button: {
    primary: {
      backgroundColor: Colors.primary[500],
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[6],
      ...Shadows.md,
    },
    secondary: {
      backgroundColor: Colors.white,
      borderColor: Colors.border.medium,
      borderWidth: 1,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[6],
      ...Shadows.sm,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[6],
    },
  },
  
  // Card Styles
  card: {
    primary: {
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.xl,
      padding: Spacing[6],
      borderWidth: 1,
      borderColor: Colors.border.light,
      ...Shadows.md,
    },
    elevated: {
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.xl,
      padding: Spacing[6],
      ...Shadows.lg,
    },
  },
  
  // Input Styles
  input: {
    primary: {
      backgroundColor: Colors.white,
      borderColor: Colors.border.medium,
      borderWidth: 1,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[4],
      fontSize: Typography.fontSize.base,
      color: Colors.text.primary,
    },
    focused: {
      borderColor: Colors.primary[500],
      borderWidth: 2,
      ...Shadows.sm,
      // Double stroke effect
      shadowColor: Colors.primary[500],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    active: {
      borderColor: Colors.primary[500],
      borderWidth: 2,
      backgroundColor: Colors.primary[50],
      // Enhanced double stroke effect
      shadowColor: Colors.primary[500],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 3,
    },
  },
};

// Layout constants
export const Layout = {
  // Container max widths
  maxWidth: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Screen padding
  screenPadding: Spacing[5],
  
  // Safe area padding
  safeAreaPadding: {
    top: 50,
    bottom: 34,
  },
};

// Animation durations
export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};