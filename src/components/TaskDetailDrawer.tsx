import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../store/useStore';
import { colors, font, radius, spacing } from '../theme';
import { getDaysSinceStart, getTotalCheckIns, remainingToCompleteLabel } from '../utils/task';
import { BottomSheet } from './BottomSheet';
import { Emoji } from './Emoji';

interface Props {
  taskId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function TaskDetailDrawer({ taskId, visible, onClose }: Props) {
  const task = useStore((s) => (taskId ? s.tasks.find((t) => t.id === taskId) : undefined));
  const checkIns = useStore((s) => s.checkIns);
  const togglePause = useStore((s) => s.togglePause);

  if (!task) return null;
  const days = getDaysSinceStart(task);
  const total = getTotalCheckIns(task, checkIns);
  const remain = remainingToCompleteLabel(task, checkIns);

  const goEdit = () => {
    onClose();
    router.push({ pathname: '/task/edit', params: { id: task.id } });
  };
  const goDetail = () => {
    onClose();
    router.push({ pathname: '/task/detail', params: { id: task.id } });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Emoji char={task.emoji} size={36} />
          <Text style={[font.h2, styles.title]} numberOfLines={2}>
            {task.title}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="经历了" value={days > 0 ? `第 ${days} 天` : '未开始'} />
          <Stat label="已打卡" value={`${total} 次`} />
          <Stat label="距离通关" value={remain} />
        </View>

        <View style={styles.divider} />

        <View style={styles.actionsRow}>
          <ActionBtn icon="pencil-outline" label="编辑习惯" onPress={goEdit} />
          <ActionBtn
            icon={task.paused ? 'play-outline' : 'pause-outline'}
            label={task.paused ? '继续打卡' : '暂停打卡'}
            onPress={() => togglePause(task.id)}
          />
        </View>

        <TouchableOpacity style={styles.fullBtn} onPress={goDetail} activeOpacity={0.8}>
          <Ionicons name="list-outline" size={20} color={colors.text} />
          <Text style={styles.fullBtnText}>查看详情</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.lg },
  title: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  statValue: { fontSize: 17, fontWeight: '700', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  actionText: { fontSize: 15, fontWeight: '500', color: colors.text },
  fullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  fullBtnText: { fontSize: 15, fontWeight: '500', color: colors.text },
});
