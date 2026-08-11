import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Centralized UI settings — NO hardcoded values in pages.
// Adjust these at runtime via the UI Settings page.

export interface UITokens {
  // Font size scale (multiplier)
  fontScale: number;
  // Button sizing
  buttonMinHeight: number;
  buttonRadius: number;
  buttonPaddingX: number;
  buttonPaddingY: number;
  // Input sizing
  inputRadius: number;
  inputPaddingX: number;
  inputPaddingY: number;
  // Card sizing
  cardRadius: number;
  cardShadow: string;
  // Touch target safety (min hit target)
  minTouchTarget: number;
  // Sidebar width
  sidebarWidth: number;
  // Top bar height
  barHeight: number;
  // Bottom navigation bar height
  bottomBarHeight: number;
  // Animation duration (0 = no animation)
  animationDuration: number;
  // Card spacing
  cardGap: number;
  // Icon size (rem)
  iconSize: number;
  // List item gap
  listGap: number;
  // Reduced motion
  reducedMotion: boolean;
}

export interface MonoTheme {
  // Colors
  page: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  text: string;
  subtext: string;
  muted: string;
  divider: string;
  button: string;
  buttonText: string;
  buttonHover: string;
  buttonBorder: string;
  chip: string;
  chipActive: string;
  chipActiveText: string;
  chipBorder: string;
  input: string;
  inputBorder: string;
  inputText: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  warning: string;
  success: string;
  info: string;
  // Domain colors (station badge colors)
  stationKitchen: string;
  stationBar: string;
  stationBoth: string;
  // UI tokens (size, spacing, motion)
  ui: UITokens;
  // Computed font sizes (from ui.fontScale)
  fontSize: (size: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'subtitle1' | 'subtitle2') => string;
  // Actions
  setUI: (patch: Partial<UITokens>) => void;
  resetUI: () => void;
}

const BASE_FONT_SIZES = {
  h1: 2.125,
  h2: 1.5,
  h3: 1.25,
  h4: 1.125,
  h5: 1.0,
  h6: 0.875,
  body1: 0.875,
  body2: 0.8125,
  caption: 0.75,
  subtitle1: 0.875,
  subtitle2: 0.8125,
};

const DEFAULT_UI: UITokens = {
  fontScale: 1,
  buttonMinHeight: 64,
  buttonRadius: 16,
  buttonPaddingX: 16,
  buttonPaddingY: 8,
  inputRadius: 12,
  inputPaddingX: 12,
  inputPaddingY: 8,
  cardRadius: 16,
  cardShadow: '0 8px 32px rgba(0,0,0,0.15)',
  minTouchTarget: 48,
  sidebarWidth: 70,
  barHeight: 64,
  bottomBarHeight: 80,
  animationDuration: 0,
  cardGap: 12,
  iconSize: 1.5,
  listGap: 6,
  reducedMotion: false,
};

const COLORS = {
  page: '#f0f0f0',
  card: '#fff',
  cardBorder: '#d0d0d0',
  cardHover: '#f5f5f5',
  text: '#000',
  subtext: '#333',
  muted: '#666',
  divider: '#d0d0d0',
  button: '#222',
  buttonText: '#fff',
  buttonHover: '#000',
  buttonBorder: '#999',
  chip: '#e0e0e0',
  chipActive: '#222',
  chipActiveText: '#fff',
  chipBorder: '#999',
  input: '#e0e0e0',
  inputBorder: '#999',
  inputText: '#000',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  errorText: '#b91c1c',
  warning: '#b45309',
  success: '#047857',
  info: '#1d4ed8',
  stationKitchen: '#9a3412',
  stationBar: '#0e7490',
  stationBoth: '#c2410c',
};

const UI_STORAGE_KEY = 'brewpos_ui';

const MonoThemeContext = createContext<MonoTheme | null>(null);

export function createMUITheme(ui: UITokens) {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#4f46e5',
      },
      secondary: {
        main: '#db2777',
      },
      background: {
        default: '#f0f0f0',
        paper: '#ffffff',
      },
      text: {
        primary: '#000',
        secondary: '#333',
      },
      divider: '#d0d0d0',
    },
    shape: {
      borderRadius: ui.cardRadius,
    },
    typography: {
      fontSize: 14 * ui.fontScale,
    },
  });
}

export function MonoThemeProvider({ children }: { children: ReactNode }) {
  const [ui, setUIState] = useState<UITokens>(() => {
    try {
      const stored = localStorage.getItem(UI_STORAGE_KEY);
      if (stored) return { ...DEFAULT_UI, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_UI;
  });

  useEffect(() => {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(ui));
  }, [ui]);

  const setUI = (patch: Partial<UITokens>) => setUIState(prev => ({ ...prev, ...patch }));
  const resetUI = () => setUIState(DEFAULT_UI);

  const fontSize = (size: keyof typeof BASE_FONT_SIZES) =>
    `${BASE_FONT_SIZES[size] * ui.fontScale}rem`;

  const value: MonoTheme = {
    ...COLORS,
    ui,
    fontSize,
    setUI,
    resetUI,
  };

  return (
    <MonoThemeContext.Provider value={value}>
      <ThemeProvider theme={createMUITheme(ui)}>
        {children}
      </ThemeProvider>
    </MonoThemeContext.Provider>
  );
}

export function useTheme(): MonoTheme {
  const ctx = useContext(MonoThemeContext);
  if (!ctx) {
    return {
      ...COLORS,
      ui: DEFAULT_UI,
      fontSize: (size) => `${BASE_FONT_SIZES[size]}rem`,
      setUI: () => {},
      resetUI: () => {},
    };
  }
  return ctx;
}

export const DEFAULT_UI_TOKENS = DEFAULT_UI;
export const BASE_FONT_SIZES_LIST = BASE_FONT_SIZES;
