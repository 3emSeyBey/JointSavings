import type { Firestore } from 'firebase/firestore';
import { collection, doc } from 'firebase/firestore';
import { HOUSEHOLD_ID } from '@/config/firebase';

/**
 * Firestore requires collection paths to have an **odd** number of segments.
 * `households/{id}/data/{sub}` has 4 segments (even) and is invalid for `collection()`.
 * All app data lives under a single root doc: `households/{id}/data/v1/{collection}/…`
 */
export const HOUSEHOLD_DATA_ROOT_DOC = 'v1';

export function householdDataCollection(db: Firestore, ...segments: string[]) {
  return collection(db, 'households', HOUSEHOLD_ID, 'data', HOUSEHOLD_DATA_ROOT_DOC, ...segments);
}

export function householdDataDoc(db: Firestore, ...segments: string[]) {
  return doc(db, 'households', HOUSEHOLD_ID, 'data', HOUSEHOLD_DATA_ROOT_DOC, ...segments);
}

/** Legacy root: artifacts/{appId}/public/data */
export function legacyDataCollection(db: Firestore, appId: string, ...segments: string[]) {
  return collection(db, 'artifacts', appId, 'public', 'data', ...segments);
}

export function legacyDataDoc(db: Firestore, appId: string, ...segments: string[]) {
  return doc(db, 'artifacts', appId, 'public', 'data', ...segments);
}
