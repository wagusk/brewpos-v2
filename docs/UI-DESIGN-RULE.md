# Brew-POS v2 — UI Design Rule: Unified Visual Language

> Version: 1.0  
> Last Updated: 2026-08-12  
> Status: ACTIVE

---

## 1. Core Principle

**Every visible UI element must belong to a deliberate, bounded component.**

No loose text. No floating labels. No controls without visual containers. No unexplained stray elements. Every pixel serves a purpose within a card-based, touch-first interface.

---

## 2. Design Pillars

### 2.1 Card-Based Surfaces
Every interactive element, status indicator, label, and content block lives inside a card or card-derived container (button, chip, input field). Cards provide:
- Clear visual boundaries
- Consistent padding and spacing
- Unified hover/selected/disabled states
- Predictable touch targets

### 2.2 Touch-First Hierarchy
- **Minimum touch target: 48×48px** (configurable via `ui.minTouchTarget`)
- **Default button height: 64px** (configurable via `ui.buttonMinHeight`)
- Generous spacing between interactive elements (`ui.cardGap`)
- No hover-dependent interactions for primary actions

### 2.3 Minimal Text, Maximum Clarity
- Use only text necessary for the current action
- Rely on icons + visual hierarchy over verbose labels
- Color-coding replaces text for status, category, and state
- One action per card when possible

### 2.4 Centralized Configuration
- **Zero hardcoded values** in page components
- All dimensions, colors, radii, spacing, and behavior flow from `monoTheme.tsx`
- Runtime customization via UI Settings page
- Theme tokens are the single source of truth

---

## 3. Component Catalog

All components live in `frontend/src/components/` and are exported from `components/index.ts`.

### 3.1 POSCard
The foundational container. Used for buttons, tiles, input wrappers, status badges, content sections.

```tsx
import { POSCard } from '@/components'

<POSCard
  variant="default"      // 'default' | 'elevated' | 'outlined'
  clickable={true}       // Adds hover + cursor pointer
  selected={false}       // Highlights as selected
  disabled={false}       // Dims + disables interaction
  elevation="md"         // 'sm' | 'md' | 'lg' | 'xl'
  padding="md"           // 'sm' | 'md' | 'lg' | number
  minHeight={80}         // number | 'auto'
  onClick={() => {}}
/>
```

**Rules:**
- Every grid item, menu item, order tile, table tile, and action surface MUST use POSCard
- Never use raw `<div>` with manual styling for containers
- Use `clickable` prop instead of manual cursor/hover styles

### 3.2 POSButton
All interactive actions use POSButton. No raw `<button>` elements.

```tsx
import { POSButton } from '@/components'

<POSButton
  variant="primary"      // 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline'
  size="lg"              // 'sm' | 'md' | 'lg' | 'xl'
  onClick={() => {}}
  disabled={false}
  loading={false}
  fullWidth={false}
  icon={<AddIcon />}
  iconPosition="left"
>
  Add Item
</POSButton>
```

**Rules:**
- Primary actions: `variant="primary"` (blue, solid fill)
- Destructive actions: `variant="danger"` (red, solid fill)
- Confirmation: `variant="success"` (green, solid fill)
- Secondary/optional: `variant="secondary"` (gray, solid fill)
- Minimal/icon-only: `variant="ghost"` or `variant="outline"`
- Default size for main actions: `size="lg"` (64px height)

### 3.3 POSTextField
All text/number inputs use POSTextField. No raw `<input>` elements.

```tsx
import { POSTextField } from '@/components'

<POSTextField
  variant="default"      // 'default' | 'search' | 'pin'
  size="md"              // 'sm' | 'md' | 'lg'
  label="Table Number"
  placeholder="Enter number"
  value={value}
  onChange={setValue}
  icon={<TableIcon />}
  error="Required field"
  fullWidth
/>
```

**Rules:**
- Always include a label or placeholder
- Use `variant="search"` for search inputs
- Use `variant="pin"` for PIN/password entry
- Error state uses `error` prop, never manual border styling

### 3.4 POSChip
Badges, labels, status indicators, category tags, filter chips.

```tsx
import { POSChip } from '@/components'

<POSChip
  variant="status"       // 'default' | 'status' | 'station' | 'payment' | 'category'
  status="ready"         // For status variant
  stationType="kitchen"  // For station variant
  paymentType="cash"     // For payment variant
  selected={false}
  onClick={() => {}}
  size="md"
>
  Ready
</POSChip>
```

**Rules:**
- Order statuses: Always use `variant="status"` with the correct `status` value
- Kitchen/bar labels: Always use `variant="station"` with `stationType`
- Payment methods: Always use `variant="payment"` with `paymentType`
- Filter/category chips: Use `variant="default"` with `selected` prop

### 3.5 POSIcon
All icons pass through POSIcon for consistent sizing and color.

```tsx
import { POSIcon } from '@/components'

<POSIcon
  icon={<AddIcon />}
  size="md"              // 'sm' | 'md' | 'lg'
  variant="default"      // 'default' | 'muted' | 'success' | 'error' | 'warning' | 'info'
/>
```

**Rules:**
- Never import MUI icons directly into page components without POSIcon wrapper
- Use `variant` for semantic coloring (success = green, error = red, etc.)
- Use `size` consistently: `sm` (20px) for inline, `md` (24px) for buttons, `lg` (32px) for headers

---

## 4. Color System

All colors are centralized in `monoTheme.tsx` under the `COLORS` constant. Never reference raw hex values in components.

### 4.1 Core/Neutral Colors
| Token | Purpose | Default |
|-------|---------|---------|
| `page` | Page background | `#f8f8f8` |
| `card` | Card surface | `#ffffff` |
| `cardBorder` | Card border | `#e5e5e5` |
| `cardHover` | Card hover state | `#fafafa` |
| `text` | Primary text | `#1a1a1a` |
| `subtext` | Secondary text | `#4a4a4a` |
| `muted` | Disabled/tertiary text | `#757575` |
| `divider` | Divider lines | `#e5e5e5` |

### 4.2 Action Colors
| Token | Purpose | Default |
|-------|---------|---------|
| `button` | Primary action background | `#2563eb` |
| `buttonText` | Primary action text | `#ffffff` |
| `buttonHover` | Primary hover | `#1d4ed8` |
| `buttonSecondary` | Secondary action background | `#e5e7eb` |
| `buttonSecondaryText` | Secondary action text | `#374151` |
| `buttonSecondaryHover` | Secondary hover | `#d1d5db` |

### 4.3 Semantic Colors
| Token | Purpose | Default |
|-------|---------|---------|
| `success` | Completed, confirmed | `#10b981` |
| `successLight` | Success background | `#d1fae5` |
| `successDark` | Success hover | `#059669` |
| `error` | Failed, void, destructive | `#ef4444` |
| `errorLight` | Error background | `#fee2e2` |
| `errorDark` | Error hover | `#dc2626` |
| `warning` | Pending, caution | `#f59e0b` |
| `warningLight` | Warning background | `#fef3c7` |
| `warningDark` | Warning hover | `#d97706` |
| `info` | Informational | `#3b82f6` |
| `infoLight` | Info background | `#dbeafe` |
| `infoDark` | Info hover | `#1d4ed8` |

### 4.4 Domain Colors
| Token | Purpose | Default |
|-------|---------|---------|
| `stationKitchen` | Kitchen station | `#ea580c` |
| `stationKitchenLight` | Kitchen bg | `#fef3c7` |
| `stationBar` | Bar station | `#0891b2` |
| `stationBarLight` | Bar bg | `#cffafe` |
| `stationBoth` | Both stations | `#c2410c` |
| `stationBothLight` | Both bg | `#fed7aa` |

### 4.5 Status Colors (Order Lifecycle)
| Token | Status | Default |
|-------|--------|---------|
| `statusPending` | Awaiting acceptance | `#f59e0b` |
| `statusAccepted` | Acknowledged by station | `#3b82f6` |
| `statusPreparing` | Being made | `#8b5cf6` |
| `statusReady` | Ready to serve | `#10b981` |
| `statusServed` | Delivered to table | `#6b7280` |
| `statusVoid` | Cancelled/refunded | `#ef4444` |

### 4.6 Payment Method Colors
| Token | Method | Default |
|-------|--------|---------|
| `paymentCash` | Cash | `#84cc16` |
| `paymentCard` | Card | `#6366f1` |
| `paymentMobile` | Mobile/digital | `#ec4899` |

---

## 5. Spacing & Sizing System

All dimensions flow from `ui` tokens in `monoTheme.tsx`. The base unit is `ui.spacingBase` (default: 8px).

### 5.1 Typography Scale
Computed via `fontSize()` function with `ui.fontScale` multiplier.

| Key | Base (rem) | Use |
|-----|-----------|-----|
| `h1` | 2.125 | Page titles |
| `h2` | 1.5 | Section headings |
| `h3` | 1.25 | Subsection headings |
| `h4` | 1.125 | Card titles |
| `h5` | 1.0 | Small headings |
| `h6` | 0.875 | Labels |
| `body1` | 0.875 | Primary body text |
| `body2` | 0.8125 | Secondary body text |
| `caption` | 0.75 | Captions, helper text |

**Usage:**
```tsx
const c = useTheme();
<Typography sx={{ fontSize: c.fontSize('h4'), fontWeight: 700, color: c.text }}>
  Section Title
</Typography>
```

### 5.2 Component Sizing
| Token | Default | Range |
|-------|---------|-------|
| `buttonMinHeight` | 64px | 40–96px |
| `buttonMinWidth` | 64px | — |
| `buttonRadius` | 16px | 0–32px |
| `buttonPaddingX` | 16px | — |
| `buttonPaddingY` | 8px | — |
| `inputRadius` | 12px | 0–32px |
| `inputMinHeight` | 48px | — |
| `cardRadius` | 16px | 0–32px |
| `cardPadding` | 16px | — |
| `cardMinHeight` | 80px | — |
| `cardGap` | 12px | 4–32px |
| `chipMinHeight` | 36px | — |
| `chipRadius` | 20px | — |
| `minTouchTarget` | 48px | — |

### 5.3 Layout Tokens
| Token | Default | Range |
|-------|---------|-------|
| `sidebarWidth` | 70px | 56–120px |
| `barHeight` | 64px | 48–120px |
| `bottomBarHeight` | 80px | 56–120px |

### 5.4 Elevation (Shadows)
| Level | Token | Default |
|-------|-------|---------|
| Small | `elevationShadow.sm` | `0 2px 8px rgba(0,0,0,0.06)` |
| Medium | `elevationShadow.md` | `0 4px 16px rgba(0,0,0,0.08)` |
| Large | `elevationShadow.lg` | `0 8px 32px rgba(0,0,0,0.15)` |
| X-Large | `elevationShadow.xl` | `0 12px 48px rgba(0,0,0,0.20)` |

---

## 6. Interaction Patterns

### 6.1 Button States
Every button must support: `default`, `hover`, `active`, `disabled`, `loading`.

```tsx
// POSButton handles all states automatically
<POSButton loading={isSubmitting} disabled={!isValid} onClick={handleSubmit}>
  Place Order
</POSButton>
```

### 6.2 Card States
Cards support: `default`, `hover`, `selected`, `disabled`.

```tsx
<POSCard
  clickable
  selected={order.id === selectedOrderId}
  onClick={() => selectOrder(order.id)}
>
  <OrderTileContent order={order} />
</POSCard>
```

### 6.3 Input States
Inputs support: `default`, `focus`, `error`, `disabled`.

```tsx
<POSTextField
  error={fieldError || "Required"}
  value={value}
  onChange={setValue}
/>
```

### 6.4 Chip States
Chips support: `default`, `selected`, `disabled`, semantic color variants.

```tsx
<POSChip
  variant="status"
  status={order.status}
  size="sm"
>
  {t(`status.${order.status}`)}
</POSChip>
```

---

## 7. Layout Rules

### 7.1 TopBar Pattern
```
[Username (left)]  [Page Title (center)]  [Clock | Logout (right)]
```
- Height: `ui.barHeight` (default 64px)
- Fixed at top of viewport
- No interactive elements below fold

### 7.2 Three-Column POS Layout
```
[Sidebar]  [Main Content]  [Cart/Order Panel]
```
- Sidebar: `ui.sidebarWidth` (icon-only navigation)
- Main: Flex-1 (menu grid, admin forms, etc.)
- Cart: Fixed width (order summary, payment actions)

### 7.3 Grid Spacing
- Card grid gap: `ui.cardGap` (default 12px)
- List item gap: `ui.listGap` (default 6px)
- Base spacing unit: `ui.spacingBase` (default 8px)

### 7.4 Content Hierarchy
1. **Page title** — `fontSize('h2')`, bold, `text` color
2. **Section heading** — `fontSize('h4')`, bold, `text` color
3. **Card title** — `fontSize('h5')`, bold, `text` color
4. **Body text** — `fontSize('body1')`, `text` color
5. **Helper text** — `fontSize('caption')`, `subtext` or `muted` color
6. **Status/label** — POSChip with semantic color

---

## 8. Anti-Patterns (NEVER DO)

### ❌ Raw HTML Elements
```tsx
// BAD
<button onClick={handleClick}>Submit</button>
<div style={{ padding: 16, background: '#fff' }}>Content</div>
<input type="text" value={value} onChange={e => setValue(e.target.value)} />

// GOOD
<POSButton onClick={handleClick}>Submit</POSButton>
<POSCard padding="md">Content</POSCard>
<POSTextField value={value} onChange={setValue} />
```

### ❌ Hardcoded Colors
```tsx
// BAD
<div style={{ backgroundColor: '#2563eb' }}>
<Typography color="#4a4a4a">

// GOOD
<div style={{ backgroundColor: c.button }}>
<Typography color={c.subtext}>
```

### ❌ Hardcoded Dimensions
```tsx
// BAD
<div style={{ height: 64, borderRadius: 16, padding: 12 }}>

// GOOD
<div style={{ height: c.ui.buttonMinHeight, borderRadius: c.ui.cardRadius, padding: c.ui.cardPadding }}>
```

### ❌ Hardcoded Font Sizes
```tsx
// BAD
<Typography sx={{ fontSize: '14px' }}>

// GOOD
<Typography sx={{ fontSize: c.fontSize('body1') }}>
```

### ❌ Uncontained Text
```tsx
// BAD
<span>Status: Pending</span>
<p>Click here to proceed</p>

// GOOD
<POSChip variant="status" status="pending">Pending</POSChip>
<POSButton variant="primary" onClick={proceed}>Proceed</POSButton>
```

### ❌ Manual Icon Styling
```tsx
// BAD
<AddIcon sx={{ fontSize: 24, color: '#2563eb' }} />

// GOOD
<POSIcon icon={<AddIcon />} size="md" variant="info" />
```

---

## 9. Accessibility Requirements

### 9.1 Contrast Ratios
- Primary text on card: minimum 4.5:1
- Status chip text: minimum 4.5:1
- Disabled states: minimum 3:1 (for large text)

### 9.2 Touch Targets
- Minimum interactive element size: 48×48px (`ui.minTouchTarget`)
- Default button height: 64px (`ui.buttonMinHeight`)
- Spacing between interactive elements: minimum 8px

### 9.3 Keyboard Navigation
- All `POSCard` with `clickable={true}` must be focusable and respond to Enter/Space
- All `POSButton` elements are natively focusable
- All `POSChip` with `onClick` must be focusable

### 9.4 Screen Readers
- Use semantic HTML where possible
- Add `aria-label` for icon-only buttons
- Status chips should convey meaning through text, not color alone

---

## 10. Theme Customization

### 10.1 Runtime Settings (UI Settings Page)
Users can adjust at runtime without code changes:
- Font scale (0.8× – 1.6×)
- Button height (40–96px)
- Button corner radius (0–32px)
- Card radius (0–32px)
- Card gap (4–32px)
- Sidebar width (56–120px)
- Top bar height (48–120px)
- Bottom bar height (56–120px)
- Animation duration (0–500ms, 0 = static)

### 10.2 Persistence
All UI settings persist in `localStorage` under key `brewpos_ui`.

### 10.3 Reset
One-click reset to defaults via UI Settings page.

---

## 11. Implementation Checklist

When building or modifying any page:

- [ ] All containers use `POSCard`
- [ ] All buttons use `POSButton`
- [ ] All inputs use `POSTextField`
- [ ] All status/labels use `POSChip`
- [ ] All icons use `POSIcon`
- [ ] No hardcoded colors (use `c.colorName`)
- [ ] No hardcoded dimensions (use `c.ui.token`)
- [ ] No hardcoded font sizes (use `c.fontSize('key')`)
- [ ] No raw `<div>` for interactive surfaces
- [ ] No loose/uncontained text
- [ ] Touch targets meet minimum 48px
- [ ] Text is minimal and action-oriented
- [ ] Color-coding follows semantic system
- [ ] All strings are i18n-ready (use `t('key')`)

---

## 12. File Reference

| File | Purpose |
|------|---------|
| `frontend/src/core/theme/monoTheme.tsx` | Centralized theme tokens + provider |
| `frontend/src/components/POSCard.tsx` | Card container component |
| `frontend/src/components/POSButton.tsx` | Button component |
| `frontend/src/components/POSTextField.tsx` | Input component |
| `frontend/src/components/POSChip.tsx` | Badge/chip component |
| `frontend/src/components/POSIcon.tsx` | Icon wrapper component |
| `frontend/src/components/index.ts` | Component barrel export |
| `frontend/src/modules/settings/UISettingsPage.tsx` | Runtime UI customization |

---

*This document is the authoritative reference for all UI decisions in Brew-POS v2. When in doubt, refer here.*
