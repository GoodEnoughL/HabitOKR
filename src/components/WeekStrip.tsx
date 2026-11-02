import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { getWeekDates, parseKey, toKey, todayKey, WEEKDAY_NAMES } from '../utils/date';

interface Props {
  selectedKey: string;
  onSelect: (key: string) => void;
  /** 有计划任务的日期 */
  scheduledKeys: Set<string>;
  /** 全部完成的日期 */
  doneKeys: Set<string>;
}

export function WeekStrip({ selectedKey, onSelect, scheduledKeys, doneKeys }: Props) {
  const week = getWeekDates(parseKey(selectedKey));
  const today = todayKey();

  return (
    <View style={styles.row}>
      {week.map((d, i) => {
        const key = toKey(d);
        const selected = key === selectedKey;
        const scheduled = scheduledKeys.has(key);
        const allDone = scheduled && doneKeys.has(key);
        return (
          <TouchableOpacity key={key} style={styles.col} onPress={() => onSelect(key)} activeOpacity={0.7}>
            <Text style={[styles.weekday, selected && styles.weekdaySelected]}>{WEEKDAY_NAMES[i]}</Text>
            <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
              <Text style={[styles.dayText, selected && styles.dayTextSelected, key === today && !selected && styles.dayTextToday]}>
                {d.getDate()}
              </Text>
            </View>
            <View
              style={[
                styles.dot,
                { backgroundColor: allDone ? colors.success : selected ? colors.primary : colors.textTertiary },
                !scheduled && { opacity: 0 },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  col: { flex: 1, alignItems: 'center' },
  weekday: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  weekdaySelected: { color: colors.primary, fontWeight: '600' },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 15, fontWeight: '600', color: colors.text },
  dayTextSelected: { color: '#fff' },
  dayTextToday: { color: colors.primary },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 5 },
});
