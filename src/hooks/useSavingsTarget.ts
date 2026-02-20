import { useState, useEffect, useMemo } from 'react';
import { 
  collection,
  doc,
  onSnapshot,
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, APP_ID } from '@/config/firebase';
import type { SavingsTarget, CutoffPeriod, Transaction } from '@/types';

// Helper to get last day of month
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get current cutoff period dates
export function getCurrentCutoffPeriod(cutoffDays: number[] = [15, 0]): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const lastDay = getLastDayOfMonth(year, month);
  
  // Sort cutoff days, replacing 0 with actual last day
  const sortedDays = cutoffDays
    .map(d => d === 0 ? lastDay : d)
    .sort((a, b) => a - b);
  
  let startDate: Date;
  let endDate: Date;
  
  if (day <= sortedDays[0]) {
    // We're in the first period (1st to first cutoff)
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month, sortedDays[0]);
  } else if (sortedDays.length > 1 && day <= sortedDays[1]) {
    // We're in the second period
    startDate = new Date(year, month, sortedDays[0] + 1);
    endDate = new Date(year, month, sortedDays[1]);
  } else {
    // We're after all cutoffs, so next period starts
    startDate = new Date(year, month, sortedDays[sortedDays.length - 1] + 1);
    endDate = new Date(year, month + 1, sortedDays[0] === lastDay ? getLastDayOfMonth(year, month + 1) : sortedDays[0]);
  }
  
  return { start: startDate, end: endDate };
}

// Helper to format period ID
function formatPeriodId(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function useSavingsTarget(isAuthenticated: boolean, transactions: Transaction[]) {
  const [target, setTarget] = useState<SavingsTarget | null>(null);
  const [cutoffPeriods, setCutoffPeriods] = useState<CutoffPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to target settings
  useEffect(() => {
    if (!isAuthenticated) return;

    const targetRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'savingsTarget', 'current');
    
    const unsubscribe = onSnapshot(targetRef, (snapshot) => {
      if (snapshot.exists()) {
        setTarget(snapshot.data() as SavingsTarget);
      } else {
        setTarget(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Listen to cutoff periods
  useEffect(() => {
    if (!isAuthenticated) return;

    const periodsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'cutoffPeriods');
    const periodsQuery = query(periodsRef, orderBy('endDate', 'desc'));
    
    const unsubscribe = onSnapshot(periodsQuery, (snapshot) => {
      const periods = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as CutoffPeriod[];
      setCutoffPeriods(periods);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Calculate current period contributions from transactions
  const currentPeriodStats = useMemo(() => {
    if (!target?.isActive) return null;
    
    const { start, end } = getCurrentCutoffPeriod(target.cutoffDays);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    const periodTransactions = transactions.filter(tx => {
      return tx.date >= startStr && tx.date <= endStr;
    });
    
    const contributions = {
      pea: periodTransactions.filter(tx => tx.userId === 'pea').reduce((sum, tx) => sum + tx.amount, 0),
      cam: periodTransactions.filter(tx => tx.userId === 'cam').reduce((sum, tx) => sum + tx.amount, 0),
    };
    
    const daysRemaining = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      startDate: startStr,
      endDate: endStr,
      contributions,
      targetAmount: target.targetAmount,
      daysRemaining: Math.max(0, daysRemaining),
      totalDays,
      progress: {
        pea: Math.min(100, (contributions.pea / target.targetAmount) * 100),
        cam: Math.min(100, (contributions.cam / target.targetAmount) * 100),
      },
      remaining: {
        pea: Math.max(0, target.targetAmount - contributions.pea),
        cam: Math.max(0, target.targetAmount - contributions.cam),
      },
      isUrgent: daysRemaining <= 3 && daysRemaining > 0,
      isOverdue: daysRemaining <= 0,
    };
  }, [target, transactions]);

  // Calculate total owed amounts from past periods
  const totalOwed = useMemo(() => {
    const owed = { pea: 0, cam: 0 };
    cutoffPeriods.forEach(period => {
      if (period.owedAmounts) {
        owed.pea += period.owedAmounts.pea || 0;
        owed.cam += period.owedAmounts.cam || 0;
      }
    });
    return owed;
  }, [cutoffPeriods]);

  // Set or update target
  const setTargetSettings = async (targetAmount: number, cutoffDays: number[] = [15, 0]) => {
    const targetRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'savingsTarget', 'current');
    await setDoc(targetRef, {
      id: 'current',
      targetAmount,
      cutoffDays,
      isActive: true,
      createdAt: target?.createdAt || new Date().toISOString(),
    });
  };

  // Toggle target active state
  const toggleTarget = async (isActive: boolean) => {
    if (!target) return;
    const targetRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'savingsTarget', 'current');
    await setDoc(targetRef, { ...target, isActive }, { merge: true });
  };

  // Close current period and record owed amounts
  const closePeriod = async () => {
    if (!target?.isActive || !currentPeriodStats) return;
    
    const periodId = formatPeriodId(new Date(currentPeriodStats.endDate));
    const periodRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'cutoffPeriods', periodId);
    
    const owedAmounts = {
      pea: currentPeriodStats.remaining.pea,
      cam: currentPeriodStats.remaining.cam,
    };
    
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

  // Pay off owed amount
  const payOwed = async (periodId: string, userId: 'pea' | 'cam', amount: number) => {
    const period = cutoffPeriods.find(p => p.id === periodId);
    if (!period) return;
    
    const periodRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'cutoffPeriods', periodId);
    const newOwed = Math.max(0, (period.owedAmounts?.[userId] || 0) - amount);
    
    await setDoc(periodRef, {
      ...period,
      owedAmounts: {
        ...period.owedAmounts,
        [userId]: newOwed,
      },
    }, { merge: true });
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
  };
}

