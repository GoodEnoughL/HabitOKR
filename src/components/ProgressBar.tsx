import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

interface Props {
  progress: number; // 0-1
  color?: string;
  height?: number;
  trackColor?: string;
}

export function ProgressBar({ progress, color = colors.primary, height = 6, trackColor = colors.border }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: trackColor, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${p * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}
