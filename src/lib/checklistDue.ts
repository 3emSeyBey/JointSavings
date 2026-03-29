import type { ChecklistDueKind, ChecklistItem } from '@/types';

export function endOfDueDay(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d, 23, 59, 59, 999);
  if (dt.getMonth() !== mo - 1) return null;
  return dt;
}

/** `<input type="week">` value e.g. `2026-W13` */
export function endOfDueWeek(weekVal: string): Date | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekVal.trim());
  if (!m) return null;
  const year = +m[1];
  const week = +m[2];
  if (week < 1 || week > 53) return null;
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - (dow - 1));
  const targetMonday = new Date(mondayWeek1);
  targetMonday.setDate(mondayWeek1.getDate() + (week - 1) * 7);
  const sunday = new Date(targetMonday);
  sunday.setDate(targetMonday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export function endOfDueMonth(ym: string): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  if (mo < 1 || mo > 12) return null;
  return new Date(y, mo, 0, 23, 59, 59, 999);
}

export function dueEndDate(dueKind: ChecklistDueKind, dueValue: string | null): Date | null {
  if (dueKind === 'none' || !dueValue) return null;
  if (dueKind === 'day') return endOfDueDay(dueValue);
  if (dueKind === 'week') return endOfDueWeek(dueValue);
  if (dueKind === 'month') return endOfDueMonth(dueValue);
  return null;
}

export function isChecklistOverdue(item: ChecklistItem): boolean {
  if (item.completed) return false;
  const end = dueEndDate(item.dueKind, item.dueValue);
  if (!end) return false;
  return Date.now() > end.getTime();
}

export function formatDueLabel(dueKind: ChecklistDueKind, dueValue: string | null): string {
  if (dueKind === 'none' || !dueValue) return '';
  try {
    if (dueKind === 'day') {
      const [y, mo, d] = dueValue.split('-').map(Number);
      return new Date(y, mo - 1, d).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (dueKind === 'week') {
      const wm = /^(\d{4})-W(\d{2})$/.exec(dueValue);
      if (wm) return `Week ${Number(wm[2])}, ${wm[1]}`;
      return dueValue;
    }
    if (dueKind === 'month') {
      const [y, mo] = dueValue.split('-').map(Number);
      return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
  } catch {
    return dueValue;
  }
  return dueValue;
}

export function sortChecklistItems(a: ChecklistItem, b: ChecklistItem): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const oa = isChecklistOverdue(a);
  const ob = isChecklistOverdue(b);
  if (oa !== ob) return oa ? -1 : 1;
  const ea = dueEndDate(a.dueKind, a.dueValue)?.getTime() ?? Infinity;
  const eb = dueEndDate(b.dueKind, b.dueValue)?.getTime() ?? Infinity;
  if (ea !== eb) return ea - eb;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
