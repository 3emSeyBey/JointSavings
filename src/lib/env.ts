/**
 * Required Vite env vars for Firebase client (A-011).
 */
export const FIREBASE_REQUIRED_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export type FirebaseEnvValidation =
  | { ok: true }
  | { ok: false; missing: string[] };

export function validateFirebaseEnv(): FirebaseEnvValidation {
  const missing: string[] = [];
  for (const key of FIREBASE_REQUIRED_ENV_KEYS) {
    const v = import.meta.env[key as keyof ImportMetaEnv];
    if (v === undefined || v === null || String(v).trim() === '') {
      missing.push(key);
    }
  }
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}
