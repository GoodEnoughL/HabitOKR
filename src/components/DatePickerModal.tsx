import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import {
  getMonthMatrix,
  monthLabel,
  parseKey,
  shiftMonth,
  todayKey,
  WEEKDAY_NAMES,
} from '../utils/date';

interface Props {
  visible: boolean;
  mode?: 'single' | 'range';
  value?: string; // single: 选中；range: 开始
  endValue?: string; // range: 结束
  title?: string;
  onClose: () => void;
  onConfirm: (start: string, end?: string) => void;
}

export function DatePickerModal({
  visible,
  mode = 'single',
  value,
  endValue,
  title,
  onClose,
  onConfirm,
}: Props) {
  const base = value ?? todayKey();
  const [year, setYear] = useState(() => parseKey(base).getFullYear());
  const [month, setMonth] = useState(() => parseKey(base).getMonth());
  const [start, setStart] = useState<string | undefined>(value);
  const [end, setEnd] = useState<string | undefined>(mode === 'range' ? endValue : undefined);

  const weeks = getMonthMatrix(year, month);
  const today = todayKey();

  const inRange = (key: string) =>
    !!start && !!end && key > start && key < end;

  const onDayPress = (key: string) => {
    if (mode === 'single') {
      setStart(key);
      return;
    }
    // range: 先选开始，再选结束；若再次选择则重置开始
    if (!start || (start && end)) {
      setStart(key);
      setEnd(undefined);
    } else {
      if (key < start) {
        setStart(key);
      } else {
        setEnd(key);
      }
    }
  };

  const confirm = () => {
    if (!start) return;
    if (mode === 'range') {
      onConfirm(start, end ?? start);
    } else {
      onConfirm(start);
    }
  };

  return (
    <Modal
      visible={visible}
      key={visible ? `open-${mode}-${base}-${endValue ?? ''}` : 'closed'}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.mask} activeOpacity={1} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={styles.cancel}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title ?? (mode === 'range' ? '选择时间范围' : '选择日期')}</Text>
            <TouchableOpacity onPress={confirm} hitSlop={8} disabled={!start}>
              <Text style={[styles.confirm, !start && { color: colors.textTertiary }]}>确定</Text>
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
                const isStart = key === start;
                const isEnd = key === end;
                const range = inRange(key);
                const isToday = key === today;
                return (
                  <TouchableOpacity key={di} style={styles.dayCell} onPress={() => onDayPress(key)} activeOpacity={0.7}>
                    {range && <View style={styles.rangeFill} />}
                    <View
                      style={[
                        styles.dayCircle,
                        (isStart || isEnd) && styles.daySelected,
                        isToday && !isStart && !isEnd && styles.dayToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          (isStart || isEnd) && styles.dayTextSelected,
                          isToday && !isStart && !isEnd && { color: colors.primary },
                        ]}
                      >
                        {Number(key.slice(8))}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setYear((y) => y - 1)} hitSlop={8} style={styles.navBtn}>
              <Text style={styles.navText}>«</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { const p = shiftMonth(year, month, -1); setYear(p.year); setMonth(p.month); }} hitSlop={8} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{monthLabel(year, month)}</Text>
            <TouchableOpacity onPress={() => { const n = shiftMonth(year, month, 1); setYear(n.year); setMonth(n.month); }} hitSlop={8} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setYear((y) => y + 1)} hitSlop={8} style={styles.navBtn}>
              <Text style={styles.navText}>»</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  cancel: { fontSize: 15, color: colors.textSecondary },
  title: { ...font.h3 },
  confirm: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  weekRow: { flexDirection: 'row', marginTop: spacing.sm },
  weekText: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.textTertiary, paddingVertical: 4 },
  dayCell: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 38, position: 'relative' },
  rangeFill: { ...StyleSheet.absoluteFill, backgroundColor: colors.primaryLight, marginVertical: 9 },
  dayCircle: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  daySelected: { backgroundColor: colors.primary },
  dayToday: { backgroundColor: colors.primaryLight },
  dayText: { fontSize: 14, color: colors.text },
  dayTextSelected: { color: '#fff', fontWeight: '600' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, gap: spacing.lg },
  navBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  navText: { fontSize: 16, color: colors.textSecondary },
  monthText: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 96, textAlign: 'center' },
});
