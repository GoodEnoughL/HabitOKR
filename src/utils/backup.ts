import type { Category, CheckIn, Goal, Task } from '../types';
import { normalizePersisted } from './normalize';

export const BACKUP_APP = 'HabitOKR';
export const BACKUP_VERSION = 1;

export interface BackupEnvelope {
  app: string;
  version: number;
  exportedAt: string;
  data: {
    categories: Category[];
    goals: Goal[];
    tasks: Task[];
    checkIns: CheckIn[];
  };
}

type BackupData = BackupEnvelope['data'];

/** 把当前 store 状态打包成带版本号的备份 JSON（美化输出，便于人工检视）。 */
export function buildBackupJSON(state: BackupData): string {
  const envelope: BackupEnvelope = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      categories: state.categories,
      goals: state.goals,
      tasks: state.tasks,
      checkIns: state.checkIns,
    },
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * 解析备份文本：
 * - 兼容信封结构 { app, version, data } 与裸 state 两种形态；
 * - 通过 normalizePersisted 兜底校验/补齐字段；
 * - 无法识别时返回 null，调用方据此提示用户。
 */
export function parseBackupJSON(text: string): BackupData | null {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const candidate = parsed?.data ?? parsed;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const hasAny = ['categories', 'goals', 'tasks', 'checkIns'].some((k) => Array.isArray(candidate[k]));
  if (!hasAny) return null;
  try {
    return normalizePersisted(candidate);
  } catch {
    return null;
  }
}

/** 生成备份文件名：habitokr-backup-YYYYMMDD-HHmm.json */
export function backupFileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `habitokr-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}.json`;
}
