import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Task } from '../types';
import { formatCN, isToday, weekdayCN } from '../utils/date';
import { taskProgress } from '../utils/task';

interface Props {
  task: Task;
  dateKey: string;
  done: boolean;
  onToggle: () => void;
  onPress?: () => void;
}

export function TaskCard({ task, dateKey, done, onToggle, onPress }: Props) {
  const progress = taskProgress(task);
  const meta = [weekdayCN(dateKey), isToday(dateKey) ? '今天' : formatCN(dateKey), task.time]
    .filter(Boolean)
    .join('，');

  return (
    <TouchableOpacity style={[styles.card, done && styles.cardDone]} activeOpacity={0.8} onPress={onPress}>
      <TouchableOpacity
        style={[styles.check, { borderColor: done ? task.color : colors.textTertiary }, done && { backgroundColor: task.color }]}
        onPress={onToggle}
        hitSlop={8}
      >
        {done && <Ionicons name="checkmark" size={14} color="#fff" />}
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
            {task.title}
          </Text>
          <Text style={styles.count}>
            ↻{task.doneCount}/{task.totalCount}
          </Text>
        </View>
        <Text style={styles.meta}>{meta}</Text>
        <View style={styles.subRow}>
          {task.subTasks.map((s) => (
            <Text key={s} style={styles.subText}>
              {s}
            </Text>
          ))}
          <View style={[styles.progressChip, { backgroundColor: task.color + '1A' }]}>
            <Text style={[styles.progressText, { color: task.color }]}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </View>

      <View style={[styles.iconCircle, { backgroundColor: task.color + '1A' }]}>
        <Text style={{ fontSize: 20 }}>{task.emoji}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardDone: { opacity: 0.6 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: { flex: 1, marginRight: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  titleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  count: { fontSize: 13, color: colors.textSecondary },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: spacing.sm },
  subText: { fontSize: 12, color: colors.textSecondary },
  progressChip: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  progressText: { fontSize: 11, fontWeight: '600' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
