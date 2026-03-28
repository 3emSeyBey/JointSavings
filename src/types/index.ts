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

export interface SavingsTarget {
  id: string;
  targetAmount: number; // Target per person per cutoff
  isActive: boolean;
  cutoffDays: number[]; // e.g., [15, 0] where 0 means last day of month
  createdAt: string;
}

export interface CutoffPeriod {
  id: string;
  startDate: string;
  endDate: string;
  targetAmount: number;
  /** Per profile/member id (A-002) */
  contributions: Record<string, number>;
  owedAmounts: Record<string, number>;
  isComplete: boolean;
  createdAt: string;
}

export type ViewType = 'login' | 'dashboard';
export type TabType = 'overview' | 'analytics' | 'goals' | 'targets' | 'games' | 'settings';

export type HouseholdRole = 'owner' | 'member' | 'viewer';

