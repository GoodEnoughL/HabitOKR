export type ID = string;

/** 目标分类，如 生活 / 学习 / 工作 / 健康 */
export interface Category {
  id: ID;
  name: string;
  /** 取自 goalColorPalette */
  color: string;
}

/** 关键结果 / 里程碑（可衡量） */
export interface KeyResult {
  id: ID;
  title: string;
  target: number;
  current: number;
  unit: string;
  /** 权重 0-100，仅在目标开启权重时生效 */
  weight: number;
}

/** 目标在「目标库」中的状态，由日期与进度推导 */
export type GoalStatus = 'unplanned' | 'not_started' | 'in_progress' | 'ended';

/** OKR 目标 */
export interface Goal {
  id: ID;
  name: string;
  categoryId?: ID;
  /** 取自 goalColorPalette，图片 2 名称右侧的圆点 / 进度条颜色 */
  color: string;
  /** 动机：执行目标的动力（图片 5） */
  motivations: string[];
  /** 可行性：实现目标的基础（图片 5） */
  feasibilities: string[];
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  useWeight: boolean;
  keyResults: KeyResult[];
  createdAt: string;
}

/** 习惯类型（图片：选择一个习惯类型） */
export type HabitType = 'strength' | 'wisdom' | 'agility';

/** 打卡频率（图片：打卡频率） */
export type FrequencyType = 'daily' | 'weekly' | 'daysPerWeek' | 'daysPerMonth' | 'everyXDays';

/** 通关条件模式（图片 2/3）：永久 / 按时间跨度 / 按总打卡次数 */
export type CompletionMode = 'forever' | 'timeSpan' | 'totalCount';

/** 习惯难度（图片：选择习惯难度） */
export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * 习惯（原「任务」）：所有任务本质上都是需要坚持的习惯。
 * 打卡可推进关联关键结果（OKR 闭环）。
 */
export interface Task {
  id: ID;
  title: string; // 描述一下你的习惯
  emoji: string;
  color: string;
  /** 为什么要做这件事（图片：为什么要做这件事？） */
  why: string;
  habitType: HabitType;
  frequency: FrequencyType;
  /** weekly=周几(1-7 周一~周日)；daysPerWeek/daysPerMonth/everyXDays=数量；daily 不用 */
  frequencyValue: number;
  /** 开始日期 YYYY-MM-DD */
  startDate: string;
  completionMode: CompletionMode;
  /** timeSpan=天数；totalCount=总打卡次数；forever 不用 */
  completionValue: number;
  /** 每日需要打卡（图片 4：1下 / 2下 …） */
  dailyTarget: number;
  difficulty: Difficulty;
  reminderEnabled: boolean;
  /** 提醒时间 HH:mm */
  reminderTime?: string;
  /** 关联的目标与关键结果（可选，打卡推进 KR） */
  goalId?: ID;
  krId?: ID;
  /** 每次打卡为关键结果增加的数值 */
  increment: number;
  /** 暂停打卡：暂停后不计入当日完成，列表灰化并标记「无需打卡」 */
  paused?: boolean;
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
