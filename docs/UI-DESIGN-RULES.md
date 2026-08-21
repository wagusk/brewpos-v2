# Brew-POS v2 — UI Design Rules (Summary Pointer)

> **STATUS: SUPERSEDED (2026-08-21)**

This file was previously a summary pointer to
[`UI-DESIGN-RULE.md`](./UI-DESIGN-RULE.md). Both documents describe a
design system (POSCard / POSButton / POSChip / POSIcon / POSTextField +
`monoTheme.tsx`) that was **never adopted** in the actual frontend
codebase. They are preserved here for historical context only.

## Where to look instead

For the **current** UI conventions, see:

- `AI-REFERENCE.md` — section "UI Conventions (current, not MUI)"
- `frontend/src/styles.css` — semantic CSS classes actually used
- `frontend/src/theme.ts` — runtime-adjustable UI tokens
- `frontend/src/App.tsx` — router shell with the active component tree
- `frontend/src/screens/*.tsx` — the per-screen modules

The planned-but-unimplemented component stubs are in
`frontend/src/components/` (5–8 line re-exports, not imported anywhere).

## Why the change

The MUI-based design system was planned in the v1 design rule but the
implementation chose a lighter approach: raw HTML elements + semantic
CSS classes + `lucide-react` icons. The actual approach is smaller,
faster to build, and easier to maintain for a small team. It can be
extended later if a richer component system becomes worth the
dependency cost.
