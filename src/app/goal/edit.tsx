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
import { DatePickerModal } from '../../components/DatePickerModal';
import { useStore } from '../../store/useStore';
import { defaultGoalColor, goalColorPalette, colors, font, radius, spacing } from '../../theme';
import { KeyResult } from '../../types';
import { formatSlash } from '../../utils/date';
import { genId } from '../../utils/task';

type Picker = 'none' | 'category' | 'color' | 'time' | 'motivation';

const INFO: Record<string, string> = {
  kr: '关键结果（Key Result）是衡量目标是否达成的可量化里程碑。\n目标是方向，关键结果是证据——每完成一项，目标进度就前进一步。',
  weight: '开启后，可为每个关键结果设置权重（百分比）。\n权重越高，该关键结果对整体目标进度的影响越大，用于区分重要度。',
  motivation: '动机：执行目标的动力。\n在开始前想清楚「为什么要做」，能在倦怠时给你持续的推力。',
  feasibility: '可行性：实现目标的基础。\n梳理「凭什么能做成」——现有资源、能力、条件，让目标脚踏实地。',
};

export default function GoalEditScreen() {
  const { id, categoryId: initCategoryId } = useLocalSearchParams<{ id?: string; categoryId?: string }>();
  const { goals, categories, addGoal, updateGoal, removeGoal, addCategory } = useStore();
  const editing = useMemo(() => goals.find((g) => g.id === id), [goals, id]);

  const [name, setName] = useState(editing?.name ?? '');
  const [color, setColor] = useState(editing?.color ?? defaultGoalColor);
  const [categoryId, setCategoryId] = useState<string | undefined>(editing?.categoryId ?? initCategoryId);
  const [startDate, setStartDate] = useState<string | undefined>(editing?.startDate);
  const [endDate, setEndDate] = useState<string | undefined>(editing?.endDate);
  const [useWeight, setUseWeight] = useState(editing?.useWeight ?? false);
  const [keyResults, setKeyResults] = useState<KeyResult[]>(editing?.keyResults ?? []);
  const [motivations, setMotivations] = useState<string[]>(editing?.motivations ?? []);
  const [feasibilities, setFeasibilities] = useState<string[]>(editing?.feasibilities ?? []);
  const [newKR, setNewKR] = useState('');
  const [reorderMode, setReorderMode] = useState(false);
  const [picker, setPicker] = useState<Picker>('none');
  const [newCategoryName, setNewCategoryName] = useState('');

  const category = categories.find((c) => c.id === categoryId);
  const mfCount = motivations.length + feasibilities.length;

  const save = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入目标名称');
      return;
    }
    const payload = {
      name: name.trim(),
      color,
      categoryId,
      motivations: motivations.filter((s) => s.trim()),
      feasibilities: feasibilities.filter((s) => s.trim()),
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

  const updateList = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => setter((arr) => arr.map((s, i) => (i === index ? value : s)));
  const removeFromList = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => setter((arr) => arr.filter((_, i) => i !== index));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          {/* 目标名称 + 颜色圆点 */}
          <View style={styles.nameCard}>
            <TextInput
              style={styles.nameInput}
              placeholder="输入目标名称"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity onPress={() => setPicker('color')} hitSlop={8}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
            </TouchableOpacity>
          </View>

          {/* 分类 & 动机可行性 */}
          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.metaChip} onPress={() => setPicker('category')}>
              <Ionicons name="folder" size={13} color={category?.color ?? colors.textSecondary} />
              <Text style={styles.metaChipText}>{category ? category.name : '未分类'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.metaChip} onPress={() => setPicker('motivation')}>
              <Ionicons name="bulb-outline" size={13} color={colors.warning} />
              <Text style={styles.metaChipText}>动机&可行性 ({mfCount})</Text>
            </TouchableOpacity>
          </View>

          {/* 目标时间 */}
          <TouchableOpacity style={styles.rowCard} onPress={() => setPicker('time')}>
            <Text style={font.h3}>目标时间</Text>
            <Text style={styles.rowValue}>
              {startDate && endDate ? `${formatSlash(startDate)} - ${formatSlash(endDate)}` : '未设置'}
            </Text>
          </TouchableOpacity>

          {/* 关键结果 */}
          <View style={styles.krCard}>
            <View style={styles.krHeader}>
              <Ionicons name="flag" size={15} color={colors.textSecondary} />
              <Text style={[font.h3, { marginLeft: 4 }]}>关键结果</Text>
              <TouchableOpacity onPress={() => Alert.alert('关键结果', INFO.kr)} hitSlop={8} style={{ marginLeft: 2 }}>
                <Ionicons name="information-circle-outline" size={15} color={colors.textTertiary} />
              </TouchableOpacity>
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
                  <TextInput
                    style={styles.krTitleInput}
                    value={kr.title}
                    onChangeText={(v) => patchKR(kr.id, { title: v })}
                    placeholder="关键结果名称"
                    placeholderTextColor={colors.textTertiary}
                  />
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
                      style={[styles.krNumInput, { width: 48 }]}
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

          {/* 权重 */}
          <View style={styles.weightCard}>
            <View style={styles.weightHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={font.h3}>权重</Text>
                <TouchableOpacity onPress={() => Alert.alert('权重', INFO.weight)} hitSlop={8}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              <Switch value={useWeight} onValueChange={setUseWeight} trackColor={{ true: colors.primary }} />
            </View>
            <Text style={font.caption}>每个关键结果对目标有不同的重要度</Text>
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() =>
                Alert.alert('删除目标', '删除后相关习惯将解除关联，确定删除？', [
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

      {/* 分类选择 */}
      <Modal visible={picker === 'category'} transparent animationType="fade" onRequestClose={() => setPicker('none')}>
        <TouchableOpacity style={styles.mask} activeOpacity={1} onPress={() => setPicker('none')}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={[font.h3, { marginBottom: spacing.md }]}>选择分类</Text>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.modalRow}
                onPress={() => {
                  setCategoryId(c.id);
                  setPicker('none');
                }}
              >
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <Text style={font.body}>{c.name}</Text>
                {c.id === categoryId && <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalRow}
              onPress={() => {
                setCategoryId(undefined);
                setPicker('none');
              }}
            >
              <Text style={[font.body, { color: colors.textSecondary }]}>不设置分类</Text>
            </TouchableOpacity>
            <View style={styles.newRow}>
              <TextInput
                style={styles.newInput}
                placeholder="新建分类"
                placeholderTextColor={colors.textTertiary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                onSubmitEditing={() => {
                  if (!newCategoryName.trim()) return;
                  const cid = addCategory(newCategoryName.trim(), goalColorPalette[categories.length % goalColorPalette.length]);
                  setCategoryId(cid);
                  setNewCategoryName('');
                  setPicker('none');
                }}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => {
                  if (!newCategoryName.trim()) return;
                  const cid = addCategory(newCategoryName.trim(), goalColorPalette[categories.length % goalColorPalette.length]);
                  setCategoryId(cid);
                  setNewCategoryName('');
                  setPicker('none');
                }}
              >
                <Ionicons name="add-circle" size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 颜色色板（图片 3） */}
      <Modal visible={picker === 'color'} transparent animationType="fade" onRequestClose={() => setPicker('none')}>
        <TouchableOpacity style={styles.mask} activeOpacity={1} onPress={() => setPicker('none')}>
          <View style={[styles.modalCard, { paddingVertical: spacing.md }]} onStartShouldSetResponder={() => true}>
            {goalColorPalette.map((c, i) => {
              const num = 10 - i;
              const selected = c === color;
              return (
                <TouchableOpacity
                  key={c}
                  style={styles.colorRow}
                  onPress={() => {
                    setColor(c);
                    setPicker('none');
                  }}
                >
                  <View style={[styles.colorBadge, { backgroundColor: c }]}>
                    <Text style={styles.colorBadgeNum}>{num}</Text>
                  </View>
                  <Text style={[styles.colorRowNum, selected && { color: c, fontWeight: '700' }]}>{num}</Text>
                  {selected && <Ionicons name="checkmark" size={18} color={c} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 目标时间 */}
      <DatePickerModal
        visible={picker === 'time'}
        mode="range"
        value={startDate}
        endValue={endDate}
        title="目标时间"
        onClose={() => setPicker('none')}
        onConfirm={(s, e) => {
          setStartDate(s);
          setEndDate(e);
          setPicker('none');
        }}
      />

      {/* 动机 & 可行性（图片 5） */}
      <Modal visible={picker === 'motivation'} transparent animationType="slide" onRequestClose={() => setPicker('none')}>
        <SafeAreaView style={styles.mfSafe} edges={['top', 'bottom']}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => setPicker('none')} style={styles.navBtn} hitSlop={8}>
              <Text style={styles.navBtnText}>返回</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>动机&可行性</Text>
            <TouchableOpacity onPress={() => setPicker('none')} style={[styles.navBtn, styles.navBtnPrimary]} hitSlop={8}>
              <Text style={[styles.navBtnText, { color: colors.primary, fontWeight: '600' }]}>完成</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.mfScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.mfSectionLabel}>动机</Text>
            {motivations.map((m, i) => (
              <View key={`m${i}`} style={styles.mfItem}>
                <Ionicons name="sparkles" size={14} color={colors.warning} />
                <TextInput
                  style={styles.mfInput}
                  value={m}
                  onChangeText={(v) => updateList(setMotivations, i, v)}
                  placeholder="执行目标的动力"
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity onPress={() => removeFromList(setMotivations, i)} hitSlop={6}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.mfAdd} onPress={() => setMotivations((arr) => [...arr, ''])}>
              <Ionicons name="add-circle" size={22} color={colors.primary} />
              <Text style={styles.mfAddText}>添加动机（执行目标的动力）</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mfInfo} onPress={() => Alert.alert('动机', INFO.motivation)} hitSlop={8}>
              <Ionicons name="information-circle-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.mfInfoText}>为什么要做？想清楚动力</Text>
            </TouchableOpacity>

            <Text style={[styles.mfSectionLabel, { marginTop: spacing.xl }]}>可行性</Text>
            {feasibilities.map((f, i) => (
              <View key={`f${i}`} style={styles.mfItem}>
                <Ionicons name="build-outline" size={14} color={colors.success} />
                <TextInput
                  style={styles.mfInput}
                  value={f}
                  onChangeText={(v) => updateList(setFeasibilities, i, v)}
                  placeholder="实现目标的基础"
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity onPress={() => removeFromList(setFeasibilities, i)} hitSlop={6}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.mfAdd} onPress={() => setFeasibilities((arr) => [...arr, ''])}>
              <Ionicons name="add-circle" size={22} color={colors.primary} />
              <Text style={styles.mfAddText}>添加可行性（实现目标的基础）</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mfInfo} onPress={() => Alert.alert('可行性', INFO.feasibility)} hitSlop={8}>
              <Ionicons name="information-circle-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.mfInfoText}>凭什么能做成？梳理资源与条件</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
  krTitleInput: { fontSize: 14, fontWeight: '500', color: colors.text, padding: 0 },
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

  mask: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  newInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },

  colorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 9 },
  colorBadge: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  colorBadgeNum: { fontSize: 11, fontWeight: '700', color: '#fff' },
  colorRowNum: { fontSize: 16, color: colors.text },

  // 动机 & 可行性
  mfSafe: { flex: 1, backgroundColor: colors.bg },
  mfScroll: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  mfSectionLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  mfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  mfInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 8 },
  mfAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  mfAddText: { fontSize: 14, color: colors.textSecondary },
  mfInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm, paddingHorizontal: 4 },
  mfInfoText: { fontSize: 11, color: colors.textTertiary },
});
