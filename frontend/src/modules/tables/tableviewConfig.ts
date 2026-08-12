/**
 * tableviewConfig — data-driven display config for the TableView screen.
 *
 * No hardcoded field choices in the page: which fields appear on a tile,
 * their order, and their labels are all here. Same pattern as the cashier
 * layout config — persisted in localStorage so the user can tune the
 * overview at runtime.
 *
 * Why data-driven:
 *   - The requirement says table layout / sections / statuses / displayed
 *     information must be configurable, not hardcoded.
 *   - Toggles let staff hide noisy fields on small screens and reveal
 *     revenue / payment info on the cashier screen.
 *   - Defaults cover the common case (name + seats + status + total).
 *
 * Theme-token-driven:
 *   - Status / payment colors reference `monoTheme` tokens (e.g.
 *     `statusPending`, `success`, `error`), NOT raw hex. Components
 *     resolve the token at render time so the UI Settings page can
 *     retheme everything without code changes.
 */

import { useState, useEffect, useCallback } from 'react';
import type { MonoTheme } from '../../core/theme/monoTheme';

export interface TableViewField {
  key:
    | 'name'
    | 'seats'
    | 'status'
    | 'orderNumber'
    | 'itemsCount'
    | 'orderTotal'
    | 'paidAmount'
    | 'outstanding'
    | 'server'
    | 'openedTime'
    | 'occupancy'
    | 'paymentStatus';
  label: string;        // i18n key
  defaultVisible: boolean;
  /** Field categories used by the toggle panel */
  group: 'identity' | 'bill' | 'payment' | 'service';
}

export const FIELDS: TableViewField[] = [
  { key: 'name',           label: 'tablesview.field.name',     defaultVisible: true,  group: 'identity' },
  { key: 'seats',          label: 'tablesview.field.seats',    defaultVisible: true,  group: 'identity' },
  { key: 'status',         label: 'tablesview.field.status',   defaultVisible: true,  group: 'bill' },
  { key: 'orderNumber',    label: 'tablesview.field.orderNo',  defaultVisible: true,  group: 'bill' },
  { key: 'itemsCount',     label: 'tablesview.field.items',    defaultVisible: true,  group: 'bill' },
  { key: 'orderTotal',     label: 'tablesview.field.total',    defaultVisible: true,  group: 'bill' },
  { key: 'openedTime',     label: 'tablesview.field.opened',   defaultVisible: false, group: 'bill' },
  { key: 'occupancy',      label: 'tablesview.field.occupancy', defaultVisible: true, group: 'bill' },
  { key: 'server',         label: 'tablesview.field.server',   defaultVisible: false, group: 'service' },
  { key: 'paymentStatus',  label: 'tablesview.field.payStatus', defaultVisible: true, group: 'payment' },
  { key: 'paidAmount',     label: 'tablesview.field.paid',     defaultVisible: false, group: 'payment' },
  { key: 'outstanding',    label: 'tablesview.field.outstanding', defaultVisible: true, group: 'payment' },
];

export interface TableViewConfig {
  /** Which fields are visible on each tile (in declaration order). */
  visibleFields: TableViewField['key'][];
  /** Show sections as collapsible groups (vs always-expanded). */
  collapsible: boolean;
  /** Section filter chips at the top. */
  showSectionFilter: boolean;
  /** Header counters (free / occupied / partial / paid). */
  showCounters: boolean;
  /** Group tiles by section. If false, all tables in a single grid. */
  groupBySection: boolean;
}

const STORAGE_KEY = 'brewpos_tablesview_layout';

const DEFAULTS: TableViewConfig = {
  visibleFields: FIELDS.filter((f) => f.defaultVisible).map((f) => f.key),
  collapsible: false,
  showSectionFilter: true,
  showCounters: true,
  groupBySection: true,
};

function load(): TableViewConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    const valid = FIELDS.map((f) => f.key);
    const visible = Array.isArray(parsed.visibleFields)
      ? parsed.visibleFields.filter((k: string) => valid.includes(k as any))
      : DEFAULTS.visibleFields;
    return {
      visibleFields: visible,
      collapsible: typeof parsed.collapsible === 'boolean' ? parsed.collapsible : DEFAULTS.collapsible,
      showSectionFilter: typeof parsed.showSectionFilter === 'boolean' ? parsed.showSectionFilter : DEFAULTS.showSectionFilter,
      showCounters: typeof parsed.showCounters === 'boolean' ? parsed.showCounters : DEFAULTS.showCounters,
      groupBySection: typeof parsed.groupBySection === 'boolean' ? parsed.groupBySection : DEFAULTS.groupBySection,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(cfg: TableViewConfig): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {}
}

let currentConfig: TableViewConfig = load();

const listeners = new Set<(c: TableViewConfig) => void>();

function emit(): void {
  listeners.forEach((l) => l(currentConfig));
}

export function getTableViewConfig(): TableViewConfig {
  return currentConfig;
}

export function setTableViewConfig(patch: Partial<TableViewConfig>): void {
  currentConfig = { ...currentConfig, ...patch };
  save(currentConfig);
  emit();
}

export function resetTableViewConfig(): void {
  currentConfig = DEFAULTS;
  save(currentConfig);
  emit();
}

export function useTableViewConfig(): {
  config: TableViewConfig;
  setConfig: (patch: Partial<TableViewConfig>) => void;
  reset: () => void;
  toggleField: (key: TableViewField['key']) => void;
} {
  const [config, setLocal] = useState<TableViewConfig>(currentConfig);

  useEffect(() => {
    const onChange = (next: TableViewConfig): void => setLocal(next);
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }, []);

  const setConfig = useCallback((patch: Partial<TableViewConfig>): void => {
    setTableViewConfig(patch);
  }, []);

  const reset = useCallback((): void => {
    resetTableViewConfig();
  }, []);

  const toggleField = useCallback((key: TableViewField['key']): void => {
    // Always keep 'name' and 'status' visible so the tile stays readable.
    if (key === 'name' || key === 'status') return;
    const has = currentConfig.visibleFields.includes(key);
    const next = has
      ? currentConfig.visibleFields.filter((k) => k !== key)
      : [...currentConfig.visibleFields, key];
    setTableViewConfig({ visibleFields: next });
  }, []);

  return { config, setConfig, reset, toggleField };
}

export const TABLEVIEW_DEFAULTS = DEFAULTS;

/* ────────────────────────────────────────────────────────────────
 *  Status color/label map — token-driven.
 *
 *  `colorToken` is a key on `MonoTheme` (e.g. 'success', 'statusPending',
 *  'error'). The tile / chip resolves the actual color via `c[colorToken]`
 *  at render time. Adding a new order state in the backend just means
 *  adding a row here; unknown statuses fall back to `c.muted`.
 * ──────────────────────────────────────────────────────────────── */

/** A key into `MonoTheme` that resolves to a color string. */
export type ThemeColorToken = keyof Pick<
  MonoTheme,
  | 'muted'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'statusPending'
  | 'statusAccepted'
  | 'statusPreparing'
  | 'statusReady'
  | 'statusServed'
  | 'statusVoid'
>;

export interface TableStatusInfo {
  /** Token name on MonoTheme. Resolve with `c[colorToken]` at render. */
  colorToken: ThemeColorToken;
  /** i18n key — components call `t(labelKey)`. */
  labelKey: string;
  /** True for states where the table can take a new order. */
  isAvailable: boolean;
}

export const STATUS_MAP: Record<string, TableStatusInfo> = {
  free:      { colorToken: 'success',    labelKey: 'tablesview.status.free',      isAvailable: true  },
  open:      { colorToken: 'statusPending',  labelKey: 'tablesview.status.open',  isAvailable: false },
  accepted:  { colorToken: 'statusAccepted', labelKey: 'tablesview.status.accepted', isAvailable: false },
  preparing: { colorToken: 'statusPreparing', labelKey: 'tablesview.status.preparing', isAvailable: false },
  ready:     { colorToken: 'statusReady', labelKey: 'tablesview.status.ready',     isAvailable: false },
  served:    { colorToken: 'statusServed', labelKey: 'tablesview.status.served',   isAvailable: false },
  paid:      { colorToken: 'success',    labelKey: 'tablesview.status.paid',      isAvailable: true  },
  void:      { colorToken: 'statusVoid', labelKey: 'tablesview.status.void',      isAvailable: true  },
};

const FALLBACK_STATUS: TableStatusInfo = {
  colorToken: 'muted',
  labelKey: 'tablesview.status.unknown',
  isAvailable: true,
};

export function getStatusInfo(status: string | null | undefined): TableStatusInfo {
  if (!status) return STATUS_MAP.free;
  return STATUS_MAP[status] || FALLBACK_STATUS;
}

/** Payment status (orthogonal to order status). */

export interface PaymentStatusInfo {
  colorToken: ThemeColorToken;
  labelKey: string;
}

export const PAYMENT_STATUS_MAP: Record<string, PaymentStatusInfo> = {
  unpaid:  { colorToken: 'error',   labelKey: 'tablesview.payment.unpaid'  },
  partial: { colorToken: 'warning', labelKey: 'tablesview.payment.partial' },
  paid:    { colorToken: 'success', labelKey: 'tablesview.payment.paid'    },
};

const FALLBACK_PAYMENT: PaymentStatusInfo = {
  colorToken: 'muted',
  labelKey: 'tablesview.payment.unknown',
};

export function getPaymentInfo(status: string | null | undefined): PaymentStatusInfo | null {
  if (!status) return null;
  return PAYMENT_STATUS_MAP[status] || FALLBACK_PAYMENT;
}
