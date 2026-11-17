import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from '../../components/ProgressBar';
import { ProgressRing } from '../../components/ProgressRing';
import { useStore } from '../../store/useStore';
import { colors, font, radius, spacing } from '../../theme';
import { KeyResult } from '../../types';
import { formatSlash } from '../../utils/date';
import { daysUntilEnd, goalProgress } from '../../utils/task';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goal = useStore((s) => (id ? s.goals.find((g) => g.id === id) : undefined));
  const updateGoal = useStore((s) => s.updateGoal);

  const [memo, setMemo] = useState(goal?.memo ?? '');

  const progress = useMemo(() => (goal ? goalProgress(goal) : 0), [goal]);
  const remain = goal ? daysUntilEnd(goal) : null;

  if (!goal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={font.body}>找不到这个目标</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasDates = !!(goal.startDate && goal.endDate);
  const motivation = goal.motivations.filter((m) => m.trim()).join('、');

  /** 关键结果快捷 +1 */
  const bumpKR = (kr: KeyResult) => {
    updateGoal(goal.id, {
      keyResults: goal.keyResults.map((k) =>
        k.id === kr.id ? { ...k, current: Math.min(k.target, k.current + 1) } : k
      ),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* 顶部导航（图片 4） */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.iconBtn} hitSlop={8} onPress={() => router.push('/calendar')}>
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            hitSlop={8}
            onPress={() => router.push({ pathname: '/goal/edit', params: { id: goal.id } })}
          >
            <Ionicons name="create-outline" size={21} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            hitSlop={8}
            onPress={() => router.push({ pathname: '/goal/edit', params: { id: goal.id } })}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle} numberOfLines={2}>
          {goal.name}
        </Text>

        {/* 概览卡片 */}
        <View style={styles.card}>
          <View style={styles.overviewRow}>
            <ProgressRing size={88} strokeWidth={8} progress={progress} color={goal.color}>
              <Text style={styles.ringPct}>{Math.round(progress * 100)}%</Text>
              <Text style={styles.ringLabel}>目标进度</Text>
            </ProgressRing>

            <View style={styles.overviewRight}>
              {remain !== null ? (
                <Text style={styles.remainText}>
                  <Text style={styles.remainNum}>{remain}</Text> 天后结束
                </Text>
              ) : (
                <Text style={styles.remainText}>未设置结束时间</Text>
              )}
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.dateText}>
                  {hasDates ? `${formatSlash(goal.startDate!)} - ${formatSlash(goal.endDate!)}` : '未设置时间'}
                </Text>
              </View>
              <ProgressBar progress={progress} color={goal.color} height={5} />
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.motiveText} numberOfLines={3}>
            {motivation || '暂无动机'}
          </Text>
        </View>

        {/* 关键结果 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>关键结果</Text>
          <Text style={styles.sectionCount}>{goal.keyResults.length}</Text>
        </View>

        {goal.keyResults.length === 0 ? (
          <Text style={styles.placeholder}>还没有关键结果，去编辑目标添加吧</Text>
        ) : (
          <View style={styles.krGrid}>
            {goal.keyResults.map((kr) => {
              const p = kr.target > 0 ? Math.max(0, Math.min(1, kr.current / kr.target)) : 0;
              return (
                <TouchableOpacity
                  key={kr.id}
                  style={[styles.krCard, { backgroundColor: goal.color + '33' }]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({ pathname: '/goal/kr', params: { goalId: goal.id, krId: kr.id } })
                  }
                >
                  <View
                    style={[styles.krFill, { width: `${p * 100}%`, backgroundColor: goal.color + 'A6' }]}
                  />
                  <Text style={styles.krTitle} numberOfLines={2}>
                    {kr.title}
                  </Text>
                  <View style={styles.krBottom}>
                    <Text style={styles.krEmoji}>{kr.emoji || '🎯'}</Text>
                    <Text style={styles.krValue}>
                      {kr.current}→{kr.target}
                    </Text>
                    <TouchableOpacity style={styles.krPlus} hitSlop={8} onPress={() => bumpKR(kr)}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 备注 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>备注</Text>
        </View>
        <TextInput
          style={styles.memoInput}
          value={memo}
          onChangeText={setMemo}
          onBlur={() => updateGoal(goal.id, { memo: memo.trim() })}
          placeholder="记录这个目标的想法、计划…"
          placeholderTextColor={colors.textTertiary}
          multiline
          textAlignVertical="top"
        />

        {/* 可行性 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>可行性</Text>
        </View>
        <View style={styles.card}>
          {goal.feasibilities.filter((f) => f.trim()).length === 0 ? (
            <Text style={styles.placeholder}>暂无可行性分析</Text>
          ) : (
            goal.feasibilities
              .filter((f) => f.trim())
              .map((f, i) => (
                <View key={`${i}-${f}`} style={styles.feasRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.feasText}>{f}</Text>
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.text, paddingBottom: spacing.md },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  overviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringPct: { fontSize: 20, fontWeight: '700', color: colors.text },
  ringLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  overviewRight: { flex: 1, gap: spacing.sm },
  remainText: { fontSize: 13, color: colors.textSecondary },
  remainNum: { fontSize: 22, fontWeight: '700', color: colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: colors.textSecondary },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.lg },
  motiveText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionCount: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  placeholder: { fontSize: 13, color: colors.textTertiary, paddingVertical: spacing.sm },

  krGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.md },
  krCard: {
    width: '48%',
    height: 112,
    borderRadius: radius.lg,
    padding: spacing.md,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  krFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  krTitle: { fontSize: 14, fontWeight: '700', color: colors.text, zIndex: 1 },
  krBottom: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  krEmoji: { fontSize: 18 },
  krValue: { fontSize: 13, fontWeight: '600', color: '#fff', marginLeft: spacing.sm },
  krPlus: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memoInput: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 110,
    fontSize: 14,
    color: colors.text,
  },

  feasRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 6 },
  feasText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
});
