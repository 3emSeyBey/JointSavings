import { describe, it, expect } from 'vitest';
import { validateTransactionInput } from './validation';

describe('validateTransactionInput', () => {
  it('normalizes category', () => {
    const r = validateTransactionInput({
      amountStr: '10',
      dateStr: '2026-03-28',
      note: 'x',
      category: 'salary',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.category).toBe('salary');
  });

  it('falls back to general for unknown category', () => {
    const r = validateTransactionInput({
      amountStr: '10',
      dateStr: '2026-03-28',
      category: 'nope',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.category).toBe('general');
  });
});
