export interface Theme {
  color: string;
  bgClass: string;
  textClass: string;
  lightBg: string;
  border: string;
}

export interface Profile {
  id: string;
  name: string;
  theme: keyof typeof import('@/lib/constants').THEMES;
  emoji: string;
  pin: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  date: string;
  period: string;
  note: string;
  createdAt: string;
}

export interface NewTransaction {
  amount: string;
  date: string;
  note: string;
  goalId?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
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
  contributions: {
    pea: number;
    cam: number;
  };
  owedAmounts: {
    pea: number;
    cam: number;
  };
  isComplete: boolean;
  createdAt: string;
}

export type ViewType = 'login' | 'dashboard';
export type TabType = 'overview' | 'analytics' | 'goals' | 'targets' | 'settings';

