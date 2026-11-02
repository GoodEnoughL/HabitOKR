import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from '../../components/ProgressBar';
import { useStore } from '../../store/useStore';
import { colors, font, radius, spacing } from '../../theme';
import { getWeekDates, toKey, todayKey, WEEKDAY_NAMES, parseKey } from '../../utils/date';
import { getDailyCheckInCounts, getStreak, goalProgress, taskProgress } from '../../utils/task';

export default function SummaryScreen() {
  const { goals, tasks, checkIns } = useStore();

  const streak = useMemo(() => getStreak(checkIns), [checkIns]);
  const week = useMemo(() => getDailyCheckInCounts(checkIns, 7), [checkIns]);
  const maxCount = Math.max(1, ...week.map((w) => w.count));

  const todayStates = useMemo(() => {
    const key = todayKey();
    const scheduled = tasks.filter((t) => {
      // 复用 daily/weekly 规则
      const d = parseKey(key);
      const weekday = d.getDay() === 0 ? 7 : d.getDay();
      if (key < t.startDate) return false;
      if (t.endDate && key > t.endDate) return false;
      return t.repeat === 'daily' || t.weekDays.includes(weekday);
    });
    const done = scheduled.filter((t) => checkIns.some((c) => c.taskId === t.id && c.date === key));
    return { total: scheduled.length, done: done.length };
  }, [tasks, checkIns]);

  const todayRate = todayStates.total > 0 ? todayStates.done / todayStates.total : 0;
  const weekDates = getWeekDates(new Date()).map(toKey);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={font.h1}>摘要</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 概览卡片 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>连续打卡(天)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{Math.round(todayRate * 100)}%</Text>
            <Text style={styles.statLabel}>今日完成率</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{checkIns.length}</Text>
            <Text style={styles.statLabel}>累计打卡</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{goals.length}</Text>
            <Text style={styles.statLabel}>进行中目标</Text>
          </View>
        </View>

        {/* 近 7 天打卡柱状图 */}
        <View style={styles.card}>
          <Text style={font.h3}>近 7 天打卡</Text>
          <View style={styles.chart}>
            {week.map((w, i) => {
              const dayIdx = (parseKey(w.date).getDay() + 6) % 7; // 周一=0
              return (
                <View key={w.date} style={styles.barCol}>
                  <Text style={styles.barValue}>{w.count > 0 ? w.count : ''}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(4, (w.count / maxCount) * 90) },
                        w.date === todayKey() && { backgroundColor: colors.primary },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, w.date === todayKey() && { color: colors.primary, fontWeight: '600' }]}>
                    {WEEKDAY_NAMES[dayIdx]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 目标进度 */}
        <View style={styles.card}>
          <Text style={font.h3}>目标进度</Text>
          {goals.map((g) => {
            const p = goalProgress(g);
            return (
              <View key={g.id} style={styles.progressRow}>
                <Text style={{ fontSize: 18 }}>{g.emoji}</Text>
                <Text style={styles.progressTitle} numberOfLines={1}>
                  {g.name}
                </Text>
                <ProgressBar progress={p} color={g.color} />
                <Text style={[styles.progressPct, { color: g.color }]}>{Math.round(p * 100)}%</Text>
              </View>
            );
          })}
          {goals.length === 0 && <Text style={[font.caption, { marginTop: spacing.sm }]}>暂无目标</Text>}
        </View>

        {/* 习惯坚持 */}
        <View style={styles.card}>
          <Text style={font.h3}>习惯坚持</Text>
          {tasks.map((t) => {
            const p = taskProgress(t);
            return (
              <View key={t.id} style={styles.progressRow}>
                <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.progressTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={font.caption}>
                      {t.doneCount}/{t.totalCount} 次
                    </Text>
                  </View>
                  <View style={{ marginTop: 6 }}>
                    <ProgressBar progress={p} color={t.color} />
                  </View>
                </View>
              </View>
            );
          })}
          {tasks.length === 0 && <Text style={[font.caption, { marginTop: spacing.sm }]}>暂无任务</Text>}
        </View>

        <Text style={styles.weekHint}>
          本周 {weekDates[0]} ~ {weekDates[6]}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  chart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  barCol: { flex: 1, alignItems: 'center' },
  barValue: { fontSize: 11, color: colors.textSecondary, height: 16 },
  barTrack: { height: 90, justifyContent: 'flex-end' },
  bar: { width: 18, borderRadius: 6, backgroundColor: colors.primaryLight },
  barLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  progressTitle: { flex: 1, fontSize: 14, color: colors.text },
  progressPct: { width: 42, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  weekHint: { ...font.tiny, textAlign: 'center', marginTop: spacing.lg },
});
