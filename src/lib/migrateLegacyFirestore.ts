import { getDocs, writeBatch, getDoc, type Firestore } from 'firebase/firestore';
import { APP_ID, HOUSEHOLD_ID } from '@/config/firebase';
import { householdDataCollection, householdDataDoc, legacyDataCollection, legacyDataDoc } from '@/lib/firestorePaths';

const STORAGE_KEY = `moneymates_legacy_migrated_${HOUSEHOLD_ID}`;

/**
 * One-time copy from legacy `artifacts/.../public/data` to `households/{id}/data/v1`.
 * Safe to call multiple times; no-ops if already migrated or new data exists.
 */
export async function migrateLegacyToHouseholdIfNeeded(db: Firestore): Promise<void> {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) return;

  const newProfilesRef = householdDataCollection(db, 'profiles');
  const newProfilesSnap = await getDocs(newProfilesRef);
  if (!newProfilesSnap.empty) {
    localStorage.setItem(STORAGE_KEY, 'skipped_nonempty');
    return;
  }

  const legacyProfilesRef = legacyDataCollection(db, APP_ID, 'profiles');
  const legacyProfilesSnap = await getDocs(legacyProfilesRef);
  if (legacyProfilesSnap.empty) {
    localStorage.setItem(STORAGE_KEY, 'skipped_no_legacy');
    return;
  }

  const batch = writeBatch(db);

  for (const d of legacyProfilesSnap.docs) {
    batch.set(householdDataDoc(db, 'profiles', d.id), d.data());
  }

  const legacyTxSnap = await getDocs(legacyDataCollection(db, APP_ID, 'transactions'));
  for (const d of legacyTxSnap.docs) {
    batch.set(householdDataDoc(db, 'transactions', d.id), d.data());
  }

  const legacyGoalsSnap = await getDocs(legacyDataCollection(db, APP_ID, 'goals'));
  for (const d of legacyGoalsSnap.docs) {
    batch.set(householdDataDoc(db, 'goals', d.id), d.data());
  }

  const legacyGameSnap = await getDoc(legacyDataDoc(db, APP_ID, 'gameSessions', 'active'));
  if (legacyGameSnap.exists()) {
    batch.set(householdDataDoc(db, 'gameSessions', 'active'), legacyGameSnap.data()!);
  }

  await batch.commit();
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }
}
