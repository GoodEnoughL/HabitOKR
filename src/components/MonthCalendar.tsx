import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { getMonthMatrix, monthLabel, shiftMonth, toKey, todayKey, WEEKDAY_NAMES } from '../utils/date';

interface Props {
  year: number;
  month: number; // 0-based
  onMonthChange: (year: number, month: number) => void;
  selectedKey: string;
  onSelect: (key: string) => void;
  /** date -> 状态：none=无计划, pending=有计划未完成, done=全部完成, partial=部分完成 */
  dayStatus: Map<string, 'pending' | 'done' | 'partial'>;
}

export function MonthCalendar({ year, month, onMonthChange, selectedKey, onSelect, dayStatus }: Props) {
  const weeks = getMonthMatrix(year, month);
  const today = todayKey();
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onMonthChange(prev.year, prev.month)} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthLabel(year, month)}</Text>
        <TouchableOpacity onPress={() => onMonthChange(next.year, next.month)} hitSlop={12}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_NAMES.map((w) => (
          <Text key={w} style={styles.weekText}>
            {w.slice(1)}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((key, di) => {
            if (!key) return <View key={di} style={styles.dayCell} />;
            const selected = key === selectedKey;
            const status = dayStatus.get(key);
            return (
              <TouchableOpacity key={di} style={styles.dayCell} onPress={() => onSelect(key)} activeOpacity={0.7}>
                <View
                  style={[
                    styles.dayCircle,
                    selected && styles.daySelected,
                    key === today && !selected && styles.dayToday,
                  ]}
                >
                  <Text style={[styles.dayText, selected && styles.dayTextSelected, key === today && !selected && { color: colors.primary }]}>
                    {Number(key.slice(8))}
                  </Text>
                </View>
                <View
                  style={[
                    styles.dot,
                    status === 'done' && { backgroundColor: colors.success },
                    status === 'partial' && { backgroundColor: colors.warning },
                    (status === 'pending' || !status) && { backgroundColor: status === 'pending' ? colors.primary : 'transparent' },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  monthText: { fontSize: 16, fontWeight: '700', color: colors.text },
  weekRow: { flexDirection: 'row', marginTop: spacing.sm },
  weekText: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.textTertiary },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayCircle: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.primary },
  dayToday: { backgroundColor: colors.primaryLight },
  dayText: { fontSize: 14, color: colors.text },
  dayTextSelected: { color: '#fff', fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2, backgroundColor: 'transparent' },
});
