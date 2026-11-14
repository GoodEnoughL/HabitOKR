import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Task } from '../types';
import { isToday, weekdayCN } from '../utils/date';
import { frequencyLabel, HABIT_TYPE_META } from '../utils/task';
import { Emoji } from './Emoji';

interface Props {
  task: Task;
  dateKey: string;
  done: boolean;
  todayCount: number;
  onToggle: () => void;
  onPress?: () => void;
}

export function TaskCard({ task, dateKey, done, todayCount, onToggle, onPress }: Props) {
  const typeMeta = HABIT_TYPE_META[task.habitType] ?? HABIT_TYPE_META.wisdom;
  const meta = [typeMeta.label, frequencyLabel(task), weekdayCN(dateKey), isToday(dateKey) ? '今天' : '']
    .filter(Boolean)
    .join(' · ');
  const subtitle = task.why?.trim() || meta;
  const multi = task.dailyTarget > 1;
  const paused = !!task.paused;

  return (
    <View style={styles.wrap}>
      {paused && (
        <View style={styles.pausedBar}>
          <Text style={styles.pausedBarText}>无需打卡</Text>
        </View>
      )}
      <TouchableOpacity style={[styles.card, paused && styles.cardPaused]} activeOpacity={0.8} onPress={onPress}>
        <Emoji char={task.emoji} size={26} style={styles.emoji} />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
              {task.title}
            </Text>
            {multi && <Text style={styles.times}>× {task.dailyTarget}</Text>}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {paused ? (
          <Text style={styles.pausedLabel}>暂停中</Text>
        ) : multi && !done ? (
          <TouchableOpacity style={styles.countBadge} onPress={onToggle} hitSlop={8}>
            <Text style={styles.countText}>{todayCount}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.checkbox, done && styles.checkboxDone]}
            onPress={onToggle}
            hitSlop={8}
          >
            {done && <Ionicons name="checkmark" size={16} color="#fff" />}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  cardPaused: { opacity: 0.55 },
  emoji: { marginRight: spacing.md },
  body: { flex: 1, marginRight: spacing.md, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  titleDone: { color: colors.textSecondary },
  times: { fontSize: 14, fontWeight: '600', color: colors.primary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },

  pausedLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, paddingHorizontal: 4 },

  pausedBar: { alignItems: 'center', marginBottom: spacing.xs },
  pausedBarText: {
    fontSize: 11,
    color: colors.textTertiary,
    backgroundColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },

  // 右侧完成控件：已完成（单次/多次统一）= 勾选框；多次未完成 = 次数计数框
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 14, fontWeight: '700', color: colors.text },
});
