import { describe, it, expect } from 'vitest';
import { buildMemberTotals } from './transactionTotals';
import type { Transaction } from '@/types';

describe('buildMemberTotals', () => {
  it('nets savings and pea spend', () => {
    const txs: Transaction[] = [
      {
        id: '1',
        userId: 'pea',
        amount: 100,
        date: '2026-01-01',
        period: '',
        note: '',
        category: 'general',
        entryKind: 'saving',
        createdAt: '',
      },
      {
        id: '2',
        userId: 'pea',
        amount: -30,
        date: '2026-01-02',
        period: '',
        note: '',
        category: 'spend',
        entryKind: 'spend',
        spendSource: 'pea',
        createdAt: '',
      },
    ];
    const t = buildMemberTotals(txs, ['pea', 'cam']);
    expect(t.pea).toBe(70);
    expect(t.cam).toBe(0);
  });

  it('splits joint spend', () => {
    const txs: Transaction[] = [
      {
        id: '1',
        userId: 'pea',
        amount: -20,
        date: '2026-01-01',
        period: '',
        note: '',
        category: 'spend',
        entryKind: 'spend',
        spendSource: 'joint',
        createdAt: '',
      },
    ];
    const t = buildMemberTotals(txs, ['pea', 'cam']);
    expect(t.pea).toBe(-10);
    expect(t.cam).toBe(-10);
  });
});
