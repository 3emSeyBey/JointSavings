import type { Profile } from '@/types';

export function profileHasPin(profile: Profile | undefined): boolean {
  if (!profile) return false;
  if (profile.pin && profile.pin.trim() !== '') return true;
  if (profile.pinHash && String(profile.pinHash).length > 0) return true;
  return false;
}
