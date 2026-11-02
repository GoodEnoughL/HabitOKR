import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { colors, font, radius, spacing } from '../../theme';

export default function ProfileScreen() {
  const { goals, tasks, checkIns, resetToSeed, clearAll } = useStore();

  const items: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }[] = [
    { icon: 'calendar-outline', label: '任务日历', onPress: () => router.push('/calendar') },
    {
      icon: 'refresh-outline',
      label: '重置为示例数据',
      onPress: () =>
        Alert.alert('重置数据', '将恢复为内置示例数据，当前数据会被覆盖。', [
          { text: '取消', style: 'cancel' },
          { text: '重置', onPress: resetToSeed },
        ]),
    },
    {
      icon: 'trash-outline',
      label: '清空所有数据',
      danger: true,
      onPress: () =>
        Alert.alert('清空数据', '所有目标、任务和打卡记录都会被删除，且不可恢复。', [
          { text: '取消', style: 'cancel' },
          { text: '清空', style: 'destructive', onPress: clearAll },
        ]),
    },
    {
      icon: 'information-circle-outline',
      label: '关于 HabitOKR',
      onPress: () => Alert.alert('HabitOKR', 'OKR 驱动的习惯打卡应用\n版本 1.0.0'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={font.h1}>我的</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 30 }}>🎯</Text>
          </View>
          <Text style={styles.name}>OKR 践行者</Text>
          <Text style={font.caption}>以目标为导向，用习惯积累改变</Text>
          <View style={styles.statsRow}>
            {[
              [goals.length, '目标'],
              [tasks.length, '任务'],
              [checkIns.length, '打卡'],
            ].map(([num, label]) => (
              <View key={label as string} style={styles.statItem}>
                <Text style={styles.statNum}>{num}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.menuCard}>
          {items.map((item, i) => (
            <TouchableOpacity key={item.label} style={[styles.menuRow, i > 0 && styles.menuDivider]} onPress={item.onPress}>
              <Ionicons name={item.icon} size={20} color={item.danger ? colors.danger : colors.textSecondary} />
              <Text style={[styles.menuText, item.danger && { color: colors.danger }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>HabitOKR 1.0.0 · iOS</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  profileCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.xxl },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  menuCard: { backgroundColor: colors.card, borderRadius: radius.lg, marginTop: spacing.md, paddingHorizontal: spacing.lg },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 15 },
  menuDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  menuText: { fontSize: 15, color: colors.text },
  version: { textAlign: 'center', marginTop: spacing.xl, fontSize: 12, color: colors.textTertiary },
});
