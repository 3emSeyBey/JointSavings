import { useState, useEffect } from 'react';
import { onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { householdDataDoc } from '@/lib/firestorePaths';
import { initialBoardStateJson, type BoardGameKind } from '@/lib/boardGameState';

export interface GameSession {
  id: string;
  gameType:
    | 'rps'
    | 'roulette'
    | 'rng'
    | 'decide'
    | 'chess'
    | 'checkers'
    | 'connect4'
    | 'ttt'
    | 'linePuzzle';
  status: 'pending' | 'active' | 'finished';
  /** When true, only `initiator` sees the session; starts active with no partner invite. */
  solo?: boolean;
  initiator: string;
  createdAt: string;
  peaChoice: string | null;
  camChoice: string | null;
  rpsRound: number;
  rpsScorePea: number;
  rpsScoreCam: number;
  rouletteItems: string[];
  rouletteResult: string | null;
  rouletteSpinTs: number | null;
  rngMin: number;
  rngMax: number;
  rngResult: number | null;
  rngRollTs: number | null;
  decideQuestion: string;
  decideOptions: string[];
  decideMode: 'think' | 'random';
  decideChat: Array<{ role: string; text: string }>;
  decideResult: string | null;
  decideLoading: boolean;
  /** JSON payloads for chess / checkers / connect4 / tic-tac-toe — see `boardGameState.ts`. */
  boardStateJson?: string;
}

function getSessionDocRef() {
  if (!db) return null;
  return householdDataDoc(db, 'gameSessions', 'active');
}

export function useGameSession(enabled: boolean, currentProfileId: string | null) {
  const [session, setSession] = useState<GameSession | null>(null);

  useEffect(() => {
    if (!enabled || !db) return;
    const ref = getSessionDocRef();
    if (!ref) return;
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSession({ id: snap.id, ...snap.data() } as GameSession);
      } else {
        setSession(null);
      }
    });
    return () => unsub();
  }, [enabled]);

  const createSession = async (
    gameType: GameSession['gameType'],
    opts?: { solo?: boolean }
  ) => {
    if (!currentProfileId || !db) return;
    const ref = getSessionDocRef();
    if (!ref) return;
    const solo = gameType === 'linePuzzle' ? true : opts?.solo === true;
    const boardKinds: BoardGameKind[] = ['chess', 'checkers', 'connect4', 'ttt'];
    const boardStateJson = boardKinds.includes(gameType as BoardGameKind)
      ? initialBoardStateJson(gameType as BoardGameKind)
      : '';
    await setDoc(ref, {
      gameType,
      solo,
      status: solo ? 'active' : 'pending',
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
      decideQuestion: '',
      decideOptions: [],
      decideMode: 'think',
      decideChat: [],
      decideResult: null,
      decideLoading: false,
      boardStateJson,
    });
  };

  const joinSession = async () => {
    const ref = getSessionDocRef();
    if (!ref) return;
    await updateDoc(ref, { status: 'active' });
  };

  const updateSession = async (updates: Record<string, unknown>) => {
    const ref = getSessionDocRef();
    if (!ref) return;
    await updateDoc(ref, updates);
  };

  const endSession = async () => {
    const ref = getSessionDocRef();
    if (!ref) return;
    await deleteDoc(ref);
  };

  const pendingInvite =
    session?.status === 'pending' && session.initiator !== currentProfileId ? session : null;

  return { session, pendingInvite, createSession, joinSession, updateSession, endSession };
}
