import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { householdDataCollection, householdDataDoc } from '@/lib/firestorePaths';
import type { SavingsTarget, CutoffPeriod, Transaction } from '@/types';
import { getTodayLocalISO } from '@/lib/utils';
import { buildMemberTotals } from '@/lib/transactionTotals';

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getCurrentCutoffPeriod(cutoffDays: number[] = [15, 0]): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const lastDay = getLastDayOfMonth(year, month);

  const sortedDays = cutoffDays
    .map((d) => (d === 0 ? lastDay : d))
    .sort((a, b) => a - b);

  let startDate: Date;
  let endDate: Date;

  if (day <= sortedDays[0]) {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month, sortedDays[0]);
  } else if (sortedDays.length > 1 && day <= sortedDays[1]) {
    startDate = new Date(year, month, sortedDays[0] + 1);
    endDate = new Date(year, month, sortedDays[1]);
  } else {
    startDate = new Date(year, month, sortedDays[sortedDays.length - 1] + 1);
    endDate = new Date(
      year,
      month + 1,
      sortedDays[0] === lastDay ? getLastDayOfMonth(year, month + 1) : sortedDays[0]
    );
  }

  return { start: startDate, end: endDate };
}

function formatPeriodId(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalizeCutoffPeriod(id: string, data: Record<string, unknown>): CutoffPeriod {
  const rawC = data.contributions as Record<string, number> | undefined;
  const rawO = data.owedAmounts as Record<string, number> | undefined;
  const contributions: Record<string, number> = { ...rawC };
  const owedAmounts: Record<string, number> = { ...rawO };
  if (!rawC && data.contributions && typeof data.contributions === 'object') {
    const legacy = data.contributions as { pea?: number; cam?: number };
    if (legacy.pea != null) contributions.pea = legacy.pea;
    if (legacy.cam != null) contributions.cam = legacy.cam;
  }
  if (!rawO && data.owedAmounts && typeof data.owedAmounts === 'object') {
    const legacy = data.owedAmounts as { pea?: number; cam?: number };
    if (legacy.pea != null) owedAmounts.pea = legacy.pea;
    if (legacy.cam != null) owedAmounts.cam = legacy.cam;
  }
  return {
    id,
    startDate: String(data.startDate),
    endDate: String(data.endDate),
    targetAmount: Number(data.targetAmount),
    contributions,
    owedAmounts,
    isComplete: Boolean(data.isComplete),
    createdAt: String(data.createdAt ?? ''),
  };
}

export interface CurrentPeriodStats {
  startDate: string;
  endDate: string;
  contributions: Record<string, number>;
  targetAmount: number;
  daysRemaining: number;
  totalDays: number;
  progress: Record<string, number>;
  remaining: Record<string, number>;
  isUrgent: boolean;
  isOverdue: boolean;
}

export function useSavingsTarget(
  enabled: boolean,
  transactions: Transaction[],
  memberProfileIds: string[]
) {
  const [target, setTarget] = useState<SavingsTarget | null>(null);
  const [cutoffPeriods, setCutoffPeriods] = useState<CutoffPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !db) return;

    const targetRef = householdDataDoc(db, 'savingsTarget', 'current');

    const unsubscribe = onSnapshot(targetRef, (snapshot) => {
      if (snapshot.exists()) {
        setTarget(snapshot.data() as SavingsTarget);
      } else {
        setTarget(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !db) return;

    const periodsRef = householdDataCollection(db, 'cutoffPeriods');
    const periodsQuery = query(periodsRef, orderBy('endDate', 'desc'));

    const unsubscribe = onSnapshot(periodsQuery, (snapshot) => {
      const periods = snapshot.docs.map((d) =>
        normalizeCutoffPeriod(d.id, d.data() as Record<string, unknown>)
      );
      setCutoffPeriods(periods);
    });

    return () => unsubscribe();
  }, [enabled]);

  const currentPeriodStats = useMemo((): CurrentPeriodStats | null => {
    if (!target?.isActive) return null;

    const { start, end } = getCurrentCutoffPeriod(target.cutoffDays);
    const startStr = getTodayLocalISO(start);
    const endStr = getTodayLocalISO(end);

    const periodTransactions = transactions.filter((tx) => tx.date >= startStr && tx.date <= endStr);

    const contributions = buildMemberTotals(periodTransactions, memberProfileIds);

    const progress: Record<string, number> = {};
    const remaining: Record<string, number> = {};
    for (const uid of memberProfileIds) {
      const c = contributions[uid] ?? 0;
      progress[uid] = Math.min(100, (c / target.targetAmount) * 100);
      remaining[uid] = Math.max(0, target.targetAmount - c);
    }

    const daysRemaining = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      startDate: startStr,
      endDate: endStr,
      contributions,
      targetAmount: target.targetAmount,
      daysRemaining: Math.max(0, daysRemaining),
      totalDays,
      progress,
      remaining,
      isUrgent: daysRemaining <= 3 && daysRemaining > 0,
      isOverdue: daysRemaining <= 0,
    };
  }, [target, transactions, memberProfileIds]);

  const totalOwed = useMemo(() => {
    const owed: Record<string, number> = {};
    cutoffPeriods.forEach((period) => {
      if (period.owedAmounts) {
        Object.entries(period.owedAmounts).forEach(([k, v]) => {
          owed[k] = (owed[k] || 0) + (v || 0);
        });
      }
    });
    return owed;
  }, [cutoffPeriods]);

  const setTargetSettings = async (targetAmount: number, cutoffDays: number[] = [15, 0]) => {
    if (!db) return;
    const targetRef = householdDataDoc(db, 'savingsTarget', 'current');
    await setDoc(targetRef, {
      id: 'current',
      targetAmount,
      cutoffDays,
      isActive: true,
      createdAt: target?.createdAt || new Date().toISOString(),
    });
  };

  const toggleTarget = async (isActive: boolean) => {
    if (!target || !db) return;
    const targetRef = householdDataDoc(db, 'savingsTarget', 'current');
    await setDoc(targetRef, { ...target, isActive }, { merge: true });
  };

  const closePeriod = async () => {
    if (!target?.isActive || !currentPeriodStats || !db) return;

    const periodId = formatPeriodId(new Date(currentPeriodStats.endDate));
    const periodRef = householdDataDoc(db, 'cutoffPeriods', periodId);

    const owedAmounts: Record<string, number> = { ...currentPeriodStats.remaining };

    await setDoc(periodRef, {
      id: periodId,
      startDate: currentPeriodStats.startDate,
      endDate: currentPeriodStats.endDate,
      targetAmount: target.targetAmount,
      contributions: currentPeriodStats.contributions,
      owedAmounts,
      isComplete: true,
      createdAt: new Date().toISOString(),
    });
  };

  const payOwed = async (periodId: string, userId: string, amount: number) => {
    if (!db) return;
    const period = cutoffPeriods.find((p) => p.id === periodId);
    if (!period) return;

    const periodRef = householdDataDoc(db, 'cutoffPeriods', periodId);
    const newOwed = Math.max(0, (period.owedAmounts?.[userId] || 0) - amount);

    await setDoc(
      periodRef,
      {
        ...period,
        owedAmounts: {
          ...period.owedAmounts,
          [userId]: newOwed,
        },
      },
      { merge: true }
    );
  };

  /** Mark a closed period as open again for corrections (B-010). */
  const reopenPeriod = async (periodId: string) => {
    if (!db) return;
    const periodRef = householdDataDoc(db, 'cutoffPeriods', periodId);
    await setDoc(periodRef, { isComplete: false }, { merge: true });
  };

  return {
    target,
    cutoffPeriods,
    currentPeriodStats,
    totalOwed,
    loading,
    setTargetSettings,
    toggleTarget,
    closePeriod,
    payOwed,
    reopenPeriod,
  };
}
