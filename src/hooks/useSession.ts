import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'moneymates_session';

interface SessionData {
  profileId: string;
  timestamp: number;
}

export function useSession() {
  const [sessionProfileId, setSessionProfileId] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: SessionData = JSON.parse(stored);
        // Session is valid for 30 days
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - session.timestamp < thirtyDays) {
          console.log('[useSession] Restored session for:', session.profileId);
          setSessionProfileId(session.profileId);
        } else {
          console.log('[useSession] Session expired, clearing...');
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('[useSession] Error loading session:', error);
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  // Save session
  const saveSession = useCallback((profileId: string) => {
    const session: SessionData = {
      profileId,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setSessionProfileId(profileId);
    console.log('[useSession] Session saved for:', profileId);
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSessionProfileId(null);
    console.log('[useSession] Session cleared');
  }, []);

  return {
    sessionProfileId,
    isSessionLoading,
    saveSession,
    clearSession,
  };
}

