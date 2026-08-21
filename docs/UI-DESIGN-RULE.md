# Brew-POS v2 — UI Design Rule: Superseded

> **STATUS: SUPERSEDED (2026-08-21)**
> **This document describes a design system that was never adopted in the
> actual codebase.** It is preserved here for historical context. New work
> should follow the conventions described in the **current** UI reference:
> `AI-REFERENCE.md` (section "UI Conventions (current, not MUI)").

The "POSCard / POSButton / POSTextField / POSChip / POSIcon" component
catalog below describes an MUI-based design system with `monoTheme.tsx`
that was planned but never implemented. The actual frontend uses raw HTML
elements with semantic CSS classes defined in `frontend/src/styles.css`
and runtime-adjustable tokens from `frontend/src/theme.ts`. Icons come
from `lucide-react`.

Stub files for the planned components still exist in
`frontend/src/components/` (POSCard.tsx, POSButton.tsx, etc.) as 5–8
line re-exports, but they are **not imported anywhere in active code**.

## What replaced it

- **CSS classes**: see `frontend/src/styles.css` for the canonical list
  (`.panel`, `.metric`, `.setting-value`, `.admin-workspace`,
  `.admin-menu-column`, `.admin-menu-item`, `.modal-backdrop`, `.modal`,
  `.table-wrap`, `.button-row`, etc.)
- **Theme tokens**: `frontend/src/theme.ts` `UISettings` interface +
  `DEFAULT_UI` constant; applied via CSS custom properties
  (`--ui-card-radius`, `--ui-button-radius`, etc.) in `styles.css`.
- **Icons**: `import { Plus, RefreshCw, ... } from "lucide-react"` —
  raw icon components used directly, no wrapper.

## Original content (preserved for history only)

The rest of this file is the v1.0 design rule as written on 2026-08-12.
It is not the source of truth. For migration tracking see the original
`UI-DESIGN-AUDIT-REPORT.md`, also superseded.

---

# Original v1.0 design rule (historical, do not follow)

## 1. Core Principle

**Every visible UI element must belong to a deliberate, bounded component.**

No loose text. No floating labels. No controls without visual containers.
No unexplained stray elements. Every pixel serves a purpose within a
card-based, touch-first interface.

## 2. Design Pillars

### 2.1 Card-Based Surfaces

Every interactive element, status indicator, label, and content block lives
inside a card or card-derived container.

### 2.2 Touch-First Hierarchy

- Minimum touch target: 48×48px
- Default button height: 64px
- Generous spacing between interactive elements

### 2.3 Minimal Text, Maximum Clarity

Use only text necessary for the current action.

### 2.4 Centralized Configuration

Zero hardcoded values in page components.

## 3. Component Catalog (planned, never adopted)

All components were planned to live in `frontend/src/components/`.

### 3.1 POSCard (planned)

Container for tiles, sections, input wrappers.

### 3.2 POSButton (planned)

All interactive actions.

### 3.3 POSTextField (planned)

All text/number inputs.

### 3.4 POSChip (planned)

Status badges, labels, tags.

### 3.5 POSIcon (planned)

Icon wrapper with consistent sizing.

## Authority

If this document and the actual code disagree, **the actual code wins**.
Refer to `AI-REFERENCE.md` and `frontend/src/styles.css` for current UI
conventions.
