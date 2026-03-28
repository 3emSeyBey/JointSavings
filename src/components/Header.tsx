import { LogOut, Sparkles, Flame, Orbit } from 'lucide-react';
import type { Profile, Theme } from '@/types';
import { useThemeMode } from '@/context/ThemeModeContext';

interface HeaderProps {
  profile: Profile;
  theme: Theme;
  onAskCoach: () => void;
  onLogout: () => void;
}

export function Header({ profile, theme, onAskCoach, onLogout }: HeaderProps) {
  const { mode, toggle } = useThemeMode();

  return (
    <header className="sticky top-0 z-30 safe-area-pt">
      <div className="glass-panel border-x-0 border-t-0 rounded-none border-b max-w-4xl mx-auto">
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0 ring-2 ring-white/10 ${theme.bgClass} text-white`}
            >
              <span className="relative z-10">{profile.emoji}</span>
              <span
                className="absolute inset-0 rounded-2xl opacity-40 animate-pulse-slow bg-gradient-to-br from-white/30 to-transparent"
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                Money Mates
              </p>
              <h1 className="font-display text-lg sm:text-xl font-black text-[var(--text)] truncate leading-tight">
                {profile.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={toggle}
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/60 text-[var(--accent-a)] hover:shadow-[0_0_20px_var(--border-glow)] transition-all duration-300"
              title={mode === 'nebula' ? 'Switch to Ember forge' : 'Switch to Nebula'}
              aria-label="Toggle color universe"
            >
              {mode === 'nebula' ? <Orbit size={22} strokeWidth={2.25} /> : <Flame size={22} strokeWidth={2.25} />}
            </button>
            <button
              type="button"
              onClick={onAskCoach}
              className="min-h-11 min-w-11 sm:min-w-0 sm:px-4 flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-violet-100 bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-900/40 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10"
              aria-label="Open AI coach"
            >
              <Sparkles size={20} className="shrink-0" />
              <span className="hidden sm:inline">Coach</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]/80 transition-colors"
              aria-label="Log out"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
