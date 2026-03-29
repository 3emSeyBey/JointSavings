/**
 * Central validation for money and transaction payloads (B-002).
 */
import { dueEndDate } from '@/lib/checklistDue';
import { getTodayLocalISO } from '@/lib/utils';
import type { ChecklistItemInput } from '@/types';

export type FieldError = { ok: false; message: string };

const ALLOWED_CATEGORIES = new Set([
  'general',
  'salary',
  'gift',
  'investment',
  'bill',
  'other',
]);

export type TransactionValidationOk = {
  ok: true;
  amount: number;
  dateStr: string;
  note: string;
  category: string;
};

export type TransactionValidation = FieldError | TransactionValidationOk;

const MAX_NOTE_LENGTH = 500;

export function validateTransactionInput(input: {
  amountStr: string;
  dateStr: string;
  note?: string;
  category?: string;
}): TransactionValidation {
  const raw = input.amountStr.trim();
  if (!raw) return { ok: false, message: 'Amount is required' };

  const amount = Number(raw);
  if (!Number.isFinite(amount)) return { ok: false, message: 'Amount must be a number' };
  if (amount <= 0) return { ok: false, message: 'Amount must be greater than zero' };
  if (amount > 1e12) return { ok: false, message: 'Amount is too large' };

  const dateStr = input.dateStr.trim();
  if (!dateStr) return { ok: false, message: 'Date is required' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { ok: false, message: 'Date must be YYYY-MM-DD' };
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return { ok: false, message: 'Invalid calendar date' };
  }

  const note = (input.note ?? '').trim().slice(0, MAX_NOTE_LENGTH);
  const rawCat = (input.category ?? 'general').trim().toLowerCase() || 'general';
  const category = ALLOWED_CATEGORIES.has(rawCat) ? rawCat : 'general';
  return { ok: true, amount, dateStr, note, category };
}

export type PositiveAmountValidation = FieldError | { ok: true; amount: number };

export function validatePositiveAmount(amountStr: string): PositiveAmountValidation {
  const raw = amountStr.trim();
  if (!raw) return { ok: false, message: 'Amount is required' };
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return { ok: false, message: 'Amount must be a number' };
  if (amount <= 0) return { ok: false, message: 'Amount must be greater than zero' };
  if (amount > 1e12) return { ok: false, message: 'Amount is too large' };
  return { ok: true, amount };
}

export type NewGoalValidation = FieldError | { ok: true; title: string; targetAmount: number };

export function validateNewGoalInput(title: string, targetAmountStr: string): NewGoalValidation {
  const t = title.trim();
  if (!t) return { ok: false, message: 'Goal title is required' };
  const raw = targetAmountStr.trim();
  if (!raw) return { ok: false, message: 'Target amount is required' };
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Target must be a positive number' };
  }
  if (amount > 1e12) return { ok: false, message: 'Target is too large' };
  return { ok: true, title: t, targetAmount: amount };
}

const MAX_CHECKLIST_TITLE = 200;
const MAX_CHECKLIST_HTML = 80_000;
const MAX_CHECKLIST_CONSEQUENCE = 2000;

const MIN_PROMISE_LEN = 12;
const MAX_PROMISE_LEN = 2000;

export function validatePartnerPromiseText(raw: string): FieldError | { ok: true; text: string } {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (text.length < MIN_PROMISE_LEN) {
    return {
      ok: false,
      message: `Say it in at least ${MIN_PROMISE_LEN} characters — this deserves a real moment.`,
    };
  }
  if (text.length > MAX_PROMISE_LEN) {
    return { ok: false, message: 'That’s longer than we can store — try tightening the heart of it.' };
  }
  return { ok: true, text };
}

export function validateChecklistItemInput(input: ChecklistItemInput): FieldError | { ok: true } {
  const title = input.title.trim();
  if (!title) return { ok: false, message: 'Give this intention a short title' };
  if (title.length > MAX_CHECKLIST_TITLE) return { ok: false, message: 'Title is too long' };
  if (input.descriptionHtml.length > MAX_CHECKLIST_HTML) {
    return { ok: false, message: 'Description is too long' };
  }
  const c = (input.consequence ?? '').trim();
  if (c.length > MAX_CHECKLIST_CONSEQUENCE) return { ok: false, message: 'Consequence note is too long' };
  if (input.dueKind !== 'none') {
    if (!input.dueValue?.trim()) return { ok: false, message: 'Choose a due date for this type' };
    const end = dueEndDate(input.dueKind, input.dueValue.trim());
    if (!end) return { ok: false, message: 'That due date is not valid' };
  }
  return { ok: true };
}

export { getTodayLocalISO };
