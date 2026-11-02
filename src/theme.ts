export const colors = {
  bg: '#F6F7F9',
  card: '#FFFFFF',
  primary: '#2F80ED',
  primaryDark: '#1B6AD9',
  primaryLight: '#EAF2FF',
  text: '#1B1D21',
  textSecondary: '#8A8F99',
  textTertiary: '#B9BEC7',
  danger: '#FF4D4F',
  dangerBg: '#FFF1F0',
  success: '#34C759',
  successLight: '#E8F9EE',
  warning: '#FF9500',
  border: '#EFEFF2',
  overlay: 'rgba(0,0,0,0.35)',
};

export const accentPalette = [
  '#FF7A45',
  '#2F80ED',
  '#34C759',
  '#AF52DE',
  '#FF2D55',
  '#5AC8FA',
  '#FFCC00',
  '#00C7BE',
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
};

export const font = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  tiny: { fontSize: 11, fontWeight: '400' as const, color: colors.textTertiary },
};
