import { CheckIn, Goal, GoalGroup, Task } from '../types';
import { addDays, toKey, todayKey, parseKey } from '../utils/date';

/**
 * 首次启动时的示例数据。
 * 日期基于“今天”动态生成，保证演示时周历、超期提醒、统计都有内容。
 */
export function buildSeed(): { groups: GoalGroup[]; goals: Goal[]; tasks: Task[]; checkIns: CheckIn[] } {
  const groups: GoalGroup[] = [
    { id: 'g-health', name: '健康生活', color: '#FF7A45' },
    { id: 'g-growth', name: '个人成长', color: '#2F80ED' },
  ];

  const today = parseKey(todayKey());
  const key = (offset: number) => toKey(addDays(today, offset));

  const goals: Goal[] = [
    {
      id: 'goal-fit',
      name: '健身',
      groupId: 'g-health',
      color: '#FF7A45',
      emoji: '🏋️',
      motivation: 5,
      feasibility: 4,
      startDate: key(-21),
      endDate: key(70),
      useWeight: true,
      keyResults: [
        { id: 'kr-fit-1', title: '完成 32 次训练', target: 32, current: 2, unit: '次', weight: 50 },
        { id: 'kr-fit-2', title: '卧推达到 60kg', target: 60, current: 40, unit: 'kg', weight: 30 },
        { id: 'kr-fit-3', title: '跑量累计 100km', target: 100, current: 23, unit: 'km', weight: 20 },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'goal-eng',
      name: '英语学习',
      groupId: 'g-growth',
      color: '#2F80ED',
      emoji: '📖',
      motivation: 4,
      feasibility: 4,
      startDate: key(-14),
      endDate: key(76),
      useWeight: false,
      keyResults: [
        { id: 'kr-eng-1', title: '背完 2000 个单词', target: 2000, current: 500, unit: '个', weight: 0 },
        { id: 'kr-eng-2', title: '完成 60 次听力训练', target: 60, current: 12, unit: '次', weight: 0 },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  const tasks: Task[] = [
    {
      id: 'task-fit',
      title: '健身',
      color: '#FF7A45',
      emoji: '🏋️',
      goalId: 'goal-fit',
      krId: 'kr-fit-1',
      increment: 1,
      repeat: 'weekly',
      weekDays: [4],
      time: '20:08',
      subTasks: ['健臂', '胸肌', '腹肌'],
      totalCount: 32,
      doneCount: 2,
      startDate: key(-21),
      endDate: key(70),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-listen',
      title: '英语听力',
      color: '#2F80ED',
      emoji: '🎧',
      goalId: 'goal-eng',
      krId: 'kr-eng-2',
      increment: 1,
      repeat: 'daily',
      weekDays: [],
      time: '07:30',
      subTasks: [],
      totalCount: 60,
      doneCount: 12,
      startDate: key(-14),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-words',
      title: '背单词',
      color: '#AF52DE',
      emoji: '📝',
      goalId: 'goal-eng',
      krId: 'kr-eng-1',
      increment: 25,
      repeat: 'daily',
      weekDays: [],
      subTasks: [],
      totalCount: 90,
      doneCount: 20,
      startDate: key(-20),
      createdAt: new Date().toISOString(),
    },
  ];

  // 历史打卡：健身最近两个周四已完成；听力近 6 天连续完成，7 天前漏掉 1 天 -> 超期提醒
  const checkIns: CheckIn[] = [];
  const push = (taskId: string, dateKey: string) =>
    checkIns.push({ id: `ci-${taskId}-${dateKey}`, taskId, date: dateKey, createdAt: `${dateKey}T12:00:00.000Z` });

  push('task-fit', key(-7));
  push('task-fit', key(-14));
  [-1, -2, -3, -4, -5, -6].forEach((o) => push('task-listen', key(o)));
  [-1, -2, -3, -4, -5, -6, -7, -8, -9].forEach((o) => push('task-words', key(o)));

  return { groups, goals, tasks, checkIns };
}
