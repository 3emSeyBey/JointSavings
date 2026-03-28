import { useState, useEffect } from 'react';
import {
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { DEFAULT_PROFILES } from '@/lib/constants';
import { householdDataCollection, householdDataDoc } from '@/lib/firestorePaths';
import { appendAuditLog } from '@/lib/auditLog';
import type { Profile, Transaction, NewTransaction, Goal, NewGoal } from '@/types';
import { getAutoPeriod } from '@/lib/utils';
import { validateTransactionInput, validateNewGoalInput, validatePositiveAmount } from '@/lib/validation';

function readMoneyCents(data: Record<string, unknown>, centsKey: string, legacyKey: string): number {
  const c = data[centsKey];
  if (typeof c === 'number' && Number.isFinite(c)) return c;
  const legacy = Number(data[legacyKey]);
  return Math.round(legacy * 100);
}

function normalizeTransaction(id: string, data: Record<string, unknown>): Transaction {
  const amountCents = readMoneyCents(data, 'amountCents', 'amount');
  const amount = amountCents / 100;
  const rawKind = data.entryKind;
  const entryKind = rawKind === 'spend' ? 'spend' : 'saving';
  const ss = data.spendSource;
  const spendSource =
    ss === 'pea' || ss === 'cam' || ss === 'joint' ? ss : undefined;
  return {
    id,
    userId: String(data.userId),
    amount,
    amountCents,
    date: String(data.date),
    period: String(data.period ?? ''),
    note: String(data.note ?? ''),
    category: data.category != null ? String(data.category) : 'general',
    entryKind,
    spendSource: entryKind === 'spend' ? spendSource : undefined,
    createdAt: String(data.createdAt ?? ''),
    deletedAt: data.deletedAt != null ? String(data.deletedAt) : undefined,
  };
}

function normalizeGoal(id: string, data: Record<string, unknown>): Goal {
  const targetCents = readMoneyCents(data, 'targetAmountCents', 'targetAmount');
  const currentCents = readMoneyCents(data, 'currentAmountCents', 'currentAmount');
  return {
    id,
    title: String(data.title),
    targetAmount: targetCents / 100,
    currentAmount: currentCents / 100,
    targetAmountCents: targetCents,
    currentAmountCents: currentCents,
    deadline: String(data.deadline ?? ''),
    emoji: String(data.emoji ?? '🎯'),
    createdAt: String(data.createdAt ?? ''),
    createdBy: String(data.createdBy ?? ''),
  };
}

export function useProfiles(enabled: boolean) {
  const [profiles, setProfiles] = useState<Record<string, Profile>>(DEFAULT_PROFILES);

  useEffect(() => {
    if (!enabled || !db) return;

    const profilesRef = householdDataCollection(db, 'profiles');

    const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
      const loaded: Record<string, Profile> = {};
      snapshot.docs.forEach((d) => {
        loaded[d.id] = d.data() as Profile;
      });

      if (Object.keys(loaded).length === 0) {
        setDoc(doc(profilesRef, 'pea'), DEFAULT_PROFILES.pea);
        setDoc(doc(profilesRef, 'cam'), DEFAULT_PROFILES.cam);
      } else {
        setProfiles((prev) => ({ ...prev, ...loaded }));
      }
    });

    return () => unsubscribe();
  }, [enabled]);

  const updateProfile = async (profileId: string, data: Partial<Profile>) => {
    if (!db) return;
    const profileRef = householdDataDoc(db, 'profiles', profileId);
    await setDoc(profileRef, data, { merge: true });
  };

  return { profiles, updateProfile };
}

export function useTransactions(enabled: boolean, actorUserId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!enabled || !db) return;

    const txRef = householdDataCollection(db, 'transactions');

    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      const txs = snapshot.docs
        .map((d) => normalizeTransaction(d.id, d.data() as Record<string, unknown>))
        .filter((t) => !t.deletedAt);
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [enabled]);

  const addTransaction = async (userId: string, newTx: NewTransaction) => {
    if (!db) return null;

    const v = validateTransactionInput({
      amountStr: newTx.amount,
      dateStr: newTx.date,
      note: newTx.note,
      category: newTx.category,
    });
    if (!v.ok) throw new Error(v.message);

    const isSpend = newTx.entryKind === 'spend';
    if (isSpend) {
      const s = newTx.spendSource;
      if (s !== 'pea' && s !== 'cam' && s !== 'joint') {
        throw new Error('Choose whether this came from Pea, Cam, or joint savings');
      }
    }

    const signedCents = isSpend ? -Math.round(v.amount * 100) : Math.round(v.amount * 100);
    const signedAmount = isSpend ? -v.amount : v.amount;
    const payload: Record<string, unknown> = {
      userId,
      amount: signedAmount,
      amountCents: signedCents,
      date: v.dateStr,
      period: getAutoPeriod(v.dateStr),
      note: v.note,
      category: isSpend ? 'spend' : v.category,
      entryKind: isSpend ? 'spend' : 'saving',
      spendSource: isSpend ? newTx.spendSource : null,
      clientRequestId: newTx.clientRequestId ?? null,
      goalId: isSpend ? null : newTx.goalId ?? null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    const goalId = isSpend ? undefined : newTx.goalId;
    if (!goalId) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firebase request timed out. Please check your connection.')), 10000);
      });
      const addDocPromise = addDoc(householdDataCollection(db, 'transactions'), payload);
      const docRef = await Promise.race([addDocPromise, timeoutPromise]);
      return docRef.id;
    }

    const goalRef = householdDataDoc(db, 'goals', goalId);
    const txCol = householdDataCollection(db, 'transactions');
    const newRef = doc(txCol);

    await runTransaction(db, async (t) => {
      const goalSnap = await t.get(goalRef);
      if (!goalSnap.exists()) throw new Error('Goal not found');
      t.set(newRef, payload);
      t.update(goalRef, {
        currentAmountCents: increment(signedCents),
        currentAmount: increment(v.amount),
      });
    });

    return newRef.id;
  };

  const deleteTransaction = async (id: string) => {
    if (!db) return;
    await deleteDoc(householdDataDoc(db, 'transactions', id));
  };

  const softDeleteTransaction = async (id: string) => {
    if (!db) return;
    if (actorUserId) {
      await appendAuditLog(db, 'transaction_soft_delete', { transactionId: id }, actorUserId);
    }
    await updateDoc(householdDataDoc(db, 'transactions', id), {
      deletedAt: new Date().toISOString(),
    });
  };

  return { transactions, addTransaction, deleteTransaction, softDeleteTransaction };
}

export function useGoals(enabled: boolean) {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!enabled || !db) return;

    const goalsRef = householdDataCollection(db, 'goals');

    const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
      const loadedGoals = snapshot.docs.map((d) =>
        normalizeGoal(d.id, d.data() as Record<string, unknown>)
      );
      loadedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setGoals(loadedGoals);
    });

    return () => unsubscribe();
  }, [enabled]);

  const addGoal = async (userId: string, newGoal: NewGoal) => {
    if (!db) return;
    const v = validateNewGoalInput(newGoal.title, newGoal.targetAmount);
    if (!v.ok) throw new Error(v.message);
    const targetCents = Math.round(v.targetAmount * 100);

    await addDoc(householdDataCollection(db, 'goals'), {
      title: v.title,
      targetAmount: v.targetAmount,
      targetAmountCents: targetCents,
      currentAmount: 0,
      currentAmountCents: 0,
      deadline: newGoal.deadline,
      emoji: newGoal.emoji || '🎯',
      createdAt: new Date().toISOString(),
      createdBy: userId,
    });
  };

  const updateGoalProgress = async (goalId: string, amount: number) => {
    if (!db) return;
    const goalRef = householdDataDoc(db, 'goals', goalId);
    await updateDoc(goalRef, { currentAmount: amount });
  };

  const contributeToGoal = async (goalId: string, _currentAmount: number, contribution: number) => {
    if (!db) return;
    const c = validatePositiveAmount(String(contribution));
    if (!c.ok) throw new Error(c.message);
    const goalRef = householdDataDoc(db, 'goals', goalId);
    const cents = Math.round(c.amount * 100);
    await updateDoc(goalRef, {
      currentAmount: increment(c.amount),
      currentAmountCents: increment(cents),
    });
  };

  const contributeToGoalById = async (goalId: string, contribution: number) => {
    if (!db) return false;
    try {
      const c = validatePositiveAmount(String(contribution));
      if (!c.ok) return false;
      const goalRef = householdDataDoc(db, 'goals', goalId);
      const goalSnap = await getDoc(goalRef);
      if (!goalSnap.exists()) return false;
      const cents = Math.round(c.amount * 100);
      await updateDoc(goalRef, {
        currentAmount: increment(c.amount),
        currentAmountCents: increment(cents),
      });
      return true;
    } catch (error) {
      console.error('Error contributing to goal:', error);
      return false;
    }
  };

  const deleteGoal = async (id: string) => {
    if (!db) return;
    await deleteDoc(householdDataDoc(db, 'goals', id));
  };

  return { goals, addGoal, updateGoalProgress, contributeToGoal, contributeToGoalById, deleteGoal };
}
