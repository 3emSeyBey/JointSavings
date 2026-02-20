import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, APP_ID } from '@/config/firebase';

export interface GameSession {
  id: string;
  gameType: 'rps' | 'roulette' | 'rng';
  status: 'pending' | 'active' | 'finished';
  initiator: string;
  createdAt: string;
  // RPS
  peaChoice: string | null;
  camChoice: string | null;
  rpsRound: number;
  rpsScorePea: number;
  rpsScoreCam: number;
  // Roulette
  rouletteItems: string[];
  rouletteResult: string | null;
  rouletteSpinTs: number | null;
  // RNG
  rngMin: number;
  rngMax: number;
  rngResult: number | null;
  rngRollTs: number | null;
}

const getSessionDoc = () => doc(db, 'artifacts', APP_ID, 'public', 'data', 'gameSessions', 'active');

export function useGameSession(isAuthenticated: boolean, currentProfileId: string | null) {
  const [session, setSession] = useState<GameSession | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = onSnapshot(getSessionDoc(), (snap) => {
      if (snap.exists()) {
        setSession({ id: snap.id, ...snap.data() } as GameSession);
      } else {
        setSession(null);
      }
    });
    return () => unsub();
  }, [isAuthenticated]);

  const createSession = async (gameType: GameSession['gameType']) => {
    if (!currentProfileId) return;
    await setDoc(getSessionDoc(), {
      gameType,
      status: 'pending',
      initiator: currentProfileId,
      createdAt: new Date().toISOString(),
      peaChoice: null,
      camChoice: null,
      rpsRound: 1,
      rpsScorePea: 0,
      rpsScoreCam: 0,
      rouletteItems: [],
      rouletteResult: null,
      rouletteSpinTs: null,
      rngMin: 1,
      rngMax: 100,
      rngResult: null,
      rngRollTs: null,
    });
  };

  const joinSession = async () => {
    await updateDoc(getSessionDoc(), { status: 'active' });
  };

  const updateSession = async (updates: Record<string, unknown>) => {
    await updateDoc(getSessionDoc(), updates);
  };

  const endSession = async () => {
    await deleteDoc(getSessionDoc());
  };

  const pendingInvite = session?.status === 'pending' && session.initiator !== currentProfileId
    ? session : null;

  return { session, pendingInvite, createSession, joinSession, updateSession, endSession };
}
