import { Category, CheckIn, Goal, Task } from '../types';
import { todayKey } from '../utils/date';
import { defaultGoalColor, goalColorPalette } from '../theme';

/**
 * 首次启动示例数据：
 * - 分类 生活 / 学习 / 工作 / 健康
 * - 目标「找到女朋友」归在 生活，周期 2026/11/14 - 2026/12/14
 * - 习惯「看二十页书」（参考图片 1）+ 关联 KR 的「主动认识一位新朋友」
 */
export function buildSeed(): { categories: Category[]; goals: Goal[]; tasks: Task[]; checkIns: CheckIn[] } {
  const categories: Category[] = [
    { id: 'cat-life', name: '生活', color: goalColorPalette[2] },
    { id: 'cat-study', name: '学习', color: goalColorPalette[9] },
    { id: 'cat-work', name: '工作', color: goalColorPalette[6] },
    { id: 'cat-health', name: '健康', color: goalColorPalette[0] },
  ];

  const goals: Goal[] = [
    {
      id: 'goal-gf',
      name: '找到女朋友',
      categoryId: 'cat-life',
      color: defaultGoalColor,
      motivations: [],
      feasibilities: [],
      startDate: '2026-11-14',
      endDate: '2026-12-14',
      useWeight: false,
      keyResults: [
        { id: 'kr-gf-1', title: '认识 10 个新朋友', target: 10, current: 0, unit: '人', weight: 0, emoji: '🙋' },
        { id: 'kr-gf-2', title: '主动约会 3 次', target: 3, current: 0, unit: '次', weight: 0, emoji: '💛' },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  const start = todayKey();

  const tasks: Task[] = [
    {
      id: 'task-read',
      title: '看二十页书',
      emoji: '📖',
      color: goalColorPalette[9],
      why: '每天进步一点点，未来的你会感谢现在的自己。',
      habitType: 'wisdom',
      frequency: 'daily',
      frequencyValue: 1,
      startDate: start,
      completionMode: 'timeSpan',
      completionValue: 30,
      dailyTarget: 1,
      difficulty: 'normal',
      reminderEnabled: true,
      reminderTime: '09:00',
      increment: 1,
      createdAt: new Date().toISOString(),
    },
    {
      // 关联到 KR 的每日习惯，打卡会推进「认识新朋友」的进度
      id: 'task-meet',
      title: '主动认识一位新朋友',
      emoji: '🙋',
      color: defaultGoalColor,
      why: '走出去，才会遇见对的人。',
      habitType: 'agility',
      frequency: 'daily',
      frequencyValue: 1,
      startDate: start,
      completionMode: 'forever',
      completionValue: 0,
      dailyTarget: 1,
      difficulty: 'normal',
      reminderEnabled: false,
      goalId: 'goal-gf',
      krId: 'kr-gf-1',
      increment: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  const checkIns: CheckIn[] = [];

  return { categories, goals, tasks, checkIns };
}
