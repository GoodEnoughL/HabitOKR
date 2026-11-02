import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskCard } from '../../components/TaskCard';
import { WeekStrip } from '../../components/WeekStrip';
import { useStore } from '../../store/useStore';
import { colors, font, radius, spacing } from '../../theme';
import { formatCN, isToday, todayKey, parseKey, addDays, toKey } from '../../utils/date';
import { getDayTaskStates, getOverdue, isTaskScheduledOn } from '../../utils/task';

export default function TasksScreen() {
  const { tasks, checkIns, toggleCheckIn } = useStore();
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const viewingToday = isToday(selectedKey);

  const dayStates = useMemo(
    () => getDayTaskStates(tasks, checkIns, selectedKey),
    [tasks, checkIns, selectedKey]
  );
  const undone = dayStates.filter((s) => !s.done);
  const done = dayStates.filter((s) => s.done);

  const overdue = useMemo(() => getOverdue(tasks, checkIns), [tasks, checkIns]);

  const scheduledKeys = useMemo(() => {
    const set = new Set<string>();
    // 以选中日期为中心前后一周，覆盖周历条的展示范围
    const anchor = parseKey(selectedKey);
    for (let i = -7; i <= 7; i++) {
      const key = toKey(addDays(anchor, i));
      if (tasks.some((t) => isTaskScheduledOn(t, key))) set.add(key);
    }
    return set;
  }, [tasks, selectedKey]);

  const doneKeys = useMemo(() => {
    const set = new Set<string>();
    scheduledKeys.forEach((key) => {
      const states = getDayTaskStates(tasks, checkIns, key);
      if (states.length > 0 && states.every((s) => s.done)) set.add(key);
    });
    return set;
  }, [scheduledKeys, tasks, checkIns]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={font.h1}>{viewingToday ? '今日任务' : `${formatCN(selectedKey)} 任务`}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {done.length}/{dayStates.length}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/calendar')} hitSlop={8}>
          <Ionicons name="menu" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <WeekStrip selectedKey={selectedKey} onSelect={setSelectedKey} scheduledKeys={scheduledKeys} doneKeys={doneKeys} />

        {viewingToday && overdue.length > 0 && (
          <TouchableOpacity
            style={styles.overdueBanner}
            activeOpacity={0.8}
            onPress={() => setSelectedKey(overdue[overdue.length - 1].date)}
          >
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.overdueText}>近一周 {overdue.length} 个任务已超期</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.danger} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>未完成 {undone.length}</Text>
        {undone.map(({ task, done: d }) => (
          <TaskCard
            key={task.id}
            task={task}
            dateKey={selectedKey}
            done={d}
            onToggle={() => toggleCheckIn(task.id, selectedKey)}
            onPress={() => router.push({ pathname: '/task/edit', params: { id: task.id } })}
          />
        ))}
        {undone.length === 0 && dayStates.length > 0 && (
          <Text style={styles.emptyText}>全部完成，太棒了 🎉</Text>
        )}

        {done.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>已完成 {done.length}</Text>
            {done.map(({ task, done: d }) => (
              <TaskCard
                key={task.id}
                task={task}
                dateKey={selectedKey}
                done={d}
                onToggle={() => toggleCheckIn(task.id, selectedKey)}
                onPress={() => router.push({ pathname: '/task/edit', params: { id: task.id } })}
              />
            ))}
          </>
        )}

        {dayStates.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={styles.emptyText}>这一天没有安排任务</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push('/task/edit')}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.md,
  },
  overdueText: { fontSize: 13, color: colors.danger, fontWeight: '500' },
  sectionTitle: { ...font.h2, marginTop: spacing.lg, marginBottom: spacing.md },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { ...font.caption },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
