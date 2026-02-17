// Tikiti Design System
// Aligned with tikiti-web dashboard — neutral/monochrome palette, Plus Jakarta Sans

export const Colors = {
  // Primary — Dark/Black (matches web --primary oklch(0.205 0 0) and inline #333)
  primary: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#333333', // Main primary
    600: '#2a2a2a',
    700: '#1a1a1a', // Matches web oklch(0.205 0 0)
    800: '#141414', // Matches web --foreground oklch(0.145 0 0)
    900: '#0a0a0a',
  },

  // Secondary — Light grays (matches web --secondary oklch(0.97 0 0) and inline #f0f0f0)
  secondary: {
    50: '#fefefe',
    100: '#fafafa',
    200: '#f5f5f5', // Matches web --secondary
    300: '#f0f0f0', // Matches web inline secondary bg
    400: '#e8e8e8', // Matches web inline hover
    500: '#d4d4d4',
    600: '#a3a3a3',
    700: '#7a7a7a', // Matches web --muted-foreground
    800: '#525252',
    900: '#333333',
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

  // Warning Amber
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

  // Info Blue
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
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

  // Backgrounds (matches web white primary)
  background: {
    primary: '#fefff7',
    secondary: '#fafafa',  // Matches web subtle bg
    tertiary: '#f5f5f5',   // Matches web --secondary oklch(0.97 0 0)
  },

  // Text Colors (matches web --foreground)
  text: {
    primary: '#141414',    // Matches web oklch(0.145 0 0)
    secondary: '#525252',  // Slightly darker secondary
    tertiary: '#7a7a7a',   // Matches web --muted-foreground / inline #86868b
    disabled: '#a3a3a3',
    inverse: '#FFFFFF',
  },

  // Border Colors (matches web --border oklch(0.922 0 0))
  border: {
    light: '#f0f0f0',
    medium: '#e8e8e8',     // Matches web --border
    dark: '#d4d4d4',
  },
};

export const Typography = {
  // Font Families — Plus Jakarta Sans (matches web dashboard)
  fontFamily: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    extrabold: 'PlusJakartaSans-ExtraBold',
    // Legacy aliases for backward compatibility
    primary: 'PlusJakartaSans-Bold',
    text: 'PlusJakartaSans-Regular',
    mono: 'Courier New',
  },

  // Font Sizes
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

  // Font Weights
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

  // Typography Hierarchy
  styles: {
    // Display Styles
    display: {
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontSize: 72,
      fontWeight: '800',
      lineHeight: 1.1,
      letterSpacing: -1,
    },

    // Heading Styles
    h1: {
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontSize: 48,
      fontWeight: '800',
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: 'PlusJakartaSans-Bold',
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 1.25,
      letterSpacing: -0.25,
    },
    h3: {
      fontFamily: 'PlusJakartaSans-Bold',
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.35,
    },
    h5: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.45,
    },

    // Body Text Styles
    bodyLarge: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 1.6,
    },
    body: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    bodySmall: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
    },

    // UI Text Styles
    button: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0.25,
    },
    caption: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    overline: {
      fontFamily: 'PlusJakartaSans-SemiBold',
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
  md: 8,      // Matches web rounded-md
  lg: 12,     // Matches web rounded-lg
  xl: 16,     // Matches web rounded-xl
  '2xl': 20,  // Matches web rounded-2xl
  '3xl': 24,  // Matches web rounded-[24px] for cards
  '4xl': 30,  // For pill navigation items (web rounded-[30px])
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Component Styles
export const Components = {
  // Button Variants (matches web shadcn/ui button)
  button: {
    primary: {
      backgroundColor: Colors.primary[500], // Dark bg (matches web bg-primary)
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[6],
      ...Shadows.sm,
    },
    secondary: {
      backgroundColor: Colors.secondary[200], // Light gray bg (matches web bg-secondary)
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[6],
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: Colors.border.medium,
      borderWidth: 1,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[6],
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[6],
    },
    destructive: {
      backgroundColor: Colors.error[600],
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[6],
    },
  },

  // Card Styles (matches web rounded-[24px] border-black/10)
  card: {
    primary: {
      backgroundColor: Colors.white,
      borderRadius: BorderRadius['3xl'], // 24px
      padding: Spacing[5],
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)', // Matches web border-black/10
      ...Shadows.sm,
    },
    elevated: {
      backgroundColor: Colors.white,
      borderRadius: BorderRadius['3xl'],
      padding: Spacing[6],
      ...Shadows.md,
    },
  },

  // Input Styles (matches web transparent bg, neutral focus ring)
  input: {
    primary: {
      backgroundColor: 'transparent',
      borderColor: Colors.border.medium,
      borderWidth: 1,
      borderRadius: BorderRadius.md, // 8px matches web rounded-md
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[4],
      fontSize: Typography.fontSize.base,
      color: Colors.text.primary,
    },
    focused: {
      borderColor: Colors.primary[400], // Neutral gray focus
      borderWidth: 1,
      shadowColor: Colors.primary[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    active: {
      borderColor: Colors.primary[500],
      borderWidth: 2,
      backgroundColor: Colors.secondary[100],
      shadowColor: Colors.primary[400],
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
