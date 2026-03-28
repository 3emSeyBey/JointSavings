import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

export function canUseServerPin(): boolean {
  return Boolean(functions);
}

export async function setServerPin(profileId: string, pin: string): Promise<void> {
  if (!functions) throw new Error('Firebase Functions not available');
  const fn = httpsCallable<{ profileId: string; pin: string }, { ok?: boolean }>(
    functions,
    'setProfilePin'
  );
  await fn({ profileId, pin });
}

export async function clearServerPin(profileId: string): Promise<void> {
  if (!functions) throw new Error('Firebase Functions not available');
  const fn = httpsCallable<{ profileId: string }, { ok?: boolean }>(functions, 'clearProfilePin');
  await fn({ profileId });
}

export async function verifyServerPin(profileId: string, pin: string): Promise<boolean> {
  if (!functions) return false;
  const fn = httpsCallable<{ profileId: string; pin: string }, { ok?: boolean }>(
    functions,
    'verifyProfilePin'
  );
  const res = await fn({ profileId, pin });
  return Boolean(res.data?.ok);
}
