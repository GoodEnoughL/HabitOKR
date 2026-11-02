import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { accentPalette, colors, font, radius, spacing } from '../../theme';
import { RepeatType } from '../../types';
import { todayKey, WEEKDAY_NAMES } from '../../utils/date';

const EMOJI_CHOICES = ['✅', '🏋️', '📖', '🎧', '🧘', '💻', '✍️', '🏃', '💧', '😴'];

export default function TaskEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tasks, goals, addTask, updateTask, removeTask } = useStore();
  const editing = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '✅');
  const [color, setColor] = useState(editing?.color ?? accentPalette[1]);
  const [goalId, setGoalId] = useState<string | undefined>(editing?.goalId);
  const [krId, setKrId] = useState<string | undefined>(editing?.krId);
  const [increment, setIncrement] = useState(String(editing?.increment ?? 1));
  const [repeat, setRepeat] = useState<RepeatType>(editing?.repeat ?? 'daily');
  const [weekDays, setWeekDays] = useState<number[]>(editing?.weekDays ?? []);
  const [time, setTime] = useState(editing?.time ?? '');
  const [subTasks, setSubTasks] = useState<string[]>(editing?.subTasks ?? []);
  const [newSub, setNewSub] = useState('');
  const [totalCount, setTotalCount] = useState(String(editing?.totalCount ?? 30));
  const [picker, setPicker] = useState<'none' | 'goal' | 'kr'>('none');

  const goal = goals.find((g) => g.id === goalId);
  const kr = goal?.keyResults.find((k) => k.id === krId);

  const save = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入任务名称');
      return;
    }
    if (repeat === 'weekly' && weekDays.length === 0) {
      Alert.alert('提示', '请选择每周重复的星期');
      return;
    }
    const payload = {
      title: title.trim(),
      emoji,
      color,
      goalId,
      krId: goalId ? krId : undefined,
      increment: Math.max(1, Number(increment) || 1),
      repeat,
      weekDays: repeat === 'weekly' ? weekDays : [],
      time: time.trim() || undefined,
      subTasks,
      totalCount: Math.max(1, Number(totalCount) || 1),
      startDate: editing?.startDate ?? todayKey(),
      endDate: editing?.endDate,
    };
    if (editing) updateTask(editing.id, payload);
    else addTask(payload);
    router.back();
  };

  const toggleWeekDay = (d: number) =>
    setWeekDays((days) => (days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort()));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} hitSlop={8}>
            <Text style={styles.navBtnText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{editing ? '编辑任务' : '新建任务'}</Text>
          <TouchableOpacity onPress={save} style={[styles.navBtn, styles.navBtnPrimary]} hitSlop={8}>
            <Text style={[styles.navBtnText, { color: colors.primary, fontWeight: '600' }]}>完成</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* 名称 */}
          <View style={styles.card}>
            <TextInput
              style={styles.titleInput}
              placeholder="输入任务名称，如：健身"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          <View style={styles.emojiRow}>
            {EMOJI_CHOICES.map((e) => (
              <TouchableOpacity key={e} onPress={() => setEmoji(e)} style={[styles.emojiCell, e === emoji && styles.emojiCellActive]}>
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.paletteRow}>
            {accentPalette.map((c) => (
              <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.paletteCell, { backgroundColor: c }, c === color && styles.paletteCellActive]} />
            ))}
          </View>

          {/* 关联 OKR */}
          <View style={[styles.card, { marginTop: spacing.md }]}>
            <TouchableOpacity style={styles.row} onPress={() => setPicker('goal')}>
              <Text style={font.h3}>关联目标</Text>
              <Text style={styles.rowValue}>{goal ? `${goal.emoji} ${goal.name}` : '不关联'}</Text>
            </TouchableOpacity>
            {goal && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.row} onPress={() => setPicker('kr')}>
                  <Text style={font.h3}>关键结果</Text>
                  <Text style={styles.rowValue}>{kr ? kr.title : '不关联'}</Text>
                </TouchableOpacity>
              </>
            )}
            {goal && kr && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={font.body}>每次打卡 KR 增加</Text>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="numeric"
                    value={increment}
                    onChangeText={setIncrement}
                  />
                </View>
              </>
            )}
          </View>

          {/* 重复 */}
          <View style={[styles.card, { marginTop: spacing.md }]}>
            <View style={styles.row}>
              <Text style={font.h3}>重复</Text>
              <View style={styles.segment}>
                {([
                  ['daily', '每天'],
                  ['weekly', '每周'],
                ] as const).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.segmentCell, repeat === value && styles.segmentCellActive]}
                    onPress={() => setRepeat(value)}
                  >
                    <Text style={[styles.segmentText, repeat === value && styles.segmentTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {repeat === 'weekly' && (
              <View style={styles.weekRow}>
                {WEEKDAY_NAMES.map((w, i) => {
                  const d = i + 1;
                  const active = weekDays.includes(d);
                  return (
                    <TouchableOpacity
                      key={w}
                      style={[styles.weekCell, active && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                      onPress={() => toggleWeekDay(d)}
                    >
                      <Text style={[styles.weekText, active && { color: colors.primary }]}>{w}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={font.body}>时间</Text>
              <TextInput
                style={styles.numInput}
                placeholder="20:00"
                placeholderTextColor={colors.textTertiary}
                value={time}
                onChangeText={setTime}
                maxLength={5}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={font.body}>计划总次数</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={totalCount}
                onChangeText={setTotalCount}
              />
            </View>
          </View>

          {/* 子任务 */}
          <View style={[styles.card, { marginTop: spacing.md }]}>
            <Text style={font.h3}>子任务（锻炼部位 / 检查项）</Text>
            <View style={styles.subChips}>
              {subTasks.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.subChip}
                  onPress={() => setSubTasks((arr) => arr.filter((x) => x !== s))}
                >
                  <Text style={styles.subChipText}>{s}</Text>
                  <Ionicons name="close" size={12} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addSubRow}>
              <TextInput
                style={styles.addSubInput}
                placeholder="添加子任务"
                placeholderTextColor={colors.textTertiary}
                value={newSub}
                onChangeText={setNewSub}
                onSubmitEditing={() => {
                  if (newSub.trim()) {
                    setSubTasks((arr) => [...arr, newSub.trim()]);
                    setNewSub('');
                  }
                }}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => {
                  if (newSub.trim()) {
                    setSubTasks((arr) => [...arr, newSub.trim()]);
                    setNewSub('');
                  }
                }}
              >
                <Ionicons name="add-circle" size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() =>
                Alert.alert('删除任务', '打卡记录将一并删除，确定删除？', [
                  { text: '取消', style: 'cancel' },
                  { text: '删除', style: 'destructive', onPress: () => { removeTask(editing.id); router.back(); } },
                ])
              }
            >
              <Text style={styles.deleteText}>删除任务</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 目标选择 */}
      <Modal visible={picker === 'goal'} transparent animationType="fade" onRequestClose={() => setPicker('none')}>
        <TouchableOpacity style={styles.modalMask} activeOpacity={1} onPress={() => setPicker('none')}>
          <View style={styles.modalCard}>
            <Text style={[font.h3, { marginBottom: spacing.md }]}>关联目标</Text>
            {goals.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.modalRow}
                onPress={() => {
                  setGoalId(g.id);
                  setKrId(undefined);
                  setPicker('none');
                }}
              >
                <Text style={{ fontSize: 16 }}>{g.emoji}</Text>
                <Text style={font.body}>{g.name}</Text>
                {g.id === goalId && <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalRow} onPress={() => { setGoalId(undefined); setKrId(undefined); setPicker('none'); }}>
              <Text style={[font.body, { color: colors.textSecondary }]}>不关联目标</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 关键结果选择 */}
      <Modal visible={picker === 'kr'} transparent animationType="fade" onRequestClose={() => setPicker('none')}>
        <TouchableOpacity style={styles.modalMask} activeOpacity={1} onPress={() => setPicker('none')}>
          <View style={styles.modalCard}>
            <Text style={[font.h3, { marginBottom: spacing.md }]}>关联关键结果</Text>
            {goal?.keyResults.map((k) => (
              <TouchableOpacity key={k.id} style={styles.modalRow} onPress={() => { setKrId(k.id); setPicker('none'); }}>
                <Text style={font.body}>{k.title}</Text>
                <Text style={[font.caption, { marginLeft: 'auto' }]}>
                  {k.current}/{k.target}
                  {k.unit}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalRow} onPress={() => { setKrId(undefined); setPicker('none'); }}>
              <Text style={[font.body, { color: colors.textSecondary }]}>不关联</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  navBtn: { backgroundColor: colors.card, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: 7 },
  navBtnPrimary: { backgroundColor: colors.primaryLight },
  navBtnText: { fontSize: 15, color: colors.text },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 60 },

  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  titleInput: { fontSize: 17, color: colors.text, paddingVertical: 4 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  emojiCell: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  emojiCellActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 },
  paletteRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  paletteCell: { width: 26, height: 26, borderRadius: 13 },
  paletteCellActive: { borderWidth: 3, borderColor: colors.text },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowValue: { fontSize: 14, color: colors.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 8 },
  numInput: {
    minWidth: 64,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  segment: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.md, padding: 3 },
  segmentCell: { paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radius.sm },
  segmentCellActive: { backgroundColor: colors.card },
  segmentText: { fontSize: 13, color: colors.textSecondary },
  segmentTextActive: { color: colors.primary, fontWeight: '600' },
  weekRow: { flexDirection: 'row', gap: 6, marginTop: spacing.md, flexWrap: 'wrap' },
  weekCell: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekText: { fontSize: 12, color: colors.textSecondary },

  subChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  subChipText: { fontSize: 13, color: colors.text },
  addSubRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  addSubInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },

  deleteBtn: { backgroundColor: colors.dangerBg, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14, marginTop: spacing.xl },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 15 },

  modalMask: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12 },
});
