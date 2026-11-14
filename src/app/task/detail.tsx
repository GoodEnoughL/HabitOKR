import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DetailCalendar } from '../../components/DetailCalendar';
import { Emoji } from '../../components/Emoji';
import { useStore } from '../../store/useStore';
import { colors, font, radius, spacing } from '../../theme';
import {
  getDaysSinceStart,
  getLongestStreak,
  getMonthCheckInCount,
  getTotalCheckIns,
  remainingToCompleteLabel,
} from '../../utils/task';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const task = useStore((s) => (id ? s.tasks.find((t) => t.id === id) : undefined));
  const checkIns = useStore((s) => s.checkIns);

  if (!task) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>习惯详情</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🫥</Text>
          <Text style={[font.body, { color: colors.textSecondary }]}>找不到这个习惯</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const now = new Date();
  const monthCount = getMonthCheckInCount(task, checkIns, now.getFullYear(), now.getMonth());
  const total = getTotalCheckIns(task, checkIns);
  const longest = getLongestStreak(task, checkIns);
  const days = getDaysSinceStart(task);
  const remain = remainingToCompleteLabel(task, checkIns);

  const topStats: { label: string; value: string }[] = [
    { label: '本月打卡', value: `${monthCount}次` },
    { label: '总打卡', value: `${total}次` },
    { label: '最高连续打卡', value: `${longest}次` },
  ];
  const bottomStats: { label: string; value: string }[] = [
    { label: '开始时间', value: task.startDate.replaceAll('-', '/') },
    { label: '已坚持', value: `${days}天` },
    { label: '结束时间', value: remain },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>习惯详情</Text>
        <TouchableOpacity onPress={() => {}} hitSlop={8}>
          <Text style={styles.navShare}>分享</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 习惯卡片 */}
        <View style={styles.habitCard}>
          <View style={styles.habitInfo}>
            <Text style={[font.h2, styles.habitTitle]} numberOfLines={1}>
              {task.title}
            </Text>
            {task.why?.trim() ? (
              <Text style={styles.habitWhy} numberOfLines={2}>
                {task.why}
              </Text>
            ) : null}
          </View>
          <Emoji char={task.emoji} size={36} />
        </View>

        {/* 月历卡片 */}
        <View style={styles.card}>
          <DetailCalendar task={task} checkIns={checkIns} />
        </View>

        {/* 习惯数据卡片 */}
        <View style={styles.card}>
          <View style={styles.statsRow}>
            {topStats.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            {bottomStats.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  navShare: { fontSize: 15, color: colors.primary, fontWeight: '500' },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  habitInfo: { flex: 1, marginRight: spacing.md },
  habitTitle: { flexShrink: 1 },
  habitWhy: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  backBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
