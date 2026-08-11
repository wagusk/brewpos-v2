/**
 * Cashier layout config — persisted, live-adjustable dimensions.
 *
 * Defaults are derived from sensible values; nothing hardcoded into
 * components. The cashier page (gear popup) and Settings page can
 * override any value via sliders; changes apply immediately.
 */

import { useState, useEffect, useCallback } from 'react';

export interface CashierLayoutConfig {
  /** Floor plan: width of the left "selected table bill" column (px). 240–800. */
  floorLeftWidth: number;
  /** Floor plan: each table tile height (px). 80–180. */
  floorTileHeight: number;
  /** Floor plan: gap between table tiles (px). 4–24. */
  floorGap: number;
  /** Floor plan: table tile min width (px). 80–240. */
  floorTileMin: number;
  /** Floor plan: header strip height (px). 48–96. */
  headerHeight: number;
}

const STORAGE_KEY = 'brewpos_cashier_layout';

const DEFAULTS: CashierLayoutConfig = {
  floorLeftWidth: 420,
  floorTileHeight: 110,
  floorGap: 12,
  floorTileMin: 140,
  headerHeight: 64,
};

function load(): CashierLayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    // Drop obsolete keys from earlier iterations (cartWidth, menuTileMin,
    // tileGap, cartRowHeight, productTileHeight) — they're no longer used
    // after the cashier page switched to floor-plan mode.
    const { cartWidth, menuTileMin, tileGap, cartRowHeight, productTileHeight, ...rest } = parsed;
    return { ...DEFAULTS, ...rest };
  } catch {
    return DEFAULTS;
  }
}

function save(cfg: CashierLayoutConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

type Listener = (cfg: CashierLayoutConfig) => void;
const listeners = new Set<Listener>();

let currentConfig: CashierLayoutConfig = load();
function setCurrentConfig(next: CashierLayoutConfig): void {
  currentConfig = next;
  save(next);
  listeners.forEach((l) => l(next));
}

export function getCashierLayout(): CashierLayoutConfig {
  return currentConfig;
}

export function setCashierLayout(patch: Partial<CashierLayoutConfig>): void {
  setCurrentConfig({ ...currentConfig, ...patch });
}

export function resetCashierLayout(): void {
  setCurrentConfig(DEFAULTS);
}

export function useCashierLayout(): {
  config: CashierLayoutConfig;
  setLayout: (patch: Partial<CashierLayoutConfig>) => void;
  reset: () => void;
} {
  const [config, setConfig] = useState<CashierLayoutConfig>(currentConfig);

  useEffect(() => {
    const onChange = (next: CashierLayoutConfig): void => setConfig(next);
    listeners.add(onChange);
    const fresh = load();
    if (JSON.stringify(fresh) !== JSON.stringify(config)) setConfig(fresh);
    return () => {
      listeners.delete(onChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLayout = useCallback((patch: Partial<CashierLayoutConfig>): void => {
    setCashierLayout(patch);
  }, []);

  const reset = useCallback((): void => {
    resetCashierLayout();
  }, []);

  return { config, setLayout, reset };
}

export const CASHIER_LAYOUT_DEFAULTS = DEFAULTS;
