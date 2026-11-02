export const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Date -> 'YYYY-MM-DD'（本地时区） */
export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isToday(key: string): boolean {
  return key === todayKey();
}

export function isFuture(key: string): boolean {
  return key > todayKey();
}

/** 周一为一周开始，返回 1-7 */
export function weekDayIndex(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

/** 以 anchor 所在周（周一开始）返回 7 天 */
export function getWeekDates(anchor: Date): Date[] {
  const idx = weekDayIndex(anchor);
  const monday = addDays(anchor, -(idx - 1));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatCN(key: string): string {
  const d = parseKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function weekdayCN(key: string): string {
  return WEEKDAY_NAMES[weekDayIndex(parseKey(key)) - 1];
}

/** 构建月视图矩阵，每行一周（周一开始），空白为 null */
export function getMonthMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = weekDayIndex(first) - 1;
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toKey(new Date(year, month, i + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function monthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
