import type { CSSProperties } from 'react';
import type { Theme } from '@/types';

/** Fixed blue palette for the line-clear puzzle (independent of profile theme). */
export const LINE_PUZZLE_GAME_THEME: Theme = {
  color: '#1d4ed8',
  bgClass: 'bg-blue-700',
  textClass: 'text-blue-900',
  lightBg: 'bg-blue-50',
  border: 'border-blue-200',
};

/** Parse #RRGGBB to rgba(...). */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(100, 116, 139, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Slightly lighter / darker for gradient stops (simple channel blend). */
function hexBlend(hex: string, toward: '#ffffff' | '#000000', amount: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const t = toward === '#ffffff' ? 255 : 0;
  const mix = (c: number) => Math.round(c + (t - c) * amount);
  const nr = mix(r);
  const ng = mix(g);
  const nb = mix(b);
  return `rgb(${nr},${ng},${nb})`;
}

export function filledBlockStyle(theme: Theme): CSSProperties {
  const { color } = theme;
  return {
    backgroundImage: `linear-gradient(168deg, ${hexBlend(color, '#ffffff', 0.14)} 0%, ${color} 48%, ${hexBlend(color, '#000000', 0.1)} 100%)`,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: hexToRgba(color, 0.72),
    boxShadow: `inset 0 1px 0 ${hexToRgba('#ffffff', 0.22)}`,
  };
}

export function emptyBoardCellStyle(theme: Theme): CSSProperties {
  const { color } = theme;
  return {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: hexToRgba(color, 0.38),
  };
}

export function previewValidStyle(theme: Theme): CSSProperties {
  const { color } = theme;
  return {
    backgroundImage: `linear-gradient(180deg, ${hexToRgba(color, 0.22)} 0%, ${hexToRgba(color, 0.1)} 100%)`,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: hexToRgba(color, 0.62),
    boxShadow: `inset 0 0 10px ${hexToRgba(color, 0.12)}, 0 0 0 1px ${hexToRgba(color, 0.2)}`,
  };
}

export function previewInvalidStyle(theme: Theme): CSSProperties {
  const { color } = theme;
  return {
    backgroundImage: `linear-gradient(180deg, ${hexToRgba('#fb7185', 0.35)} 0%, ${hexToRgba('#fb7185', 0.12)} 100%)`,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'rgba(244, 63, 94, 0.55)',
    boxShadow: `inset 0 0 10px ${hexToRgba(color, 0.08)}`,
  };
}

export function primaryButtonStyle(theme: Theme): CSSProperties {
  const { color } = theme;
  return {
    backgroundImage: `linear-gradient(168deg, ${hexBlend(color, '#ffffff', 0.12)} 0%, ${color} 45%, ${hexBlend(color, '#000000', 0.08)} 100%)`,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: hexToRgba(color, 0.75),
    boxShadow: `inset 0 1px 0 ${hexToRgba('#ffffff', 0.2)}`,
    color: '#fff',
  };
}
