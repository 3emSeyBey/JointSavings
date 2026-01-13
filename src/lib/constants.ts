import type { Theme, Profile } from '@/types';

export const THEMES: Record<string, Theme> = {
  emerald: { 
    color: '#10b981', 
    bgClass: 'bg-emerald-500', 
    textClass: 'text-emerald-500', 
    lightBg: 'bg-emerald-50', 
    border: 'border-emerald-200' 
  },
  green: { 
    color: '#22c55e', 
    bgClass: 'bg-green-500', 
    textClass: 'text-green-500', 
    lightBg: 'bg-green-50', 
    border: 'border-green-200' 
  },
  pink: { 
    color: '#ec4899', 
    bgClass: 'bg-pink-500', 
    textClass: 'text-pink-500', 
    lightBg: 'bg-pink-50', 
    border: 'border-pink-200' 
  },
  indigo: { 
    color: '#6366f1', 
    bgClass: 'bg-indigo-500', 
    textClass: 'text-indigo-500', 
    lightBg: 'bg-indigo-50', 
    border: 'border-indigo-200' 
  },
  rose: { 
    color: '#f43f5e', 
    bgClass: 'bg-rose-500', 
    textClass: 'text-rose-500', 
    lightBg: 'bg-rose-50', 
    border: 'border-rose-200' 
  },
  amber: { 
    color: '#f59e0b', 
    bgClass: 'bg-amber-500', 
    textClass: 'text-amber-500', 
    lightBg: 'bg-amber-50', 
    border: 'border-amber-200' 
  },
  sky: { 
    color: '#0ea5e9', 
    bgClass: 'bg-sky-500', 
    textClass: 'text-sky-500', 
    lightBg: 'bg-sky-50', 
    border: 'border-sky-200' 
  },
  violet: { 
    color: '#8b5cf6', 
    bgClass: 'bg-violet-500', 
    textClass: 'text-violet-500', 
    lightBg: 'bg-violet-50', 
    border: 'border-violet-200' 
  },
};

export const DEFAULT_PROFILES: Record<string, Profile> = {
  pea: { id: 'pea', name: 'Pea', theme: 'pink', emoji: '🌸', pin: null },
  cam: { id: 'cam', name: 'Cam', theme: 'green', emoji: '📸', pin: null }
};

