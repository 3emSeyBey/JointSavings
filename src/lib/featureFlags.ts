/**
 * Runtime feature toggles (H-006). Extend via env or remote config later.
 */
export const featureFlags = {
  openFinanceBeta: import.meta.env.VITE_FLAG_OPEN_FINANCE === 'true',
  voiceCoach: import.meta.env.VITE_FLAG_VOICE_COACH === 'true',
  socialLeaderboard: import.meta.env.VITE_FLAG_SOCIAL === 'true',
} as const;
