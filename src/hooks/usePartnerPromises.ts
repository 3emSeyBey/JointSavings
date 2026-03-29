import { useState, useEffect, useCallback } from 'react';
import { getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { householdDataCollection, householdDataDoc } from '@/lib/firestorePaths';
import { validatePartnerPromiseText } from '@/lib/validation';
import type { PartnerPromise } from '@/types';

function normalizePartnerPromise(profileId: string, data: Record<string, unknown>): PartnerPromise {
  return {
    profileId,
    text: String(data.text ?? ''),
    declaredAt: String(data.declaredAt ?? data.updatedAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
    revisedCount: typeof data.revisedCount === 'number' && Number.isFinite(data.revisedCount) ? data.revisedCount : 0,
  };
}

export function usePartnerPromises(enabled: boolean) {
  const [byProfileId, setByProfileId] = useState<Record<string, PartnerPromise>>({});

  useEffect(() => {
    if (!enabled || !db) return;

    const col = householdDataCollection(db, 'partnerPromises');
    const unsub = onSnapshot(col, (snap) => {
      const next: Record<string, PartnerPromise> = {};
      snap.docs.forEach((d) => {
        next[d.id] = normalizePartnerPromise(d.id, d.data() as Record<string, unknown>);
      });
      setByProfileId(next);
    });
    return () => unsub();
  }, [enabled]);

  const savePromise = useCallback(async (profileId: string, rawText: string) => {
    if (!db) return;
    const v = validatePartnerPromiseText(rawText);
    if (!v.ok) throw new Error(v.message);

    const ref = householdDataDoc(db, 'partnerPromises', profileId);
    const snap = await getDoc(ref);
    const now = new Date().toISOString();
    const prev = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
    const isNew = !prev;
    const declaredAt = isNew ? now : String(prev!.declaredAt ?? now);
    const revisedCount = isNew ? 0 : Number(prev!.revisedCount ?? 0) + 1;

    await setDoc(
      ref,
      {
        profileId,
        text: v.text,
        declaredAt,
        updatedAt: now,
        revisedCount,
      },
      { merge: true }
    );
  }, []);

  return { partnerPromisesByProfileId: byProfileId, savePartnerPromise: savePromise };
}
