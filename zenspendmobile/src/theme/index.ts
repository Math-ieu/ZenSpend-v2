// Design tokens for the ZenSpend mobile app.
// Colors mirror the web frontend's CSS variables (light theme) so the two
// products stay visually consistent.

export const colors = {
  primary: '#FF7F00',
  primaryLight: '#FF9F40',
  primaryDark: '#E67300',
  secondary: '#00A4E6',
  accent: '#8B5CF6',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',

  background: '#FFFFFF',
  foreground: '#111827',
  muted: '#6B7280',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const theme = { colors, spacing, radius, fontSize };
export type Theme = typeof theme;
