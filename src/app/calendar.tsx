import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthCalendar } from '../components/MonthCalendar';
import { TaskCard } from '../components/TaskCard';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { useStore } from '../store/useStore';
import { colors, font, spacing } from '../theme';
import { addDays, parseKey, toKey, todayKey, formatCN, weekdayCN } from '../utils/date';
import { getDayCheckInCount, getDayTaskStates } from '../utils/task';

export default function CalendarScreen() {
  const { tasks, checkIns, toggleCheckIn } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);

  const onMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  // 当月每天的任务状态：done=全部完成, partial=部分完成, pending=有计划未打卡
  const dayStatus = useMemo(() => {
    const map = new Map<string, 'pending' | 'done' | 'partial'>();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < daysInMonth; i++) {
      const key = toKey(addDays(first, i));
      const states = getDayTaskStates(tasks, checkIns, key).filter((s) => !s.task.paused);
      if (states.length === 0) continue;
      const doneCount = states.filter((s) => s.done).length;
      map.set(key, doneCount === states.length ? 'done' : doneCount > 0 ? 'partial' : 'pending');
    }
    return map;
  }, [year, month, tasks, checkIns]);

  const dayStates = useMemo(
    () => getDayTaskStates(tasks, checkIns, selectedKey),
    [tasks, checkIns, selectedKey]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={font.h1}>习惯日历</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MonthCalendar
          year={year}
          month={month}
          onMonthChange={onMonthChange}
          selectedKey={selectedKey}
          onSelect={(key) => {
            setSelectedKey(key);
            const d = parseKey(key);
            if (d.getFullYear() !== year || d.getMonth() !== month) onMonthChange(d.getFullYear(), d.getMonth());
          }}
          dayStatus={dayStatus}
        />

        <View style={styles.legend}>
          {[
            [colors.primary, '有计划'],
            [colors.success, '全部完成'],
            [colors.warning, '部分完成'],
          ].map(([c, label]) => (
            <View key={label as string} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c as string }]} />
              <Text style={font.caption}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          {formatCN(selectedKey)} {weekdayCN(selectedKey)}
        </Text>
        {dayStates.map(({ task, done }) => (
          <TaskCard
            key={task.id}
            task={task}
            dateKey={selectedKey}
            done={done}
            todayCount={getDayCheckInCount(task, checkIns, selectedKey)}
            onToggle={() => toggleCheckIn(task.id, selectedKey)}
            onPress={() => setDrawerTaskId(task.id)}
          />
        ))}
        {dayStates.length === 0 && <Text style={[font.caption, { marginTop: spacing.sm }]}>这一天没有安排习惯</Text>}
      </ScrollView>

      <TaskDetailDrawer taskId={drawerTaskId} visible={!!drawerTaskId} onClose={() => setDrawerTaskId(null)} />
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
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  legend: { flexDirection: 'row', gap: spacing.lg, justifyContent: 'center', marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { ...font.h2, marginTop: spacing.lg, marginBottom: spacing.md },
});
