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

/**
 * 目标色板（图片 3）：10 个颜色，从红（10）到蓝（1）。
 * index 0 对应数字 10（红），index 9 对应数字 1（蓝）。
 * 用于目标颜色（图片 2 名称右侧圆点、图片 1 进度条）以及分类颜色。
 */
export const goalColorPalette = [
  '#E5484D', // 10 红
  '#F76B5C', // 9
  '#FF8A3D', // 8 橙
  '#FFA94D', // 7
  '#FFD43B', // 6 黄
  '#C5D83C', // 5
  '#6BCB77', // 4 绿
  '#3ECF8E', // 3
  '#2EC4B6', // 2 青
  '#3B82F6', // 1 蓝
];

/** 由颜色取其在色板中的序号 1-10，找不到返回 10 */
export function paletteNumber(color: string): number {
  const i = goalColorPalette.indexOf(color);
  return i === -1 ? 10 : 10 - i;
}

/** 目标默认颜色（绿，对应图片 2 名称旁的绿色圆点） */
export const defaultGoalColor = goalColorPalette[6];

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
