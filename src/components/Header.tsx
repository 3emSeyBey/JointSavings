import { LogOut, Sparkles } from 'lucide-react';
import type { Profile, Theme } from '@/types';

interface HeaderProps {
  profile: Profile;
  theme: Theme;
  onAskCoach: () => void;
  onLogout: () => void;
}

export function Header({ profile, theme, onAskCoach, onLogout }: HeaderProps) {
  return (
    <header className="bg-white sticky top-0 z-30 px-6 py-4 shadow-sm flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm ${theme.bgClass} text-white`}
        >
          {profile.emoji}
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-slate-800">{profile.name}</h1>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAskCoach}
          className="p-2 text-violet-500 hover:bg-violet-50 rounded-full flex items-center gap-2 px-3 border border-violet-100 transition-colors"
        >
          <Sparkles size={18} />
          <span className="text-xs font-bold hidden sm:inline">✨ Coach</span>
        </button>
        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
