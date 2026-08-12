import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Centralized UI settings — NO hardcoded values in pages.
// Adjust these at runtime via the UI Settings page.

export interface UITokens {
  // Font size scale (multiplier)
  fontScale: number;
  // Button sizing
  buttonMinHeight: number;
  buttonMinWidth: number;
  buttonRadius: number;
  buttonPaddingX: number;
  buttonPaddingY: number;
  buttonFontSize: number;
  // Input sizing
  inputRadius: number;
  inputPaddingX: number;
  inputPaddingY: number;
  inputMinHeight: number;
  inputFontSize: number;
  // Card sizing
  cardRadius: number;
  cardShadow: string;
  cardShadowHover: string;
  cardPadding: number;
  cardMinHeight: number;
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
  // Spacing scale (base unit for all spacing)
  spacingBase: number;
  // Card spacing
  cardGap: number;
  // Icon size (rem)
  iconSize: number;
  iconSizeLarge: number;
  iconSizeSmall: number;
  // List item gap
  listGap: number;
  // Chip sizing
  chipMinHeight: number;
  chipRadius: number;
  chipPadding: number;
  // Surface/elevation levels
  elevationShadow: Record<'sm' | 'md' | 'lg' | 'xl', string>;
  // Reduced motion
  reducedMotion: boolean;
}

export interface MonoTheme {
  // Core colors
  page: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  text: string;
  subtext: string;
  muted: string;
  divider: string;
  // Modal/dialog backdrop scrim — semi-transparent overlay
  overlay: string;

  // Button colors (configurable for primary/secondary actions)
  button: string;
  buttonText: string;
  buttonHover: string;
  buttonBorder: string;
  buttonDisabled: string;
  buttonDisabledText: string;
  
  // Secondary button
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonSecondaryHover: string;
  
  // Chip/badge colors
  chip: string;
  chipActive: string;
  chipActiveText: string;
  chipBorder: string;
  chipDisabled: string;
  
  // Input colors
  input: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputText: string;
  inputPlaceholder: string;
  inputDisabled: string;
  
  // Semantic intent colors
  success: string;
  successLight: string;
  successDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  
  // Station/domain colors
  stationKitchen: string;
  stationKitchenLight: string;
  stationBar: string;
  stationBarLight: string;
  stationBoth: string;
  stationBothLight: string;
  
  // Status/payment colors
  statusPending: string;
  statusAccepted: string;
  statusPreparing: string;
  statusReady: string;
  statusServed: string;
  statusVoid: string;
  
  paymentCash: string;
  paymentCard: string;
  paymentMobile: string;
  
  // UI tokens (size, spacing, motion)
  ui: UITokens;
  
  // Computed font sizes (from ui.fontScale)
  fontSize: (size: keyof typeof BASE_FONT_SIZES) => string;
  
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
  buttonMinWidth: 64,
  buttonRadius: 16,
  buttonPaddingX: 16,
  buttonPaddingY: 8,
  buttonFontSize: 1,
  inputRadius: 12,
  inputPaddingX: 12,
  inputPaddingY: 10,
  inputMinHeight: 48,
  inputFontSize: 0.875,
  cardRadius: 16,
  cardShadow: '0 4px 16px rgba(0,0,0,0.08)',
  cardShadowHover: '0 8px 32px rgba(0,0,0,0.15)',
  cardPadding: 16,
  cardMinHeight: 80,
  minTouchTarget: 48,
  sidebarWidth: 70,
  barHeight: 64,
  bottomBarHeight: 80,
  animationDuration: 200,
  spacingBase: 8,
  cardGap: 12,
  iconSize: 1.5,
  iconSizeLarge: 2.5,
  iconSizeSmall: 1,
  listGap: 6,
  chipMinHeight: 36,
  chipRadius: 20,
  chipPadding: 8,
  elevationShadow: {
    sm: '0 2px 8px rgba(0,0,0,0.06)',
    md: '0 4px 16px rgba(0,0,0,0.08)',
    lg: '0 8px 32px rgba(0,0,0,0.15)',
    xl: '0 12px 48px rgba(0,0,0,0.20)',
  },
  reducedMotion: false,
};

const COLORS = {
  // Core/neutral colors
  page: '#f8f8f8',
  card: '#ffffff',
  cardBorder: '#e5e5e5',
  cardHover: '#fafafa',
  text: '#1a1a1a',
  subtext: '#4a4a4a',
  muted: '#757575',
  divider: '#e5e5e5',
  // Modal/dialog backdrop scrim — semi-transparent overlay
  overlay: 'rgba(26, 26, 26, 0.5)',

  // Button colors (primary action)
  button: '#2563eb',
  buttonText: '#ffffff',
  buttonHover: '#1d4ed8',
  buttonBorder: '#2563eb',
  buttonDisabled: '#d1d5db',
  buttonDisabledText: '#9ca3af',
  
  // Secondary button
  buttonSecondary: '#e5e7eb',
  buttonSecondaryText: '#374151',
  buttonSecondaryHover: '#d1d5db',
  
  // Chip/badge colors
  chip: '#e5e7eb',
  chipActive: '#2563eb',
  chipActiveText: '#ffffff',
  chipBorder: '#d1d5db',
  chipDisabled: '#f3f4f6',
  
  // Input colors
  input: '#f3f4f6',
  inputBorder: '#d1d5db',
  inputBorderFocus: '#2563eb',
  inputText: '#1a1a1a',
  inputPlaceholder: '#9ca3af',
  inputDisabled: '#f9fafb',
  
  // Success (green) - for completed orders, successful actions
  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#059669',
  
  // Error (red) - for failures, void, issues
  error: '#ef4444',
  errorLight: '#fee2e2',
  errorDark: '#dc2626',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  errorText: '#991b1b',
  
  // Warning (amber) - for pending actions, caution
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#d97706',
  
  // Info (blue) - for informational content
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#1d4ed8',
  
  // Station colors (kitchen, bar, both)
  stationKitchen: '#ea580c',
  stationKitchenLight: '#fef3c7',
  stationBar: '#0891b2',
  stationBarLight: '#cffafe',
  stationBoth: '#c2410c',
  stationBothLight: '#fed7aa',
  
  // Status colors (order lifecycle)
  statusPending: '#f59e0b',
  statusAccepted: '#3b82f6',
  statusPreparing: '#8b5cf6',
  statusReady: '#10b981',
  statusServed: '#6b7280',
  statusVoid: '#ef4444',
  
  // Payment method colors
  paymentCash: '#84cc16',
  paymentCard: '#6366f1',
  paymentMobile: '#ec4899',
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
