import { CheckIn, Goal, Task } from '../types';
import { addDays, parseKey, toKey, todayKey, weekDayIndex } from './date';

/** 任务在某天是否有计划 */
export function isTaskScheduledOn(task: Task, dateKey: string): boolean {
  if (dateKey < task.startDate) return false;
  if (task.endDate && dateKey > task.endDate) return false;
  if (task.repeat === 'daily') return true;
  return task.weekDays.includes(weekDayIndex(parseKey(dateKey)));
}

/** 任务在某天是否已打卡 */
export function isTaskDoneOn(task: Task, checkIns: CheckIn[], dateKey: string): boolean {
  return checkIns.some((c) => c.taskId === task.id && c.date === dateKey);
}

export function taskProgress(task: Task): number {
  if (task.totalCount <= 0) return 0;
  return Math.min(1, task.doneCount / task.totalCount);
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

/** 近一周已过期未打卡的任务（不含今天） */
export function getOverdue(tasks: Task[], checkIns: CheckIn[]): { task: Task; date: string }[] {
  const today = todayKey();
  const result: { task: Task; date: string }[] = [];
  for (let i = 7; i >= 1; i--) {
    const key = toKey(addDays(parseKey(today), -i));
    for (const t of tasks) {
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

/** 某天各任务的打卡状态 */
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
