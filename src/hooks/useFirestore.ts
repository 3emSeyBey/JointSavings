import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc,
  updateDoc,
  getDoc,
  increment
} from 'firebase/firestore';
import { db, APP_ID } from '@/config/firebase';
import { DEFAULT_PROFILES } from '@/lib/constants';
import type { Profile, Transaction, NewTransaction, Goal, NewGoal } from '@/types';
import { getAutoPeriod } from '@/lib/utils';

export function useProfiles(isAuthenticated: boolean) {
  const [profiles, setProfiles] = useState<Record<string, Profile>>(DEFAULT_PROFILES);

  useEffect(() => {
    if (!isAuthenticated) return;

    const profilesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'profiles');
    
    const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
      const loaded: Record<string, Profile> = {};
      snapshot.docs.forEach(doc => {
        loaded[doc.id] = doc.data() as Profile;
      });
      
      if (Object.keys(loaded).length === 0) {
        // Initialize default profiles
        setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', 'pea'), DEFAULT_PROFILES.pea);
        setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', 'cam'), DEFAULT_PROFILES.cam);
      } else {
        setProfiles(prev => ({ ...prev, ...loaded }));
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const updateProfile = async (profileId: string, data: Partial<Profile>) => {
    const profileRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'profiles', profileId);
    await setDoc(profileRef, data, { merge: true });
  };

  return { profiles, updateProfile };
}

export function useTransactions(isAuthenticated: boolean) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const txRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions');
    
    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      const txs = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      })) as Transaction[];
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addTransaction = async (userId: string, newTx: NewTransaction) => {
    if (!newTx.amount) return null;
    
    try {
      const transactionData = {
        userId,
        amount: Number(newTx.amount),
        date: newTx.date,
        period: getAutoPeriod(newTx.date),
        note: newTx.note,
        goalId: newTx.goalId || null,
        createdAt: new Date().toISOString()
      };
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firebase request timed out. Please check your connection.')), 10000);
      });
      
      const addDocPromise = addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions'), transactionData);
      
      const docRef = await Promise.race([addDocPromise, timeoutPromise]);
      return docRef.id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'transactions', id));
  };

  return { transactions, addTransaction, deleteTransaction };
}

export function useGoals(isAuthenticated: boolean) {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const goalsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'goals');
    
    const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
      const loadedGoals = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      })) as Goal[];
      loadedGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setGoals(loadedGoals);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addGoal = async (userId: string, newGoal: NewGoal) => {
    if (!newGoal.title || !newGoal.targetAmount) return;
    
    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'goals'), {
      title: newGoal.title,
      targetAmount: Number(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline,
      emoji: newGoal.emoji || '🎯',
      createdAt: new Date().toISOString(),
      createdBy: userId
    });
  };

  const updateGoalProgress = async (goalId: string, amount: number) => {
    const goalRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'goals', goalId);
    await updateDoc(goalRef, { currentAmount: amount });
  };

  const contributeToGoal = async (goalId: string, currentAmount: number, contribution: number) => {
    const goalRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'goals', goalId);
    await updateDoc(goalRef, { currentAmount: currentAmount + contribution });
  };

  // Simplified version that uses Firestore increment for atomic updates
  const contributeToGoalById = async (goalId: string, contribution: number) => {
    try {
      const goalRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'goals', goalId);
      const goalSnap = await getDoc(goalRef);
      
      if (goalSnap.exists()) {
        // Use increment for atomic update
        await updateDoc(goalRef, { 
          currentAmount: increment(contribution) 
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error contributing to goal:', error);
      return false;
    }
  };

  const deleteGoal = async (id: string) => {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'goals', id));
  };

  return { goals, addGoal, updateGoalProgress, contributeToGoal, contributeToGoalById, deleteGoal };
}

