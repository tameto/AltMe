// V4 Dark Premium theme — extracted from PencilDesign-AltMe.pen
export const colors = {
  primary: '#7DD3FC',
  primaryLight: '#BAE6FD',
  primaryDark: '#38BDF8',
  secondary: '#00D4FF',
  secondaryLight: '#67E8F9',
  accent: '#D4A853',
  success: '#34D399',
  error: '#EF4444',
  warning: '#F59E0B',

  background: '#0F172A',
  backgroundSecondary: '#131C2E',
  surface: '#1E293B',
  surfaceSecondary: '#1E293B',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',
  textDark: '#F8FAFC',

  border: '#334155',
  borderLight: '#1E293B',

  backgroundDark: '#0F172A',
  surfaceDark: '#1E293B',
  textSecondaryDark: '#94A3B8',
  borderDark: '#334155',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 40,
} as const;

export const glassmorphism = {
  card: { bg: '#FFFFFF12', border: '#FFFFFF25', blur: 16 },
  bubble: {
    ai: { bg: '#FFFFFF4D', border: '#FFFFFF15' },
    user: { bg: '#7DD3FC4D', border: '#7DD3FC30' },
  },
  input: { bg: '#FFFFFF0D', border: '#FFFFFF15' },
} as const;

export const goldGradient = {
  colors: ['#E8C567', '#C9A033', '#A07B1A'] as const,
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
} as const;

export const sendGradient = {
  colors: ['#7DD3FC', '#38BDF8'] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

export const tabBarColors = {
  background: '#0F172AEE',
  active: '#00D4FF',
  inactive: '#64748B',
  border: '#FFFFFF15',
} as const;

export const fontFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;
