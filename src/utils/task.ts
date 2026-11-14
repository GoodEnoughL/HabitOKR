import { CheckIn, CompletionMode, Difficulty, FrequencyType, Goal, GoalStatus, HabitType, Task } from '../types';
import { addDays, parseKey, toKey, todayKey, weekDayIndex, WEEKDAY_NAMES } from './date';

/** 习惯类型（图片：选择一个习惯类型） */
export const HABIT_TYPE_META: Record<HabitType, { emoji: string; label: string; desc: string }> = {
  strength: { emoji: '⚔️', label: '力量型', desc: '运动、工作…' },
  wisdom: { emoji: '📚', label: '智慧型', desc: '学习、创造…' },
  agility: { emoji: '🎯', label: '敏捷型', desc: '娱乐、休闲…' },
};

/** 打卡频率选项的展示文案（不含动态取值） */
export const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'daysPerWeek', label: '每周 X 天' },
  { value: 'daysPerMonth', label: '每月 X 天' },
  { value: 'everyXDays', label: '间隔 X 天' },
];

/** 频率折叠态展示文案 */
export function frequencyLabel(task: Task): string {
  switch (task.frequency) {
    case 'daily':
      return '每天';
    case 'weekly':
      return `每周${WEEKDAY_NAMES[Math.max(0, Math.min(6, task.frequencyValue - 1))]}`;
    case 'daysPerWeek':
      return `每周 ${task.frequencyValue} 天`;
    case 'daysPerMonth':
      return `每月 ${task.frequencyValue} 天`;
    case 'everyXDays':
      return `间隔 ${task.frequencyValue} 天`;
    default:
      return '每天';
  }
}

/** 通关条件折叠态展示文案 */
export function completionLabel(task: Task): string {
  if (task.completionMode === 'forever') return '永久';
  if (task.completionMode === 'timeSpan') return `${task.completionValue} 天`;
  return `${task.completionValue} 次`;
}

export const DIFFICULTY_META: Record<Difficulty, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
};

export const COMPLETION_OPTIONS: { value: CompletionMode; label: string }[] = [
  { value: 'forever', label: '永久' },
  { value: 'timeSpan', label: '按时间跨度' },
  { value: 'totalCount', label: '按总打卡次数' },
];

/** 🎲 内置鼓励话语 */
export const ENCOURAGEMENTS: string[] = [
  '每天进步一点点，未来的你会感谢现在的自己。',
  '坚持不是因为有希望，而是坚持了才有希望。',
  '你只管努力，剩下的交给时间。',
  '养成一个习惯，需要的只是开始。',
  '今天的打卡，是给明天最好的礼物。',
  '慢慢来，比较快。',
  '行动是治愈焦虑的良药。',
  '再坚持一下，惊喜就在前方。',
  '自律给我自由。',
  '把简单的事情重复做，就是不简单。',
  '日拱一卒无有尽，功不唐捐终入海。',
  '种一棵树最好的时间是十年前，其次是现在。',
];

/** Emoji 选择器 */
export const EMOJI_CHOICES: string[] = [
  '📖', '✏️', '📚', '💡', '🎯', '🏃', '💪', '🧘', '⚽', '🏀',
  '🎸', '🎨', '🎵', '💻', '🖥️', '📝', '🌱', '☀️', '🌙', '⭐',
  '🔥', '💧', '🍎', '🥗', '😴', '🧠', '❤️', '🙋', '🤝', '💬',
  '💰', '📈', '🧹', '🚿', '🦷', '📅',
];

/** 两个日期 key 之间相差的天数（b - a），本地时区 */
export function daysBetween(aKey: string, bKey: string): number {
  const ms = parseKey(bKey).getTime() - parseKey(aKey).getTime();
  return Math.round(ms / 86400000);
}

/**
 * 习惯在某天是否「可打卡 / 有计划」。
 * - 早于 startDate：未开始
 * - daily：每天
 * - weekly：指定周几（frequencyValue 1-7，周一~周日）
 * - everyXDays：距 startDate 的天数 % frequencyValue === 0
 * - daysPerWeek / daysPerMonth：周期内任意一天均可打卡，故每天都算有计划
 */
export function isTaskScheduledOn(task: Task, dateKey: string): boolean {
  if (dateKey < task.startDate) return false;
  switch (task.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return weekDayIndex(parseKey(dateKey)) === task.frequencyValue;
    case 'everyXDays': {
      const fv = Math.max(1, task.frequencyValue);
      return daysBetween(task.startDate, dateKey) % fv === 0;
    }
    case 'daysPerWeek':
    case 'daysPerMonth':
      return true;
    default:
      return true;
  }
}

/** 某天该习惯的打卡次数 */
export function getDayCheckInCount(task: Task, checkIns: CheckIn[], dateKey: string): number {
  return checkIns.filter((c) => c.taskId === task.id && c.date === dateKey).length;
}

/** 某天是否已达成当日打卡目标（次数 ≥ dailyTarget） */
export function isTaskDoneOn(task: Task, checkIns: CheckIn[], dateKey: string): boolean {
  return getDayCheckInCount(task, checkIns, dateKey) >= Math.max(1, task.dailyTarget);
}

/** startDate 之后（含）已达成当日目标的天数 */
export function getCompletedDays(task: Task, checkIns: CheckIn[]): number {
  const days = new Set<string>();
  for (const c of checkIns) {
    if (c.taskId !== task.id) continue;
    if (c.date < task.startDate) continue;
    if (isTaskDoneOn(task, checkIns, c.date)) days.add(c.date);
  }
  return days.size;
}

/** startDate 之后（含）的累计打卡次数 */
export function getTotalCheckIns(task: Task, checkIns: CheckIn[]): number {
  return checkIns.filter((c) => c.taskId === task.id && c.date >= task.startDate).length;
}

/** 经历了：从 startDate 到今天（含）的天数；尚未开始返回 0 */
export function getDaysSinceStart(task: Task): number {
  if (todayKey() < task.startDate) return 0;
  return daysBetween(task.startDate, todayKey()) + 1;
}

/** 距离通关的展示文案：永久 / 还剩 N 天 / 还剩 N 次 / 已通关 */
export function remainingToCompleteLabel(task: Task, checkIns: CheckIn[]): string {
  if (task.completionMode === 'forever') return '永久';
  if (task.completionMode === 'timeSpan') {
    const remain = task.completionValue - getCompletedDays(task, checkIns);
    return remain > 0 ? `还剩 ${remain} 天` : '已通关';
  }
  const remain = task.completionValue - getTotalCheckIns(task, checkIns);
  return remain > 0 ? `还剩 ${remain} 次` : '已通关';
}

/** 历史最高连续打卡天数（从 startDate 到今天，连续达标天数的最大值） */
export function getLongestStreak(task: Task, checkIns: CheckIn[]): number {
  if (!task.startDate) return 0;
  let longest = 0;
  let cur = 0;
  const start = parseKey(task.startDate);
  const end = parseKey(todayKey());
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (isTaskDoneOn(task, checkIns, toKey(d))) {
      cur += 1;
      if (cur > longest) longest = cur;
    } else {
      cur = 0;
    }
  }
  return longest;
}

/** 某个自然月内的累计打卡次数 */
export function getMonthCheckInCount(task: Task, checkIns: CheckIn[], year: number, month: number): number {
  const start = toKey(new Date(year, month, 1));
  const end = toKey(new Date(year, month + 1, 0));
  return checkIns.filter((c) => c.taskId === task.id && c.date >= start && c.date <= end).length;
}

/**
 * 习惯通关进度 0-1：
 * - forever：坚持率 = 已完成天数 / 已过去天数（含今天）
 * - timeSpan：已完成天数 / completionValue
 * - totalCount：累计打卡次数 / completionValue
 */
export function taskProgress(task: Task, checkIns: CheckIn[]): number {
  if (task.completionMode === 'forever') {
    const elapsed = Math.max(1, daysBetween(task.startDate, todayKey()) + 1);
    return Math.min(1, getCompletedDays(task, checkIns) / elapsed);
  }
  if (task.completionMode === 'timeSpan') {
    const target = Math.max(1, task.completionValue);
    return Math.min(1, getCompletedDays(task, checkIns) / target);
  }
  // totalCount
  const target = Math.max(1, task.completionValue);
  return Math.min(1, getTotalCheckIns(task, checkIns) / target);
}

/** 目标进度：按关键结果加权或取平均 */
export function goalProgress(goal: Goal): number {
  const krs = goal.keyResults.filter((k) => k.target > 0);
  if (krs.length === 0) return 0;
  if (goal.useWeight) {
    const totalWeight = krs.reduce((s, k) => s + k.weight, 0);
    if (totalWeight <= 0) return 0;
    return krs.reduce((s, k) => s + Math.min(1, k.current / k.target) * (k.weight / totalWeight), 0);
  }
  return krs.reduce((s, k) => s + Math.min(1, k.current / k.target), 0) / krs.length;
}

/**
 * 推导目标状态（图片 1 的四个 Tab）：
 * - 未计划：未设置任何时间
 * - 未开始：开始日期在今天之后
 * - 已结束：结束日期已过，或进度达成 100%
 * - 进行中：其余
 */
export function getGoalStatus(goal: Goal): GoalStatus {
  const today = todayKey();
  if (!goal.startDate && !goal.endDate) return 'unplanned';
  if (goal.startDate && goal.startDate > today) return 'not_started';
  const ended = (goal.endDate && goal.endDate < today) || goalProgress(goal) >= 1;
  if (ended) return 'ended';
  return 'in_progress';
}

/** 近一周已过期未打卡的习惯（不含今天，仅固定排期类型） */
export function getOverdue(tasks: Task[], checkIns: CheckIn[]): { task: Task; date: string }[] {
  const today = todayKey();
  const result: { task: Task; date: string }[] = [];
  for (let i = 7; i >= 1; i--) {
    const key = toKey(addDays(parseKey(today), -i));
    for (const t of tasks) {
      if (t.paused) continue; // 暂停中的习惯不计超期
      // daysPerWeek / daysPerMonth 为周期内任意天，不按天判超期
      if (t.frequency === 'daysPerWeek' || t.frequency === 'daysPerMonth') continue;
      if (isTaskScheduledOn(t, key) && !isTaskDoneOn(t, checkIns, key)) {
        result.push({ task: t, date: key });
      }
    }
  }
  return result;
}

/** 连续打卡天数：从今天（或昨天，若今天还没打卡）往前逐日统计 */
export function getStreak(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;
  const days = new Set(checkIns.map((c) => c.date));
  let cursor = parseKey(todayKey());
  if (!days.has(toKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(toKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** 某天各习惯的打卡状态 */
export function getDayTaskStates(
  tasks: Task[],
  checkIns: CheckIn[],
  dateKey: string
): { task: Task; done: boolean }[] {
  return tasks
    .filter((t) => isTaskScheduledOn(t, dateKey))
    .map((t) => ({ task: t, done: isTaskDoneOn(t, checkIns, dateKey) }));
}

/** 近 n 天每天的打卡数量 */
export function getDailyCheckInCounts(checkIns: CheckIn[], days: number): { date: string; count: number }[] {
  const today = parseKey(todayKey());
  return Array.from({ length: days }, (_, i) => {
    const key = toKey(addDays(today, i - (days - 1)));
    return { date: key, count: checkIns.filter((c) => c.date === key).length };
  });
}

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 百分比格式化，保留两位小数（图片 1 的 0.00%） */
export function formatProgressPct(progress: number): string {
  return `${(Math.max(0, Math.min(1, progress)) * 100).toFixed(2)}%`;
}
