# Brew-POS v2 — UI Design Rule

> **This file is a summary pointer.** The canonical, authoritative document is
> **[`UI-DESIGN-RULE.md`](./UI-DESIGN-RULE.md)** (v1.0, ACTIVE). Read it before
> any UI work. The summary below mirrors its core tenets for quick reference.

---

## Core tenets

1. **Unified visual language** — every visible element belongs to a deliberate,
   bounded component. No loose text. No floating labels. No stray elements.
2. **Card-based, touch-first surfaces** — POSCard / POSButton / POSTextField /
   POSChip / POSIcon (exported from `@/components`). No raw `<div>`, `<button>`,
   `<input>`, or MUI primitives for interactive surfaces.
3. **Minimal text, maximum clarity** — icons + color + hierarchy over verbose
   labels. One action per card when possible.
4. **Solid, color-coded, accessible** — playful but professional palette with
   sufficient contrast (4.5:1 text, 3:1 disabled). Status / category / state
   distinguished by color, not by text.
5. **Centralized configuration** — zero hardcoded colors, sizes, radii, padding,
   font sizes, or labels in page components. Every value flows from
   `useTheme()` (`core/theme/monoTheme.tsx`). Adjustable at runtime via the
   UI Settings page — no code changes to retheme.

## Forbidden patterns

- Raw `<div style={{...}}>` for interactive surfaces → use `<POSCard>`.
- Raw `<button>` → `<POSButton>`.
- Raw `<input>` / MUI `<TextField>` → `<POSTextField>`.
- Raw MUI `<Chip>` → `<POSChip>` with semantic variant (`status` / `station` /
  `payment` / `category`).
- Raw MUI icons without `<POSIcon>` wrapper.
- Hardcoded hex / px / rem in style props → `c.colorName` / `c.ui.token` /
  `c.fontSize('key')`.
- Hardcoded labels in JSX → `t('i18n.key')` (English source in `en.ts`,
  translations in `id.ts`).

## Component map (canonical)

| Need | Component | Import |
|---|---|---|
| Container / surface | `<POSCard>` | `@/components` |
| Action | `<POSButton>` | `@/components` |
| Input | `<POSTextField>` | `@/components` |
| Status / label / tag | `<POSChip>` | `@/components` |
| Icon | `<POSIcon>` | `@/components` |
| Theme tokens | `useTheme()` | `@/core/theme` |
| i18n | `t()`, `useLocale()` | `@/modules/multilingual/i18n` |

## Migration tracking

See **[`UI-DESIGN-AUDIT-REPORT.md`](./UI-DESIGN-AUDIT-REPORT.md)** for the
per-file violation list and milestone-by-milestone compliance progress.

## Authority

If this summary and `UI-DESIGN-RULE.md` ever disagree, **`UI-DESIGN-RULE.md`
wins.** Update this file to match; never the other way around.
