import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';
import { CheckIn, Task } from '../types';
import { getMonthMatrixSun, isToday, shiftMonth, todayKey } from '../utils/date';
import { isTaskDoneOn } from '../utils/task';
import { Emoji } from './Emoji';

const WEEK_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];
const CN_MONTH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

interface Props {
  task: Task;
  checkIns: CheckIn[];
}

/** 详情页月历：周日开头，打卡日用习惯 emoji 标记，选中日虚线框 */
export function DetailCalendar({ task, checkIns }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(todayKey());
  const weeks = getMonthMatrixSun(year, month);

  const go = (delta: number) => {
    const d = shiftMonth(year, month, delta);
    setYear(d.year);
    setMonth(d.month);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => go(-1)} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{CN_MONTH[month]}月</Text>
        <TouchableOpacity onPress={() => go(1)} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEK_HEADERS.map((w) => (
          <Text key={w} style={styles.weekCell}>
            {w}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((key, ci) => {
            if (!key) return <View key={`${wi}-${ci}`} style={styles.dayCell} />;
            const done = isTaskDoneOn(task, checkIns, key);
            const isSel = selected === key;
            const isTodayCell = isToday(key);
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.dayCell,
                  isSel && styles.daySelected,
                  isTodayCell && !isSel && styles.dayToday,
                ]}
                onPress={() => setSelected(key)}
                activeOpacity={0.7}
              >
                {done ? (
                  <Emoji char={task.emoji} size={18} />
                ) : (
                  <Text style={[styles.dayNum, isTodayCell && styles.dayNumToday]}>
                    {parseInt(key.slice(8), 10)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const DAY = 36;

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 15, fontWeight: '600', color: colors.text },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  weekCell: { width: DAY, textAlign: 'center', fontSize: 12, color: colors.textSecondary, paddingVertical: 4 },
  dayCell: {
    width: DAY,
    height: DAY,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: 10 },
  dayToday: { backgroundColor: colors.primaryLight },
  dayNum: { fontSize: 13, color: colors.text },
  dayNumToday: { color: colors.primary, fontWeight: '600' },
});
