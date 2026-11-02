export type ID = string;

/** 目标组 */
export interface GoalGroup {
  id: ID;
  name: string;
  color: string;
}

/** 关键结果 (Key Result) */
export interface KeyResult {
  id: ID;
  title: string;
  target: number;
  current: number;
  unit: string;
  /** 权重占比 0-100，仅在目标开启权重时生效 */
  weight: number;
}

/** OKR 目标 */
export interface Goal {
  id: ID;
  name: string;
  groupId?: ID;
  color: string;
  emoji: string;
  /** 动机评分 0-5 */
  motivation: number;
  /** 可行性评分 0-5 */
  feasibility: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  useWeight: boolean;
  keyResults: KeyResult[];
  createdAt: string;
}

export type RepeatType = 'daily' | 'weekly';

/** 习惯 / 任务 */
export interface Task {
  id: ID;
  title: string;
  color: string;
  emoji: string;
  /** 关联的目标与关键结果 */
  goalId?: ID;
  krId?: ID;
  /** 每次打卡为关键结果增加的数值 */
  increment: number;
  repeat: RepeatType;
  /** weekly 时生效，1-7 表示周一到周日 */
  weekDays: number[];
  /** 提醒时间 HH:mm */
  time?: string;
  subTasks: string[];
  /** 计划总次数，如 32 次 */
  totalCount: number;
  /** 已完成次数 */
  doneCount: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

/** 打卡记录 */
export interface CheckIn {
  id: ID;
  taskId: ID;
  date: string; // YYYY-MM-DD
  createdAt: string;
  note?: string;
}
