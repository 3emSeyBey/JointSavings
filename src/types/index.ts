export interface Theme {
  color: string;
  bgClass: string;
  textClass: string;
  lightBg: string;
  border: string;
}

/** Where a withdrawal is drawn from (profile pools or shared). */
export type SpendSource = 'pea' | 'cam' | 'joint';

export type TransactionEntryKind = 'saving' | 'spend';

export interface Profile {
  id: string;
  name: string;
  theme: keyof typeof import('@/lib/constants').THEMES;
  emoji: string;
  /** Legacy plaintext PIN (prefer server pinHash via Cloud Functions) */
  pin: string | null;
  pinHash?: string | null;
  pinSalt?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  /** Stored in Firestore as integer minor units (B-004); optional on legacy reads */
  amountCents?: number;
  date: string;
  period: string;
  note: string;
  /** Spending/savings category (C-001) */
  category?: string;
  /** Saving (deposit) vs spend (withdrawal); default saving for legacy docs */
  entryKind?: TransactionEntryKind;
  /** For spends: which pool was debited */
  spendSource?: SpendSource;
  createdAt: string;
  /** Soft delete (B-009) */
  deletedAt?: string | null;
}

export interface NewTransaction {
  amount: string;
  date: string;
  note: string;
  goalId?: string;
  category?: string;
  entryKind?: TransactionEntryKind;
  spendSource?: SpendSource;
  /** Idempotency / dedupe hint (B-006) */
  clientRequestId?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetAmountCents?: number;
  currentAmountCents?: number;
  deadline: string;
  emoji: string;
  createdAt: string;
  createdBy: string;
}

export interface NewGoal {
  title: string;
  targetAmount: string;
  deadline: string;
  emoji: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/** Shared checklist: task, purchase, or life intention (us or relationship). */
export type ChecklistItemKind = 'task' | 'purchase' | 'life_us' | 'life_relationship';

export type ChecklistDueKind = 'none' | 'day' | 'week' | 'month';

export type ChecklistHorizon = 'short' | 'long';

export interface ChecklistItem {
  id: string;
  title: string;
  /** Sanitized HTML from rich text editor */
  descriptionHtml: string;
  kind: ChecklistItemKind;
  dueKind: ChecklistDueKind;
  /** `YYYY-MM-DD` | `YYYY-Www` (week input) | `YYYY-MM` | null */
  dueValue: string | null;
  horizon: ChecklistHorizon;
  consequence: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface ChecklistItemInput {
  title: string;
  descriptionHtml: string;
  kind: ChecklistItemKind;
  dueKind: ChecklistDueKind;
  dueValue: string | null;
  horizon: ChecklistHorizon;
  consequence: string | null;
}

/**
 * One solemn commitment per partner (Together tab). Doc id = profileId (e.g. pea, cam).
 */
export interface PartnerPromise {
  profileId: string;
  text: string;
  declaredAt: string;
  updatedAt: string;
  /** Times the text was changed after the first declaration */
  revisedCount: number;
}

export type ViewType = 'login' | 'dashboard';
export type TabType =
  | 'overview'
  | 'analytics'
  | 'goals'
  | 'checklist'
  | 'games'
  | 'settings';

export type HouseholdRole = 'owner' | 'member' | 'viewer';

