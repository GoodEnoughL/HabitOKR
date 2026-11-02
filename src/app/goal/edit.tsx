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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { accentPalette, colors, font, radius, spacing } from '../../theme';
import { KeyResult } from '../../types';
import { addDays, toKey } from '../../utils/date';
import { genId } from '../../utils/task';

const EMOJI_CHOICES = ['🎯', '🏋️', '📖', '🎧', '🧘', '💻', '✍️', '🏃', '💰', '🌱'];

export default function GoalEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { goals, groups, addGoal, updateGoal, removeGoal, addGroup } = useStore();
  const editing = useMemo(() => goals.find((g) => g.id === id), [goals, id]);

  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '🎯');
  const [color, setColor] = useState(editing?.color ?? accentPalette[0]);
  const [groupId, setGroupId] = useState<string | undefined>(editing?.groupId);
  const [motivation, setMotivation] = useState(editing?.motivation ?? 0);
  const [feasibility, setFeasibility] = useState(editing?.feasibility ?? 0);
  const [startDate, setStartDate] = useState<string | undefined>(editing?.startDate);
  const [endDate, setEndDate] = useState<string | undefined>(editing?.endDate);
  const [useWeight, setUseWeight] = useState(editing?.useWeight ?? false);
  const [keyResults, setKeyResults] = useState<KeyResult[]>(editing?.keyResults ?? []);
  const [newKR, setNewKR] = useState('');
  const [reorderMode, setReorderMode] = useState(false);

  const [picker, setPicker] = useState<'none' | 'group' | 'score' | 'time'>('none');
  const [newGroupName, setNewGroupName] = useState('');

  const group = groups.find((g) => g.id === groupId);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入目标名称');
      return;
    }
    const payload = {
      name: name.trim(),
      emoji,
      color,
      groupId,
      motivation,
      feasibility,
      startDate,
      endDate,
      useWeight,
      keyResults,
    };
    if (editing) updateGoal(editing.id, payload);
    else addGoal(payload);
    router.back();
  };

  const addKR = () => {
    if (!newKR.trim()) return;
    setKeyResults((krs) => [
      ...krs,
      { id: genId(), title: newKR.trim(), target: 1, current: 0, unit: '', weight: 0 },
    ]);
    setNewKR('');
  };

  const patchKR = (krId: string, patch: Partial<KeyResult>) =>
    setKeyResults((krs) => krs.map((k) => (k.id === krId ? { ...k, ...patch } : k)));

  const moveKR = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= keyResults.length) return;
    const next = [...keyResults];
    [next[index], next[j]] = [next[j], next[index]];
    setKeyResults(next);
  };

  const setTimePreset = (months: number | null) => {
    if (months === null) {
      setStartDate(undefined);
      setEndDate(undefined);
    } else {
      const start = new Date();
      setStartDate(toKey(start));
      setEndDate(toKey(addDays(start, months * 30)));
    }
    setPicker('none');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 顶部导航 */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} hitSlop={8}>
            <Text style={styles.navBtnText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{editing ? '编辑目标' : '新建目标'}</Text>
          <TouchableOpacity onPress={save} style={[styles.navBtn, styles.navBtnPrimary]} hitSlop={8}>
            <Text style={[styles.navBtnText, { color: colors.primary, fontWeight: '600' }]}>完成</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* 目标名称 */}
          <View style={styles.nameCard}>
            <TextInput
              style={styles.nameInput}
              placeholder="输入目标名称"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <View style={[styles.colorDot, { backgroundColor: color }]} />
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

          {/* 目标组 & 动机可行性 */}
          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.metaChip} onPress={() => setPicker('group')}>
              <Text style={styles.metaChipIcon}>📦</Text>
              <Text style={styles.metaChipText}>{group ? `所属目标组 ${group.name}` : '所属目标组'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.metaChip} onPress={() => setPicker('score')}>
              <Text style={styles.metaChipIcon}>💡</Text>
              <Text style={styles.metaChipText}>动机&可行性 ({motivation + feasibility})</Text>
            </TouchableOpacity>
          </View>

          {/* 目标时间 */}
          <TouchableOpacity style={styles.rowCard} onPress={() => setPicker('time')}>
            <Text style={font.h3}>目标时间</Text>
            <Text style={styles.rowValue}>
              {startDate && endDate ? `${startDate} ~ ${endDate}` : '未设置'}
            </Text>
          </TouchableOpacity>

          {/* 关键结果 */}
          <View style={styles.krCard}>
            <View style={styles.krHeader}>
              <Ionicons name="flag" size={15} color={colors.textSecondary} />
              <Text style={[font.h3, { marginLeft: 4 }]}>关键结果</Text>
              <TouchableOpacity style={styles.sortBtn} onPress={() => setReorderMode((v) => !v)}>
                <Ionicons name="swap-vertical" size={14} color={colors.primary} />
                <Text style={styles.sortText}>{reorderMode ? '完成' : '排序'}</Text>
              </TouchableOpacity>
            </View>

            {keyResults.map((kr, index) => (
              <View key={kr.id} style={styles.krItem}>
                {reorderMode ? (
                  <View style={styles.reorderBtns}>
                    <TouchableOpacity onPress={() => moveKR(index, -1)} hitSlop={6}>
                      <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveKR(index, 1)} hitSlop={6}>
                      <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.krDot, { backgroundColor: color }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.krTitle}>{kr.title}</Text>
                  <View style={styles.krMetaRow}>
                    <Text style={styles.krMetaLabel}>当前</Text>
                    <TextInput
                      style={styles.krNumInput}
                      keyboardType="numeric"
                      value={String(kr.current)}
                      onChangeText={(v) => patchKR(kr.id, { current: Math.max(0, Number(v) || 0) })}
                    />
                    <Text style={styles.krMetaLabel}>目标</Text>
                    <TextInput
                      style={styles.krNumInput}
                      keyboardType="numeric"
                      value={String(kr.target)}
                      onChangeText={(v) => patchKR(kr.id, { target: Math.max(1, Number(v) || 1) })}
                    />
                    <TextInput
                      style={[styles.krNumInput, { width: 44 }]}
                      placeholder="单位"
                      placeholderTextColor={colors.textTertiary}
                      value={kr.unit}
                      onChangeText={(v) => patchKR(kr.id, { unit: v })}
                    />
                    {useWeight && (
                      <>
                        <Text style={styles.krMetaLabel}>权重%</Text>
                        <TextInput
                          style={styles.krNumInput}
                          keyboardType="numeric"
                          value={String(kr.weight)}
                          onChangeText={(v) => patchKR(kr.id, { weight: Math.max(0, Math.min(100, Number(v) || 0)) })}
                        />
                      </>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => setKeyResults((krs) => krs.filter((k) => k.id !== kr.id))} hitSlop={6}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}

            {/* 添加关键结果 */}
            <View style={styles.addKRRow}>
              <TextInput
                style={styles.addKRInput}
                placeholder="添加关键结果（里程碑）"
                placeholderTextColor={colors.textTertiary}
                value={newKR}
                onChangeText={setNewKR}
                onSubmitEditing={addKR}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={addKR} hitSlop={8}>
                <Ionicons name="add-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 权重开关 */}
          <View style={styles.weightCard}>
            <View style={styles.weightHeader}>
              <Text style={font.h3}>权重</Text>
              <Switch value={useWeight} onValueChange={setUseWeight} trackColor={{ true: colors.primary }} />
            </View>
            <Text style={font.caption}>每个关键结果对目标有不同的重要度</Text>
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() =>
                Alert.alert('删除目标', '删除后相关任务将解除关联，确定删除？', [
                  { text: '取消', style: 'cancel' },
                  {
                    text: '删除',
                    style: 'destructive',
                    onPress: () => {
                      removeGoal(editing.id);
                      router.back();
                    },
                  },
                ])
              }
            >
              <Text style={styles.deleteText}>删除目标</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 目标组选择 */}
      <Modal visible={picker === 'group'} transparent animationType="fade" onRequestClose={() => setPicker('none')}>
        <TouchableOpacity style={styles.modalMask} activeOpacity={1} onPress={() => setPicker('none')}>
          <View style={styles.modalCard}>
            <Text style={[font.h3, { marginBottom: spacing.md }]}>选择目标组</Text>
            {groups.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.modalRow}
                onPress={() => {
                  setGroupId(g.id);
                  setPicker('none');
                }}
              >
                <View style={[styles.colorDot, { backgroundColor: g.color, width: 12, height: 12 }]} />
                <Text style={font.body}>{g.name}</Text>
                {g.id === groupId && <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalRow}
              onPress={() => {
                setGroupId(undefined);
                setPicker('none');
              }}
            >
              <Text style={[font.body, { color: colors.textSecondary }]}>不设置目标组</Text>
            </TouchableOpacity>
            <View style={styles.newGroupRow}>
              <TextInput
                style={styles.newGroupInput}
                placeholder="新建目标组"
                placeholderTextColor={colors.textTertiary}
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
              <TouchableOpacity
                onPress={() => {
                  if (!newGroupName.trim()) return;
                  const gid = addGroup(newGroupName.trim(), accentPalette[groups.length % accentPalette.length]);
                  setGroupId(gid);
                  setNewGroupName('');
                  setPicker('none');
                }}
              >
                <Ionicons name="add-circle" size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 动机 & 可行性评分 */}
      <Modal visible={picker === 'score'} transparent animationType="fade" onRequestClose={() => setPicker('none')}>
        <TouchableOpacity style={styles.modalMask} activeOpacity={1} onPress={() => setPicker('none')}>
          <View style={styles.modalCard}>
            {([
              ['动机', motivation, setMotivation],
              ['可行性', feasibility, setFeasibility],
            ] as const).map(([label, value, setter]) => (
              <View key={label} style={styles.scoreRow}>
                <Text style={font.h3}>{label}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setter(n === value ? 0 : n)}>
                      <Ionicons name={n <= value ? 'star' : 'star-outline'} size={26} color={colors.warning} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.modalDone} onPress={() => setPicker('none')}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>完成</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 目标时间 */}
      <Modal visible={picker === 'time'} transparent animationType="fade" onRequestClose={() => setPicker('none')}>
        <TouchableOpacity style={styles.modalMask} activeOpacity={1} onPress={() => setPicker('none')}>
          <View style={styles.modalCard}>
            <Text style={[font.h3, { marginBottom: spacing.md }]}>目标周期</Text>
            {[
              ['一个月', 1],
              ['三个月', 3],
              ['半年', 6],
              ['一年', 12],
            ].map(([label, months]) => (
              <TouchableOpacity key={label as string} style={styles.modalRow} onPress={() => setTimePreset(months as number)}>
                <Text style={font.body}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalRow} onPress={() => setTimePreset(null)}>
              <Text style={[font.body, { color: colors.danger }]}>清除时间</Text>
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
  navBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
  },
  navBtnPrimary: { backgroundColor: colors.primaryLight },
  navBtnText: { fontSize: 15, color: colors.text },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 60 },

  nameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  nameInput: { flex: 1, fontSize: 17, color: colors.text, paddingVertical: 16 },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  emojiCell: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1 },
  paletteRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  paletteCell: { width: 26, height: 26, borderRadius: 13 },
  paletteCellActive: { borderWidth: 3, borderColor: colors.text },

  chipsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  metaChipIcon: { fontSize: 13 },
  metaChipText: { fontSize: 12, color: colors.textSecondary },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  rowValue: { fontSize: 14, color: colors.textSecondary },

  krCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  krHeader: { flexDirection: 'row', alignItems: 'center' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto' },
  sortText: { fontSize: 13, color: colors.primary },
  krItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  krDot: { width: 8, height: 8, borderRadius: 4 },
  reorderBtns: { alignItems: 'center' },
  krTitle: { fontSize: 14, fontWeight: '500', color: colors.text },
  krMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  krMetaLabel: { fontSize: 12, color: colors.textTertiary },
  krNumInput: {
    width: 56,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: colors.text,
  },
  addKRRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    marginTop: spacing.lg,
  },
  addKRInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 12 },

  weightCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  weightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },

  deleteBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: spacing.xl,
  },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 15 },

  modalMask: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12 },
  newGroupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  newGroupInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  modalDone: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
});
