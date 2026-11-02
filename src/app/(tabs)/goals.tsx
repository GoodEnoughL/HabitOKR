import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../../components/Chip';
import { ProgressRing } from '../../components/ProgressRing';
import { useStore } from '../../store/useStore';
import { colors, font, radius, spacing } from '../../theme';
import { goalProgress } from '../../utils/task';

export default function GoalsScreen() {
  const { goals, groups } = useStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={font.h1}>目标库</Text>
        <TouchableOpacity onPress={() => router.push('/goal/edit')} hitSlop={8}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {goals.map((goal) => {
          const progress = goalProgress(goal);
          const group = groups.find((g) => g.id === goal.groupId);
          return (
            <TouchableOpacity
              key={goal.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/goal/edit', params: { id: goal.id } })}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconCircle, { backgroundColor: goal.color + '1A' }]}>
                  <Text style={{ fontSize: 24 }}>{goal.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={font.h3}>{goal.name}</Text>
                  <View style={styles.chipRow}>
                    {group && <Chip label={group.name} color={group.color} bg={group.color + '14'} />}
                    {goal.endDate && <Chip label={`截止 ${goal.endDate}`} />}
                  </View>
                </View>
                <ProgressRing size={54} progress={progress} color={goal.color}>
                  <Text style={[styles.progressText, { color: goal.color }]}>{Math.round(progress * 100)}%</Text>
                </ProgressRing>
              </View>

              <View style={styles.krList}>
                {goal.keyResults.slice(0, 3).map((kr) => {
                  const p = kr.target > 0 ? Math.min(1, kr.current / kr.target) : 0;
                  return (
                    <View key={kr.id} style={styles.krRow}>
                      <Text style={styles.krTitle} numberOfLines={1}>
                        {kr.title}
                      </Text>
                      <View style={styles.krBarWrap}>
                        <View style={[styles.krBar, { width: `${p * 100}%`, backgroundColor: goal.color }]} />
                      </View>
                      <Text style={styles.krValue}>
                        {kr.current}/{kr.target}
                        {kr.unit}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}

        {goals.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={font.caption}>还没有目标，点击右上角 + 创建</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 6 },
  progressText: { fontSize: 13, fontWeight: '700' },
  krList: { marginTop: spacing.md, gap: spacing.sm },
  krRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  krTitle: { flex: 1, fontSize: 13, color: colors.textSecondary },
  krBarWrap: { width: 80, height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  krBar: { height: 5, borderRadius: 3 },
  krValue: { width: 72, fontSize: 12, color: colors.textSecondary, textAlign: 'right' },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyEmoji: { fontSize: 44 },
});
