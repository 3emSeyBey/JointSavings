import { useMemo } from 'react';
import { useThemeMode } from '@/context/ThemeModeContext';

const STAR_COUNT = 42;

function starLayout(i: number) {
  const left = ((i * 47) % 100) + (i % 3) * 0.7;
  const top = ((i * 31 + 11) % 88) + (i % 5) * 0.4;
  const sizePx = 3 + (i % 5) * 0.9;
  const delay = ((i * 0.37) % 4).toFixed(2);
  const duration = (2.4 + (i % 6) * 0.45).toFixed(2);
  return { left: `${left}%`, top: `${top}%`, sizePx, delay, duration };
}

const animStar = {
  animationName: 'mm-dash-star-twinkle' as const,
  animationTimingFunction: 'ease-in-out' as const,
  animationIterationCount: 'infinite' as const,
};

/**
 * Playful ambient layer — animations use global @keyframes in index.css + inline longhands
 * so they are not dropped or overridden by Tailwind / opacity utilities.
 */
export function DashboardWhimsy() {
  const { mode } = useThemeMode();

  const stars = useMemo(() => Array.from({ length: STAR_COUNT }, (_, i) => starLayout(i)), []);

  const accent = mode === 'nebula' ? 'rgba(34,211,238,0.75)' : 'rgba(251,191,36,0.7)';
  const accent2 = mode === 'nebula' ? 'rgba(244,114,182,0.65)' : 'rgba(251,146,60,0.65)';

  return (
    <div
      className="dashboard-whimsy-root pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: `${s.sizePx}px`,
            height: `${s.sizePx}px`,
            ...animStar,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            background: i % 5 === 0 ? accent2 : accent,
            boxShadow: `0 0 ${5 + (i % 4)}px ${accent}`,
          }}
        />
      ))}

      <div
        className="absolute w-2.5 h-2.5 rounded-full left-[8%] top-[18%] opacity-60"
        style={{
          background: accent,
          boxShadow: `0 0 14px ${accent}`,
          ...animStar,
          animationDuration: '6s',
          animationDelay: '0.4s',
        }}
      />
      <div
        className="absolute w-2 h-2 rounded-full left-[82%] top-[12%] opacity-60"
        style={{
          background: accent2,
          ...animStar,
          animationDuration: '7s',
          animationDelay: '2.2s',
        }}
      />
      <div
        className="absolute w-2.5 h-2.5 rounded-full right-[12%] bottom-[28%] opacity-50"
        style={{
          background: accent,
          ...animStar,
          animationDuration: '5.5s',
          animationDelay: '1.1s',
        }}
      />

      <div
        className="absolute left-[5%] top-[8%] w-28 h-px origin-left rotate-[35deg]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          animationName: 'mm-dash-shoot',
          animationDuration: '2.6s',
          animationTimingFunction: 'ease-out',
          animationIterationCount: 'infinite',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute left-[55%] top-[4%] w-24 h-px origin-left rotate-[42deg]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent2}, transparent)`,
          animationName: 'mm-dash-shoot',
          animationDuration: '2.6s',
          animationTimingFunction: 'ease-out',
          animationIterationCount: 'infinite',
          animationDelay: '5s',
        }}
      />
      <div
        className="absolute left-[30%] top-[22%] w-20 h-px origin-left rotate-[30deg]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          animationName: 'mm-dash-shoot',
          animationDuration: '2.6s',
          animationTimingFunction: 'ease-out',
          animationIterationCount: 'infinite',
          animationDelay: '10s',
        }}
      />

      <span
        className="absolute left-[6%] top-[38%] text-lg opacity-40"
        style={{
          animationName: 'mm-dash-float',
          animationDuration: '14s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: '0.2s',
        }}
      >
        ✨
      </span>
      <span
        className="absolute right-[10%] top-[44%] text-xl opacity-35"
        style={{
          animationName: 'mm-dash-float-alt',
          animationDuration: '11s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: '1.4s',
        }}
      >
        🌟
      </span>
      <span
        className="absolute left-[18%] bottom-[32%] text-base opacity-30"
        style={{
          animationName: 'mm-dash-float',
          animationDuration: '16s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: '2.8s',
        }}
      >
        💫
      </span>
      <span
        className="absolute right-[22%] top-[28%] text-lg opacity-35"
        style={{
          animationName: 'mm-dash-float-alt',
          animationDuration: '12s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: '0.9s',
        }}
      >
        💸
      </span>
      <span
        className="absolute left-[42%] top-[16%] text-sm opacity-35"
        style={{
          animationName: 'mm-dash-float',
          animationDuration: '13s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: '3.2s',
        }}
      >
        🪙
      </span>
      <span
        className="absolute right-[38%] bottom-[38%] text-base opacity-30"
        style={{
          animationName: 'mm-dash-float-alt',
          animationDuration: '15s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: '2s',
        }}
      >
        📈
      </span>

      <div className="absolute bottom-[max(5.5rem,env(safe-area-inset-bottom))] left-[12%] flex gap-3 opacity-50">
        <span
          className="text-[10px]"
          style={{
            animationName: 'mm-dash-paw',
            animationDuration: '2.8s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '0s',
          }}
        >
          🐾
        </span>
        <span
          className="text-[10px]"
          style={{
            animationName: 'mm-dash-paw',
            animationDuration: '2.8s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '0.45s',
          }}
        >
          🐾
        </span>
        <span
          className="text-[10px]"
          style={{
            animationName: 'mm-dash-paw',
            animationDuration: '2.8s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '0.9s',
          }}
        >
          🐾
        </span>
      </div>
    </div>
  );
}
