import { buildSeed } from '../data/seed';
import { defaultGoalColor } from '../theme';
import type { Category, CheckIn, Goal, Task } from '../types';
import { todayKey } from './date';

/**
 * 归一化任何历史/残缺的状态，补齐当前数据模型的字段。
 * 既用于 zustand 持久化迁移，也用于导入备份时的兜底校验。
 */
export function normalizePersisted(p: any): {
  categories: Category[];
  goals: Goal[];
  tasks: Task[];
  checkIns: CheckIn[];
} {
  const s = buildSeed();
  const categories = Array.isArray(p?.categories) && p.categories.length ? p.categories : s.categories;
  const goals = Array.isArray(p?.goals)
    ? p.goals
        .filter((g: any) => g && typeof g.name === 'string')
        .map((g: any) => ({
          id: g.id,
          name: g.name,
          categoryId: g.categoryId,
          color: g.color ?? defaultGoalColor,
          motivations: Array.isArray(g.motivations) ? g.motivations : [],
          feasibilities: Array.isArray(g.feasibilities) ? g.feasibilities : [],
          startDate: g.startDate,
          endDate: g.endDate,
          useWeight: !!g.useWeight,
          keyResults: Array.isArray(g.keyResults) ? g.keyResults : [],
          createdAt: g.createdAt ?? new Date().toISOString(),
        }))
    : s.goals;

  const VALID_HABIT_TYPES = new Set(['strength', 'wisdom', 'agility']);
  const VALID_FREQUENCIES = new Set(['daily', 'weekly', 'daysPerWeek', 'daysPerMonth', 'everyXDays']);
  const VALID_COMPLETIONS = new Set(['forever', 'timeSpan', 'totalCount']);
  const VALID_DIFFICULTIES = new Set(['easy', 'normal', 'hard']);

  const tasks = Array.isArray(p?.tasks)
    ? p.tasks
        .filter((t: any) => t && typeof t.title === 'string')
        .map((t: any) => {
          let frequency: Task['frequency'] = VALID_FREQUENCIES.has(t.frequency) ? t.frequency : 'daily';
          let frequencyValue = typeof t.frequencyValue === 'number' ? t.frequencyValue : 1;
          if (!t.frequency) {
            if (t.repeat === 'weekly') {
              frequency = 'weekly';
              frequencyValue = Array.isArray(t.weekDays) && t.weekDays[0] ? t.weekDays[0] : 1;
            } else if (t.repeat === 'daily') {
              frequency = 'daily';
            }
          }
          const habitType: Task['habitType'] = VALID_HABIT_TYPES.has(t.habitType) ? t.habitType : 'wisdom';
          const completionMode: Task['completionMode'] = VALID_COMPLETIONS.has(t.completionMode)
            ? t.completionMode
            : 'forever';
          const difficulty: Task['difficulty'] = VALID_DIFFICULTIES.has(t.difficulty) ? t.difficulty : 'normal';
          return {
            id: t.id,
            title: t.title,
            color: t.color ?? defaultGoalColor,
            emoji: t.emoji ?? '✅',
            why: typeof t.why === 'string' ? t.why : '',
            habitType,
            frequency,
            frequencyValue: Math.max(1, frequencyValue),
            startDate: t.startDate ?? t.date ?? todayKey(),
            completionMode,
            completionValue: t.completionValue ?? t.totalCount ?? 30,
            dailyTarget: Math.max(1, t.dailyTarget ?? 1),
            difficulty,
            reminderEnabled: !!t.reminderEnabled,
            reminderTime: t.reminderTime ?? (t.allDay === false ? t.time : undefined),
            goalId: t.goalId,
            krId: t.krId,
            increment: t.increment ?? 1,
            paused: !!t.paused,
            createdAt: t.createdAt ?? new Date().toISOString(),
          };
        })
    : s.tasks;
  const checkIns = Array.isArray(p?.checkIns) ? p.checkIns : s.checkIns;
  return { categories, goals, tasks, checkIns };
}
