import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheet } from '../../components/BottomSheet';
import { DatePickerModal } from '../../components/DatePickerModal';
import { Emoji } from '../../components/Emoji';
import { useStore } from '../../store/useStore';
import { EMOJI_GROUPS } from '../../assets/twemoji';
import { accentPalette, colors, font, radius, spacing } from '../../theme';
import { CompletionMode, Difficulty, FrequencyType, HabitType } from '../../types';
import { formatFullCN, todayKey, weekDayIndex, WEEKDAY_NAMES } from '../../utils/date';
import {
  COMPLETION_OPTIONS,
  completionLabel,
  DIFFICULTY_META,
  ENCOURAGEMENTS,
  FREQUENCY_OPTIONS,
  frequencyLabel,
  HABIT_TYPE_META,
} from '../../utils/task';

type ExpandKey = 'frequency' | 'completion' | 'dailyTarget' | 'difficulty' | 'reminder' | null;

const DAILY_TARGET_OPTIONS = [1, 2, 3];

export default function TaskEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tasks, goals, addTask, updateTask, removeTask } = useStore();
  const editing = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);

  const [emoji, setEmoji] = useState(editing?.emoji ?? '📖');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [why, setWhy] = useState(editing?.why ?? '');
  const [habitType, setHabitType] = useState<HabitType>(editing?.habitType ?? 'wisdom');
  const [frequency, setFrequency] = useState<FrequencyType>(editing?.frequency ?? 'daily');
  const [frequencyValue, setFrequencyValue] = useState(editing?.frequencyValue ?? 1);
  const [startDate, setStartDate] = useState(editing?.startDate ?? todayKey());
  const [completionMode, setCompletionMode] = useState<CompletionMode>(editing?.completionMode ?? 'forever');
  const [completionValue, setCompletionValue] = useState(editing?.completionValue ?? 30);
  const [dailyTarget, setDailyTarget] = useState(editing?.dailyTarget ?? 1);
  const [difficulty, setDifficulty] = useState<Difficulty>(editing?.difficulty ?? 'normal');
  const [reminderEnabled, setReminderEnabled] = useState(editing?.reminderEnabled ?? true);
  const [reminderTime, setReminderTime] = useState(editing?.reminderTime ?? '09:00');

  const [goalId, setGoalId] = useState<string | undefined>(editing?.goalId);
  const [krId, setKrId] = useState<string | undefined>(editing?.krId);

  const [expanded, setExpanded] = useState<ExpandKey>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);

  const goal = goals.find((g) => g.id === goalId);

  const toggleExpand = (key: Exclude<ExpandKey, null>) =>
    setExpanded((cur) => (cur === key ? null : key));

  const rollWhy = () => {
    const next = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    setWhy(next);
  };

  const selectFrequency = (f: FrequencyType) => {
    setFrequency(f);
    if (f === 'weekly' && (frequencyValue < 1 || frequencyValue > 7)) {
      setFrequencyValue(weekDayIndex(new Date()));
    } else if (f === 'daysPerWeek') {
      setFrequencyValue((v) => (v < 1 || v > 7 ? 3 : v));
    } else if (f === 'daysPerMonth') {
      setFrequencyValue((v) => (v < 1 || v > 31 ? 10 : v));
    } else if (f === 'everyXDays') {
      setFrequencyValue((v) => (v < 1 ? 2 : v));
    }
  };

  // 折叠态展示值
  const previewTask = {
    frequency,
    frequencyValue,
    completionMode,
    completionValue,
  } as Parameters<typeof frequencyLabel>[0];

  const save = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入习惯名称');
      return;
    }
    if (frequency === 'weekly' && (frequencyValue < 1 || frequencyValue > 7)) {
      Alert.alert('提示', '请选择每周打卡的星期');
      return;
    }
    if ((frequency === 'daysPerWeek' || frequency === 'daysPerMonth' || frequency === 'everyXDays') && frequencyValue < 1) {
      Alert.alert('提示', '请设置有效的打卡数量');
      return;
    }
    if ((completionMode === 'timeSpan' || completionMode === 'totalCount') && completionValue < 1) {
      Alert.alert('提示', '请设置有效的通关条件');
      return;
    }
    if (dailyTarget < 1) {
      Alert.alert('提示', '每日打卡次数至少为 1');
      return;
    }
    const resolvedKr = goalId ? krId ?? goal?.keyResults[0]?.id : undefined;
    const payload = {
      title: title.trim(),
      emoji,
      color: goal?.color ?? editing?.color ?? accentPalette[1],
      why: why.trim(),
      habitType,
      frequency,
      frequencyValue,
      startDate,
      completionMode,
      completionValue: completionMode === 'forever' ? 0 : completionValue,
      dailyTarget,
      difficulty,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      goalId,
      krId: resolvedKr,
      increment: editing?.increment ?? 1,
    };
    if (editing) updateTask(editing.id, payload);
    else addTask(payload);
    router.back();
  };

  const [hh, mm] = (reminderTime ?? '09:00').split(':');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 顶部导航 */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.navClose}>关闭</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{editing ? '编辑习惯' : '新建习惯'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Emoji */}
          <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmoji(true)} activeOpacity={0.8}>
            <Emoji char={emoji} size={32} />
          </TouchableOpacity>

          {/* 描述一下你的习惯 */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>描述一下你的习惯</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="例如：每天看二十页书"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* 为什么要做这件事 */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>为什么要做这件事？</Text>
            <View style={styles.whyRow}>
              <TextInput
                style={[styles.fieldInput, { flex: 1 }]}
                placeholder="也可以写下任务细节或鼓励你的话"
                placeholderTextColor={colors.textTertiary}
                value={why}
                onChangeText={setWhy}
                multiline
              />
              <TouchableOpacity onPress={rollWhy} hitSlop={8} style={styles.diceBtn}>
                <Emoji char="🎲" size={24} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 选择一个习惯类型 */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>选择一个习惯类型</Text>
            {(Object.keys(HABIT_TYPE_META) as HabitType[]).map((key) => {
              const meta = HABIT_TYPE_META[key];
              const active = habitType === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionRow, active && styles.optionRowActive]}
                  onPress={() => setHabitType(key)}
                >
                  <Emoji char={meta.emoji} size={18} style={{ marginRight: spacing.sm }} />
                  <Text style={[styles.optionText, active && { color: colors.primary, fontWeight: '600' }]}>
                    {meta.label}（{meta.desc}）
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 打卡频率 */}
          <ExpandableRow
            label="打卡频率"
            value={frequencyLabel(previewTask)}
            expanded={expanded === 'frequency'}
            onPress={() => toggleExpand('frequency')}
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionRow, frequency === opt.value && styles.optionRowActive]}
                onPress={() => selectFrequency(opt.value)}
              >
                <Text style={[styles.optionText, frequency === opt.value && { color: colors.primary, fontWeight: '600' }]}>
                  {opt.label}
                </Text>
                {frequency === opt.value && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}

            {frequency === 'weekly' && (
              <View style={styles.weekRow}>
                {WEEKDAY_NAMES.map((w, i) => {
                  const d = i + 1;
                  const active = frequencyValue === d;
                  return (
                    <TouchableOpacity
                      key={w}
                      style={[styles.weekCell, active && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                      onPress={() => setFrequencyValue(d)}
                    >
                      <Text style={[styles.weekText, active && { color: colors.primary }]}>{w.slice(1)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {(frequency === 'daysPerWeek' || frequency === 'daysPerMonth' || frequency === 'everyXDays') && (
              <Stepper
                value={frequencyValue}
                min={1}
                max={frequency === 'daysPerWeek' ? 7 : frequency === 'daysPerMonth' ? 31 : 365}
                unit={frequency === 'everyXDays' ? '天' : '天'}
                onChange={setFrequencyValue}
              />
            )}

            <View style={styles.divider} />
            <TouchableOpacity style={styles.subRow} onPress={() => setShowStartDate(true)}>
              <Text style={font.body}>开始日期</Text>
              <View style={styles.rowValueWrap}>
                <Text style={styles.rowValue}>{formatFullCN(startDate)}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          </ExpandableRow>

          {/* 通关条件 */}
          <ExpandableRow
            label="通关条件"
            value={completionLabel(previewTask)}
            expanded={expanded === 'completion'}
            onPress={() => toggleExpand('completion')}
          >
            {COMPLETION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionRow, completionMode === opt.value && styles.optionRowActive]}
                onPress={() => setCompletionMode(opt.value)}
              >
                <Text style={[styles.optionText, completionMode === opt.value && { color: colors.primary, fontWeight: '600' }]}>
                  {opt.label}
                </Text>
                {completionMode === opt.value && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
            {(completionMode === 'timeSpan' || completionMode === 'totalCount') && (
              <View style={styles.numberRow}>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={String(completionValue)}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    setCompletionValue(isNaN(n) ? 0 : Math.max(0, n));
                  }}
                />
                <Text style={styles.numberUnit}>{completionMode === 'timeSpan' ? '天' : '次'}</Text>
              </View>
            )}
          </ExpandableRow>

          {/* 每日需要打卡 */}
          <ExpandableRow
            label="每日需要打卡"
            value={`${dailyTarget} 下`}
            expanded={expanded === 'dailyTarget'}
            onPress={() => toggleExpand('dailyTarget')}
          >
            {DAILY_TARGET_OPTIONS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.optionRow, dailyTarget === n && styles.optionRowActive]}
                onPress={() => setDailyTarget(n)}
              >
                <Text style={[styles.optionText, dailyTarget === n && { color: colors.primary, fontWeight: '600' }]}>
                  {n} 下
                </Text>
                {dailyTarget === n && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </ExpandableRow>

          {/* 选择习惯难度 */}
          <ExpandableRow
            label="选择习惯难度"
            value={DIFFICULTY_META[difficulty]}
            expanded={expanded === 'difficulty'}
            onPress={() => toggleExpand('difficulty')}
          >
            {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.optionRow, difficulty === key && styles.optionRowActive]}
                onPress={() => setDifficulty(key)}
              >
                <Text style={[styles.optionText, difficulty === key && { color: colors.primary, fontWeight: '600' }]}>
                  {DIFFICULTY_META[key]}
                </Text>
                {difficulty === key && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </ExpandableRow>

          {/* 定时提醒 */}
          <ExpandableRow
            label="定时提醒"
            value={reminderEnabled ? '开启' : '关闭'}
            expanded={expanded === 'reminder'}
            onPress={() => toggleExpand('reminder')}
          >
            <View style={styles.subRow}>
              <Text style={font.body}>开启提醒</Text>
              <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: colors.primary }} />
            </View>
            {reminderEnabled && (
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  keyboardType="numeric"
                  maxLength={2}
                  value={hh}
                  onChangeText={(t) => {
                    const n = Math.min(23, parseInt(t || '0', 10));
                    const mm = reminderTime.split(':')[1] ?? '00';
                    setReminderTime(`${String(n).padStart(2, '0')}:${mm}`);
                  }}
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  keyboardType="numeric"
                  maxLength={2}
                  value={mm}
                  onChangeText={(t) => {
                    const n = Math.min(59, parseInt(t || '0', 10));
                    const h = reminderTime.split(':')[0] ?? '09';
                    setReminderTime(`${h}:${String(n).padStart(2, '0')}`);
                  }}
                />
              </View>
            )}
          </ExpandableRow>

          {/* 关联目标（可选，OKR 闭环） */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.linkRow} onPress={() => setShowGoal(true)}>
              <Ionicons name="link" size={16} color={colors.primary} />
              <Text style={styles.linkText}>关联目标</Text>
              <Text style={styles.linkValue} numberOfLines={1}>
                {goal ? goal.name : '未关联'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() =>
                Alert.alert('删除习惯', '打卡记录将一并删除，确定删除？', [
                  { text: '取消', style: 'cancel' },
                  { text: '删除', style: 'destructive', onPress: () => { removeTask(editing.id); router.back(); } },
                ])
              }
            >
              <Text style={styles.deleteText}>删除习惯</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={save}>
            <Text style={styles.saveText}>保存</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Emoji 选择器（底部抽屉，分类展示 Twemoji） */}
      <BottomSheet visible={showEmoji} onClose={() => setShowEmoji(false)}>
        <FlatList
          data={EMOJI_GROUPS}
          keyExtractor={(g) => g.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pickerScroll}
          windowSize={6}
          removeClippedSubviews
          renderItem={({ item: group }) => (
            <View style={styles.pickerGroupBox}>
              {group.emojis.map((e) => {
                const active = emoji === e;
                return (
                  <TouchableOpacity
                    key={e}
                    style={[styles.pickerCell, styles.pickerCellGap, active && styles.pickerCellActive]}
                    onPress={() => setEmoji(e)}
                    activeOpacity={0.7}
                  >
                    <Emoji char={e} size={26} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      </BottomSheet>

      {/* 关联目标 */}
      <Modal visible={showGoal} transparent animationType="fade" onRequestClose={() => setShowGoal(false)}>
        <TouchableOpacity style={styles.mask} activeOpacity={1} onPress={() => setShowGoal(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={[font.h3, { marginBottom: spacing.md }]}>关联目标</Text>
            {goals.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.optionRow}
                onPress={() => {
                  setGoalId(g.id);
                  setKrId(g.keyResults[0]?.id);
                  setShowGoal(false);
                }}
              >
                <View style={[styles.dot, { backgroundColor: g.color }]} />
                <Text style={font.body} numberOfLines={1}>{g.name}</Text>
                {g.id === goalId && <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => { setGoalId(undefined); setKrId(undefined); setShowGoal(false); }}
            >
              <Text style={[font.body, { color: colors.textSecondary }]}>不关联目标</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 开始日期 */}
      <DatePickerModal
        visible={showStartDate}
        mode="single"
        value={startDate}
        title="开始日期"
        onClose={() => setShowStartDate(false)}
        onConfirm={(d) => { setStartDate(d); setShowStartDate(false); }}
      />
    </SafeAreaView>
  );
}

function ExpandableRow({
  label,
  value,
  expanded,
  onPress,
  children,
}: {
  label: string;
  value: string;
  expanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.expandHeader} onPress={onPress}>
        <Text style={font.body}>{label}</Text>
        <View style={styles.rowValueWrap}>
          <Text style={[styles.rowValue, { color: colors.primary }]}>{value}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
      {expanded && <View style={styles.expandBody}>{children}</View>}
    </View>
  );
}

function Stepper({
  value,
  min,
  max,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Text style={[styles.stepText, value <= min && { color: colors.textTertiary }]}>−</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.stepInput}
        keyboardType="numeric"
        value={String(value)}
        onChangeText={(t) => {
          const n = parseInt(t, 10);
          onChange(isNaN(n) ? min : Math.max(min, Math.min(max, n)));
        }}
      />
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Text style={[styles.stepText, value >= max && { color: colors.textTertiary }]}>+</Text>
      </TouchableOpacity>
      {unit ? <Text style={styles.stepUnit}>{unit}</Text> : null}
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
  navClose: { fontSize: 16, color: colors.primary },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 60 },

  emojiBtn: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  fieldInput: { fontSize: 16, color: colors.text, paddingVertical: 4 },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  diceBtn: { paddingHorizontal: 8, paddingVertical: 4 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionRowActive: { backgroundColor: colors.primaryLight, marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  optionText: { fontSize: 15, color: colors.text },

  expandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  expandBody: { marginTop: spacing.sm },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 14, color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },

  weekRow: { flexDirection: 'row', gap: 6, paddingVertical: spacing.md, flexWrap: 'wrap' },
  weekCell: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekText: { fontSize: 12, color: colors.textSecondary },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 20, color: colors.text, fontWeight: '600' },
  stepInput: {
    minWidth: 48,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  stepUnit: { fontSize: 14, color: colors.textSecondary },

  numberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  numberInput: {
    minWidth: 64,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  numberUnit: { fontSize: 15, color: colors.textSecondary },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: spacing.md },
  timeInput: {
    width: 56,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  timeColon: { fontSize: 18, fontWeight: '600', color: colors.text },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  linkText: { fontSize: 15, color: colors.primary, fontWeight: '500' },
  linkValue: { flex: 1, fontSize: 14, color: colors.textSecondary, textAlign: 'right', marginLeft: spacing.sm },

  deleteBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: spacing.xl,
  },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 15 },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: spacing.xl,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  mask: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, maxHeight: '80%' },
  pickerScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  pickerGroupBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textTertiary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerCell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCellActive: { backgroundColor: colors.primaryLight },
  pickerCellGap: { margin: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
});
