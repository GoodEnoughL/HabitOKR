import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed } from '../data/seed';
import type { Category, CheckIn, Goal, ID, Task } from '../types';
import { parseBackupJSON } from '../utils/backup';
import { normalizePersisted } from '../utils/normalize';
import { genId } from '../utils/task';

interface StoreState {
  categories: Category[];
  goals: Goal[];
  tasks: Task[];
  checkIns: CheckIn[];

  addCategory: (name: string, color: string) => string;
  updateCategory: (id: ID, patch: Partial<Category>) => void;
  removeCategory: (id: ID) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => string;
  updateGoal: (id: ID, patch: Partial<Goal>) => void;
  removeGoal: (id: ID) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => string;
  updateTask: (id: ID, patch: Partial<Task>) => void;
  removeTask: (id: ID) => void;

  /** 打卡 / 取消打卡，并同步关键结果进度 */
  toggleCheckIn: (taskId: ID, date: string) => void;

  /** 暂停 / 恢复打卡 */
  togglePause: (taskId: ID) => void;

  resetToSeed: () => void;
  clearAll: () => void;

  /** 从备份文本导入并覆盖全部数据；解析失败返回 false */
  importData: (text: string) => boolean;
}

/**
 * 按打卡份数增减关联关键结果的进度。
 * deltaCount：正数为新增打卡份数，负数为撤销的打卡份数（撤销可一次多份）。
 */
const applyCheckInDelta = (
  goals: Goal[],
  tasks: Task[],
  taskId: ID,
  deltaCount: number
): Goal[] => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !task.goalId || !task.krId) return goals;
  return goals.map((g) =>
    g.id === task.goalId
      ? {
          ...g,
          keyResults: g.keyResults.map((k) =>
            k.id === task.krId
              ? { ...k, current: Math.max(0, k.current + deltaCount * task.increment) }
              : k
          ),
        }
      : g
  );
};

const seed = buildSeed();

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      categories: seed.categories,
      goals: seed.goals,
      tasks: seed.tasks,
      checkIns: seed.checkIns,

      addCategory: (name, color) => {
        const id = genId();
        set((s) => ({ categories: [...s.categories, { id, name, color }] }));
        return id;
      },
      updateCategory: (id, patch) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          goals: s.goals.map((g) => (g.categoryId === id ? { ...g, categoryId: undefined } : g)),
        })),

      addGoal: (goal) => {
        const id = genId();
        set((s) => ({ goals: [...s.goals, { ...goal, id, createdAt: new Date().toISOString() }] }));
        return id;
      },
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      removeGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          // 解除任务关联，不删除任务本身
          tasks: s.tasks.map((t) => (t.goalId === id ? { ...t, goalId: undefined, krId: undefined } : t)),
        })),

      addTask: (task) => {
        const id = genId();
        set((s) => ({ tasks: [...s.tasks, { ...task, id, createdAt: new Date().toISOString() }] }));
        return id;
      },
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          checkIns: s.checkIns.filter((c) => c.taskId !== id),
        })),

      toggleCheckIn: (taskId, date) => {
        const { checkIns, goals, tasks } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.paused) return; // 暂停中不允许打卡
        const target = Math.max(1, task.dailyTarget);
        const todays = checkIns.filter((c) => c.taskId === taskId && c.date === date);
        if (todays.length < target) {
          // 未达当日目标：追加一次打卡
          set({
            checkIns: [...checkIns, { id: genId(), taskId, date, createdAt: new Date().toISOString() }],
            goals: applyCheckInDelta(goals, tasks, taskId, 1),
          });
        } else {
          // 已打满当日目标：再次点击把当天次数重置为 0（清除全部打卡并回退进度）
          const ids = new Set(todays.map((c) => c.id));
          set({
            checkIns: checkIns.filter((c) => !ids.has(c.id)),
            goals: applyCheckInDelta(goals, tasks, taskId, -todays.length),
          });
        }
      },

      togglePause: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, paused: !t.paused } : t)),
        })),

      resetToSeed: () => set(buildSeed()),
      clearAll: () => set({ categories: [], goals: [], tasks: [], checkIns: [] }),

      importData: (text) => {
        const data = parseBackupJSON(text);
        if (!data) return false;
        set(data);
        return true;
      },
    }),
    {
      name: 'habitokr-store-v2',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any) => {
        // 兼容不同 zustand 版本的载荷形态：{ state } 或直接是 state
        const state = persisted?.state ?? persisted;
        return normalizePersisted(state);
      },
    }
  )
);
