import { useState, useEffect, useCallback } from 'react';
import { addDoc, getDocs, onSnapshot, orderBy, query, limit, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { householdDataCollection } from '@/lib/firestorePaths';
import type { ChatMessage } from '@/types';

function toChatMessage(id: string, data: Record<string, unknown>): ChatMessage {
  return {
    id,
    role: data.role === 'assistant' ? 'assistant' : 'user',
    content: String(data.content ?? ''),
    timestamp: new Date(String(data.createdAt ?? Date.now())),
  };
}

function messagesCol() {
  if (!db) return null;
  return householdDataCollection(db, 'aiThreads', 'main', 'messages');
}

/**
 * Persists coach thread under household data (D-001). Falls back to local state when disabled.
 */
export function useAIThread(enabled: boolean) {
  const [remote, setRemote] = useState<ChatMessage[]>([]);
  const [local, setLocal] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const col = messagesCol();
    if (!enabled || !col) {
      setRemote([]);
      return;
    }
    const q = query(col, orderBy('createdAt', 'asc'), limit(200));
    return onSnapshot(q, (snap) => {
      setRemote(snap.docs.map((d) => toChatMessage(d.id, d.data() as Record<string, unknown>)));
    });
  }, [enabled]);

  const messages = enabled && db ? remote : local;

  const pushMessage = useCallback(
    async (role: 'user' | 'assistant', content: string) => {
      const col = messagesCol();
      if (enabled && col) {
        await addDoc(col, {
          role,
          content,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      setLocal((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          role,
          content,
          timestamp: new Date(),
        },
      ]);
    },
    [enabled]
  );

  const clearThread = useCallback(async () => {
    const col = messagesCol();
    if (enabled && col && db) {
      const snap = await getDocs(col);
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return;
    }
    setLocal([]);
  }, [enabled]);

  return { messages, pushMessage, clearThread };
}
