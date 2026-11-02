import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  label: string;
  color?: string;
  bg?: string;
}

export function Chip({ label, color = colors.textSecondary, bg = colors.bg }: Props) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '500' },
});
