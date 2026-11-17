import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoalCard } from '../../components/GoalCard';
import { useStore } from '../../store/useStore';
import { goalColorPalette, colors, font, radius, spacing } from '../../theme';
import { GoalStatus } from '../../types';
import { getGoalStatus } from '../../utils/task';

const STATUS_TABS: { key: GoalStatus; label: string }[] = [
  { key: 'in_progress', label: '进行中' },
  { key: 'unplanned', label: '未计划' },
  { key: 'not_started', label: '未开始' },
  { key: 'ended', label: '已结束' },
];

export default function GoalsScreen() {
  const { goals, categories, addCategory, removeCategory } = useStore();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [activeStatus, setActiveStatus] = useState<GoalStatus>('in_progress');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const inCategory = useMemo(
    () => (categoryId ? goals.filter((g) => g.categoryId === categoryId) : goals),
    [goals, categoryId]
  );

  const counts = useMemo(() => {
    const map: Record<GoalStatus, number> = { in_progress: 0, unplanned: 0, not_started: 0, ended: 0 };
    inCategory.forEach((g) => {
      map[getGoalStatus(g)] += 1;
    });
    return map;
  }, [inCategory]);

  const list = useMemo(
    () => inCategory.filter((g) => getGoalStatus(g) === activeStatus),
    [inCategory, activeStatus]
  );

  const createCategory = () => {
    const name = newName.trim();
    if (!name) return;
    const color = goalColorPalette[categories.length % goalColorPalette.length];
    addCategory(name, color);
    setNewName('');
  };

  const confirmRemove = (id: string, name: string) =>
    Alert.alert('删除分类', `「${name}」下的目标将变为未分类，确定删除？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => removeCategory(id) },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 顶部导航（图片 3）：返回 + 右上「…」「+」 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => (categoryId ? setCategoryId(undefined) : router.push('/summary'))}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.iconBtn} hitSlop={8} onPress={() => setPickerVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            hitSlop={8}
            onPress={() =>
              router.push({ pathname: '/goal/edit', params: categoryId ? { categoryId } : {} })
            }
          >
            <Ionicons name="add" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.pageTitle} numberOfLines={1}>
        {selectedCategory ? selectedCategory.name : '全部目标'}
      </Text>

      {/* 状态 Tab */}
      <View style={styles.statusBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusScroll}>
          {STATUS_TABS.map((t) => {
            const active = activeStatus === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={styles.statusTab}
                onPress={() => setActiveStatus(t.key)}
              >
                <Text style={[styles.statusText, active && styles.statusTextActive]}>
                  {t.label} {counts[t.key]}
                </Text>
                {active && <View style={styles.statusUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {list.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onPress={() => router.push({ pathname: '/goal/detail', params: { id: goal.id } })}
          />
        ))}
        {list.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={font.caption}>
              {categoryId ? '该分类下' : ''}暂无{STATUS_TABS.find((t) => t.key === activeStatus)?.label}的目标
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 分类选择 */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.mask} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={[font.h3, { marginBottom: spacing.sm }]}>选择分类</Text>
            <TouchableOpacity
              style={styles.modalRow}
              onPress={() => {
                setCategoryId(undefined);
                setPickerVisible(false);
              }}
            >
              <Ionicons name="apps" size={16} color={colors.textSecondary} />
              <Text style={font.body}>全部目标</Text>
              {!categoryId && <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
            {categories.map((c) => (
              <View key={c.id} style={styles.modalRow}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                  onPress={() => {
                    setCategoryId(c.id);
                    setPickerVisible(false);
                  }}
                >
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={font.body}>{c.name}</Text>
                  {c.id === categoryId && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRemove(c.id, c.name)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.newRow}>
              <TextInput
                style={styles.newInput}
                placeholder="新建分类"
                placeholderTextColor={colors.textTertiary}
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={createCategory}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={createCategory} hitSlop={8}>
                <Ionicons name="add-circle" size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  statusBar: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  statusScroll: { paddingHorizontal: spacing.md, gap: spacing.xl },
  statusTab: { paddingVertical: spacing.md, alignItems: 'center' },
  statusText: { fontSize: 14, color: colors.textSecondary },
  statusTextActive: { color: colors.primary, fontWeight: '600' },
  statusUnderline: { position: 'absolute', bottom: 0, height: 2, width: 24, borderRadius: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyEmoji: { fontSize: 44 },

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
});
