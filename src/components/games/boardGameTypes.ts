import type { GameSession } from '@/hooks/useGameSession';
import type { Profile, Theme } from '@/types';

export interface BoardGamePanelProps {
  session: GameSession;
  currentProfileId: string;
  profiles: Record<string, Profile>;
  currentTheme: Theme;
  onUpdate: (updates: Record<string, unknown>) => Promise<void>;
}
