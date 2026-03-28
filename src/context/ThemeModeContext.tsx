import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type UiThemeMode = 'nebula' | 'ember';

const STORAGE_KEY = 'moneymates_ui_theme';

interface ThemeModeContextValue {
  mode: UiThemeMode;
  setMode: (m: UiThemeMode) => void;
  toggle: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function readStored(): UiThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ember' || v === 'nebula') return v;
  } catch {
    /* ignore */
  }
  return 'nebula';
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UiThemeMode>(() =>
    typeof window !== 'undefined' ? readStored() : 'nebula'
  );

  const setMode = useCallback((m: UiThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'nebula' ? 'ember' : 'nebula');
  }, [mode, setMode]);

  useEffect(() => {
    document.documentElement.dataset.uiTheme = mode;
    const color = mode === 'nebula' ? '#050508' : '#140808';
    document.getElementById('theme-color-meta')?.setAttribute('content', color);
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  return (
    <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}
