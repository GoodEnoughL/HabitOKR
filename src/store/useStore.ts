import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed } from '../data/seed';
import { CheckIn, Goal, GoalGroup, ID, Task } from '../types';
import { genId } from '../utils/task';

interface StoreState {
  groups: GoalGroup[];
  goals: Goal[];
  tasks: Task[];
  checkIns: CheckIn[];

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => string;
  updateGoal: (id: ID, patch: Partial<Goal>) => void;
  removeGoal: (id: ID) => void;
  addGroup: (name: string, color: string) => string;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'doneCount'>) => string;
  updateTask: (id: ID, patch: Partial<Task>) => void;
  removeTask: (id: ID) => void;

  /** 打卡 / 取消打卡，并同步关键结果进度 */
  toggleCheckIn: (taskId: ID, date: string) => void;

  resetToSeed: () => void;
  clearAll: () => void;
}

const applyCheckInDelta = (
  goals: Goal[],
  tasks: Task[],
  taskId: ID,
  delta: 1 | -1
): { goals: Goal[]; tasks: Task[] } => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { goals, tasks };
  const nextTasks = tasks.map((t) =>
    t.id === taskId ? { ...t, doneCount: Math.max(0, t.doneCount + delta) } : t
  );
  let nextGoals = goals;
  if (task.goalId && task.krId) {
    nextGoals = goals.map((g) =>
      g.id === task.goalId
        ? {
            ...g,
            keyResults: g.keyResults.map((k) =>
              k.id === task.krId
                ? { ...k, current: Math.max(0, k.current + delta * task.increment) }
                : k
            ),
          }
        : g
    );
  }
  return { goals: nextGoals, tasks: nextTasks };
};

const seed = buildSeed();

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      groups: seed.groups,
      goals: seed.goals,
      tasks: seed.tasks,
      checkIns: seed.checkIns,

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
      addGroup: (name, color) => {
        const id = genId();
        set((s) => ({ groups: [...s.groups, { id, name, color }] }));
        return id;
      },

      addTask: (task) => {
        const id = genId();
        set((s) => ({ tasks: [...s.tasks, { ...task, id, doneCount: 0, createdAt: new Date().toISOString() }] }));
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
        const existing = checkIns.find((c) => c.taskId === taskId && c.date === date);
        if (existing) {
          const next = applyCheckInDelta(goals, tasks, taskId, -1);
          set({
            checkIns: checkIns.filter((c) => c.id !== existing.id),
            goals: next.goals,
            tasks: next.tasks,
          });
        } else {
          const next = applyCheckInDelta(goals, tasks, taskId, 1);
          set({
            checkIns: [
              ...checkIns,
              { id: genId(), taskId, date, createdAt: new Date().toISOString() },
            ],
            goals: next.goals,
            tasks: next.tasks,
          });
        }
      },

      resetToSeed: () => set(buildSeed()),
      clearAll: () => set({ groups: [], goals: [], tasks: [], checkIns: [] }),
    }),
    {
      name: 'habitokr-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
