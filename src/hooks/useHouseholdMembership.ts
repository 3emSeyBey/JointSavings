import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, HOUSEHOLD_ID } from '@/config/firebase';
import type { HouseholdRole } from '@/types';

/**
 * Ensures `users/{uid}` exists and exposes role for RBAC (A-004).
 * `membershipReady` is true after the user doc is guaranteed for Firestore rules.
 */
export function useHouseholdMembership(enabled: boolean, userId: string | undefined) {
  const [role, setRole] = useState<HouseholdRole>('owner');
  const [membershipReady, setMembershipReady] = useState(false);

  useEffect(() => {
    if (!enabled || !db || !userId) {
      setMembershipReady(false);
      return;
    }

    const ref = doc(db, 'users', userId);
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const snap = await getDoc(ref);
      if (cancelled) return;
      if (!snap.exists()) {
        await setDoc(
          ref,
          {
            householdId: HOUSEHOLD_ID,
            role: 'owner' as const,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      if (cancelled) return;
      setMembershipReady(true);

      unsub = onSnapshot(ref, (s) => {
        if (!s.exists()) return;
        const r = s.data().role as HouseholdRole | undefined;
        if (r === 'owner' || r === 'member' || r === 'viewer') setRole(r);
        else setRole('member');
      });
    })().catch((e) => {
      console.error('Household membership init failed:', e);
      setMembershipReady(false);
    });

    return () => {
      cancelled = true;
      unsub?.();
      setMembershipReady(false);
    };
  }, [enabled, userId]);

  const canWrite = role !== 'viewer';

  return { role, canWrite, membershipReady };
}
