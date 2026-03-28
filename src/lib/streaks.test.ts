import { describe, it, expect } from 'vitest';
import { longestStreakFromSortedDates } from './streaks';

describe('longestStreakFromSortedDates', () => {
  it('returns 0 for empty', () => {
    expect(longestStreakFromSortedDates([])).toBe(0);
  });

  it('counts consecutive days', () => {
    expect(longestStreakFromSortedDates(['2026-01-01', '2026-01-02', '2026-01-03'])).toBe(3);
  });

  it('breaks on gap', () => {
    expect(longestStreakFromSortedDates(['2026-01-01', '2026-01-02', '2026-01-05'])).toBe(2);
  });
});
