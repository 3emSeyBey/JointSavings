import { describe, it, expect } from 'vitest';
import { projectBalanceLinear } from './forecast';

describe('projectBalanceLinear', () => {
  it('adds average times months', () => {
    expect(projectBalanceLinear(1000, 200, 3)).toBe(1600);
  });

  it('returns current when monthsAhead <= 0', () => {
    expect(projectBalanceLinear(500, 100, 0)).toBe(500);
    expect(projectBalanceLinear(500, 100, -1)).toBe(500);
  });
});
