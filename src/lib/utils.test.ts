import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCurrency, getAutoPeriod, getTodayISO, getTodayLocalISO, cn } from './utils';

describe('formatCurrency', () => {
  it('formats PHP with no fraction digits', () => {
    expect(formatCurrency(1234)).toMatch(/1[,.]?234/);
    expect(formatCurrency(0)).toBeTruthy();
  });
});

describe('getAutoPeriod', () => {
  it('returns empty for empty string', () => {
    expect(getAutoPeriod('')).toBe('');
  });

  it('uses first half of month for day <= 15', () => {
    const p = getAutoPeriod('2025-03-10');
    expect(p).toContain('1-15');
    expect(p).toContain('2025');
  });

  it('uses second half for day > 15', () => {
    const p = getAutoPeriod('2025-03-20');
    expect(p).toContain('16-End');
  });
});

describe('getTodayLocalISO', () => {
  it('returns YYYY-MM-DD in local calendar', () => {
    const fixed = new Date(2025, 5, 15, 12, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(fixed);
    expect(getTodayLocalISO()).toBe('2025-06-15');
    vi.useRealTimers();
  });
});

describe('getTodayISO', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('delegates to local calendar (B-003)', () => {
    expect(getTodayISO()).toBe('2025-06-15');
  });
});

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', false, 'b', undefined)).toBe('a b');
  });
});
