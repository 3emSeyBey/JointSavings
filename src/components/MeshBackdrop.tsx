import { useThemeMode } from '@/context/ThemeModeContext';

/**
 * Layered mesh orbs + film grain + slow parallax rotation (GPU-friendly).
 */
export function MeshBackdrop() {
  const { mode } = useThemeMode();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Base wash */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background:
            mode === 'nebula'
              ? 'radial-gradient(ellipse 120% 80% at 50% -20%, #1e1b4b 0%, transparent 55%), radial-gradient(ellipse 90% 60% at 100% 50%, #0c4a6e 0%, transparent 45%), #050508'
              : 'radial-gradient(ellipse 120% 80% at 50% -20%, #431407 0%, transparent 55%), radial-gradient(ellipse 90% 50% at 0% 80%, #713f12 0%, transparent 40%), #140808',
        }}
      />

      {/* Animated orbs */}
      <div
        className="absolute -left-1/4 top-1/4 h-[min(90vw,520px)] w-[min(90vw,520px)] rounded-full opacity-40 blur-[100px] animate-orb-drift"
        style={{
          background:
            mode === 'nebula'
              ? 'conic-gradient(from 180deg at 50% 50%, #22d3ee, #c084fc, #f472b6, #22d3ee)'
              : 'conic-gradient(from 90deg at 50% 50%, #ea580c, #eab308, #f97316, #ea580c)',
        }}
      />
      <div
        className="absolute -right-1/4 bottom-0 h-[min(70vw,420px)] w-[min(70vw,420px)] rounded-full opacity-35 blur-[90px] animate-orb-drift-reverse"
        style={{
          background:
            mode === 'nebula'
              ? 'radial-gradient(circle, rgba(168,85,247,0.9) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(234,88,12,0.85) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[40vmax] w-[40vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px] animate-pulse-slow"
        style={{
          background:
            mode === 'nebula'
              ? 'radial-gradient(circle, #06b6d4 0%, transparent 65%)'
              : 'radial-gradient(circle, #fbbf24 0%, transparent 65%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay animate-grid-pan"
        style={{
          backgroundImage:
            mode === 'nebula'
              ? 'linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.12) 1px, transparent 1px)'
              : 'linear-gradient(rgba(251,191,36,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(234,88,12,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay animate-grain"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
