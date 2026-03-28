import {
  LayoutDashboard,
  CalendarDays,
  Target,
  BarChart3,
  Gamepad2,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { TabType } from '@/types';

const NAV_ITEMS: { id: TabType; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'targets', label: 'Targets', icon: CalendarDays },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
  { id: 'games', label: 'Play', icon: Gamepad2 },
  { id: 'settings', label: 'More', icon: Settings },
];

interface MobileTabBarProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export function MobileTabBar({ activeTab, onChange }: MobileTabBarProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-2xl shadow-[0_-12px_48px_rgba(0,0,0,0.45)] safe-area-pb"
      aria-label="Main navigation"
    >
      <div
        className="absolute inset-x-0 top-0 h-px opacity-60 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, var(--accent-a), var(--accent-b), transparent)`,
        }}
        aria-hidden
      />
      <div className="flex justify-around items-stretch max-w-lg mx-auto px-1 pt-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 px-0.5 rounded-xl transition-all duration-300 touch-manipulation min-h-[3.25rem] ${
                active
                  ? 'text-[var(--accent-a)]'
                  : 'text-[var(--text-dim)] active:bg-[var(--surface-raised)]/50'
              }`}
            >
              {active && (
                <span
                  className="absolute inset-x-1 top-1 bottom-0 rounded-lg opacity-25 pointer-events-none"
                  style={{
                    background: `linear-gradient(180deg, color-mix(in srgb, var(--accent-a) 35%, transparent), transparent)`,
                  }}
                  aria-hidden
                />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className={`shrink-0 relative z-10 ${active ? 'drop-shadow-[0_0_14px_color-mix(in_srgb,var(--accent-a)_55%,transparent)]' : ''}`}
                aria-hidden
              />
              <span className="text-[10px] font-display font-extrabold leading-tight truncate w-full text-center relative z-10 tracking-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
