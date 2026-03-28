import { addDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { householdDataCollection } from '@/lib/firestorePaths';

export type AuditAction =
  | 'transaction_soft_delete'
  | 'goal_delete'
  | 'profile_update'
  | 'target_close_period';

export async function appendAuditLog(
  db: Firestore,
  action: AuditAction,
  payload: Record<string, unknown>,
  actorUserId: string
): Promise<void> {
  try {
    await addDoc(householdDataCollection(db, 'auditLogs'), {
      action,
      payload,
      actorUserId,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('audit log skipped', e);
  }
}
