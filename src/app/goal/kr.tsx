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
import { Emoji } from '../../components/Emoji';
import { useStore } from '../../store/useStore';
import { colors, font, radius, spacing } from '../../theme';
import { formatFullCN } from '../../utils/date';
import { frequencyLabel } from '../../utils/task';

type Tab = 'tasks' | 'records' | 'memo';

const TABS: { key: Tab; label: string }[] = [
  { key: 'tasks', label: '任务' },
  { key: 'records', label: '记录' },
  { key: 'memo', label: '备忘' },
];

export default function KeyResultScreen() {
  const { goalId, krId } = useLocalSearchParams<{ goalId?: string; krId?: string }>();
  const goal = useStore((s) => (goalId ? s.goals.find((g) => g.id === goalId) : undefined));
  const tasks = useStore((s) => s.tasks);
  const checkIns = useStore((s) => s.checkIns);
  const updateGoal = useStore((s) => s.updateGoal);

  const kr = goal?.keyResults.find((k) => k.id === krId);
  const [tab, setTab] = useState<Tab>('tasks');
  const [memo, setMemo] = useState(kr?.memo ?? '');

  const linkedTasks = useMemo(
    () => tasks.filter((t) => t.goalId === goalId && t.krId === krId),
    [tasks, goalId, krId]
  );

  const records = useMemo(() => {
    if (linkedTasks.length === 0) return [];
    const ids = new Set(linkedTasks.map((t) => t.id));
    return checkIns
      .filter((c) => ids.has(c.taskId))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [checkIns, linkedTasks]);

  if (!goal || !kr) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📌</Text>
          <Text style={font.body}>找不到这个关键结果</Text>
        </View>
      </SafeAreaView>
    );
  }

  const p = kr.target > 0 ? Math.max(0, Math.min(1, kr.current / kr.target)) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* 顶部导航（图片 5） */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleBtn}
          hitSlop={8}
          onPress={() => router.push({ pathname: '/goal/edit', params: { id: goal.id } })}
        >
          <Ionicons name="create-outline" size={21} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* 关键结果大卡 */}
        <View style={[styles.krCard, { backgroundColor: goal.color + '33' }]}>
          <View style={[styles.krFill, { width: `${p * 100}%`, backgroundColor: goal.color + 'A6' }]} />
          <Text style={styles.krTitle} numberOfLines={2}>
            {kr.title}
          </Text>
          <View style={styles.krBottom}>
            <Text style={styles.krEmoji}>{kr.emoji || '🎯'}</Text>
            <Text style={styles.krValue}>
              {kr.current}→{kr.target}
            </Text>
            <TouchableOpacity
              style={styles.krPlus}
              hitSlop={8}
              onPress={() =>
                updateGoal(goal.id, {
                  keyResults: goal.keyResults.map((k) =>
                    k.id === kr.id ? { ...k, current: Math.min(k.target, k.current + 1) } : k
                  ),
                })
              }
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.sumPill}>
          <Text style={styles.sumText}>求和｜初始值 0</Text>
        </View>

        {/* Tab 切换 */}
        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={styles.tabBody}
          contentContainerStyle={styles.tabBodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {tab === 'tasks' &&
            (linkedTasks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🗂️</Text>
                <Text style={styles.emptyText}>还没有任务，添加一个来推进这个关键结果</Text>
              </View>
            ) : (
              linkedTasks.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.row}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/task/detail', params: { id: t.id } })}
                >
                  <Emoji char={t.emoji} size={24} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {frequencyLabel(t)} · 每次 +{t.increment}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))
            ))}

          {tab === 'records' &&
            (records.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyText}>还没有打卡记录</Text>
              </View>
            ) : (
              records.map((r) => {
                const t = linkedTasks.find((x) => x.id === r.taskId);
                return (
                  <View key={r.id} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: goal.color }]} />
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {t?.title ?? '任务'} · +{t?.increment ?? 1}
                      </Text>
                      <Text style={styles.rowSub}>{formatFullCN(r.date)}</Text>
                    </View>
                  </View>
                );
              })
            ))}

          {tab === 'memo' && (
            <TextInput
              style={styles.memoInput}
              value={memo}
              onChangeText={setMemo}
              onBlur={() => {
                updateGoal(goal.id, {
                  keyResults: goal.keyResults.map((k) => (k.id === kr.id ? { ...k, memo: memo.trim() } : k)),
                });
              }}
              placeholder="记录这个关键结果的进展、想法…"
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          )}
        </ScrollView>
      </View>

      {/* 底部操作（AI 创建任务暂不实现） */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addTaskBtn}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: '/task/edit', params: { goalId: goal.id, krId: kr.id } })
          }
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addTaskText}>添加任务</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { flex: 1, paddingHorizontal: spacing.lg },

  krCard: {
    height: 132,
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  krFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  krTitle: { fontSize: 18, fontWeight: '700', color: colors.text, zIndex: 1 },
  krBottom: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  krEmoji: { fontSize: 24 },
  krValue: { fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: spacing.sm },
  krPlus: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sumPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.sm,
  },
  sumText: { fontSize: 11, color: colors.textSecondary },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    marginTop: spacing.lg,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.full },
  tabItemActive: { backgroundColor: colors.primaryLight },
  tabText: { fontSize: 14, color: colors.textSecondary },
  tabTextActive: { color: colors.text, fontWeight: '600' },

  tabBody: { flex: 1, marginTop: spacing.md },
  tabBodyContent: { paddingBottom: spacing.xl, flexGrow: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  memoInput: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 140,
    fontSize: 14,
    color: colors.text,
  },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 40 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { fontSize: 13, color: colors.textTertiary, textAlign: 'center' },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 15,
  },
  addTaskText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
