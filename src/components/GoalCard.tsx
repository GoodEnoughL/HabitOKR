import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Category, Goal } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatSlash } from '../utils/date';
import { formatProgressPct, goalProgress } from '../utils/task';
import { ProgressBar } from './ProgressBar';

interface Props {
  goal: Goal;
  category?: Category;
  onPress?: () => void;
}

export function GoalCard({ goal, category, onPress }: Props) {
  const progress = goalProgress(goal);
  const hasDates = !!(goal.startDate && goal.endDate);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.title} numberOfLines={1}>
        {goal.name}
      </Text>

      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.dateText}>
          {hasDates ? `${formatSlash(goal.startDate!)} - ${formatSlash(goal.endDate!)}` : '未设置时间'}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        {category ? (
          <View style={[styles.tag, { backgroundColor: category.color + '1A' }]}>
            <Ionicons name="folder" size={11} color={category.color} />
            <Text style={[styles.tagText, { color: category.color }]}>{category.name}</Text>
          </View>
        ) : null}
        <ProgressBar progress={progress} color={goal.color} height={5} />
        <Text style={styles.pct}>{formatProgressPct(progress)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  dateText: { fontSize: 12, color: colors.textSecondary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagText: { fontSize: 11, fontWeight: '600' },
  pct: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', minWidth: 44, textAlign: 'right' },
});
