export const COLORS = {
  dark: {
    primary: '#FF6B35', // Vibrant food-accent orange
    primaryLight: 'rgba(255, 107, 53, 0.15)',
    secondary: '#2A9D8F', // Beautiful teal
    secondaryLight: 'rgba(42, 157, 143, 0.15)',
    success: '#2EC4B6', // Emerald success
    successLight: 'rgba(46, 196, 182, 0.15)',
    error: '#E71D36', // Coral red
    errorLight: 'rgba(231, 29, 54, 0.15)',
    warning: '#FF9F1C', // Amber warning
    warningLight: 'rgba(255, 159, 28, 0.15)',
    background: '#0F172A', // Dark slate bg
    surface: '#1E293B', // Dark slate surface
    surfaceLight: '#334155', // Hover/Active surface
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    overlay: 'rgba(15, 23, 42, 0.75)',
  },
  light: {
    primary: '#FF6B35',
    primaryLight: 'rgba(255, 107, 53, 0.1)',
    secondary: '#2A9D8F',
    secondaryLight: 'rgba(42, 157, 143, 0.1)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.1)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    background: '#F8FAFC', // Crisp white-blue bg
    surface: '#FFFFFF', // Clean white cards
    surfaceLight: '#F1F5F9', // Light gray hover/active
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    overlay: 'rgba(15, 23, 42, 0.4)',
  },
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 38,
    xxxl: 46,
  },
};

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.0,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8.3,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16.0,
    elevation: 16,
  },
};

export type ThemeType = typeof COLORS.dark;

export const BREAKPOINTS = {
  medium: 1024,
  large: 1366,
  xlarge: 1600,
};
