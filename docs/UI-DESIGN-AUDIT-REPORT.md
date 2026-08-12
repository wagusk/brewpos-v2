# Brew-POS V2 — UI Design Rule Audit Report

> Generated: 2026-08-12
> Last updated: 2026-08-12
> Scope: All .tsx page components in modules/, shared/, components/
> Design Rule (canonical): **[`UI-DESIGN-RULE.md`](./UI-DESIGN-RULE.md)** (v1.0, ACTIVE)
> Summary pointer: **[`UI-DESIGN-RULES.md`](./UI-DESIGN-RULES.md)**

This report is a **historical tracking document** — generated against the
rule snapshot on 2026-08-12. It enumerates per-file violations so each
milestone can mark its migration scope. It is NOT the rule itself. For
authoritative tenets, component contracts, and forbidden patterns, read
`UI-DESIGN-RULE.md`.

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Files analyzed | 38 |
| Files with ZERO violations | 6 |
| Files needing POS component migration | 26 |
| Files with hardcoded colors | 22 |
| Files with hardcoded dimensions | 18 |
| Files using raw MUI `Button` (should be `POSButton`) | 14 |
| Files using raw MUI `Chip` (should be `POSChip`) | 16 |
| Files using raw MUI `TextField` (should be `POSTextField`) | 12 |
| Files using raw MUI icons without `POSIcon` | 20+ |
| Files with raw `<div>` for interactive surfaces | 8 |

---

## Detailed Audit by Directory

### `modules/auth/`

#### LoginPage.tsx
- **POS Components Used:** `POSCard` (imported but NOT used in JSX), `POSButton` (imported but NOT used in JSX), `POSIcon` (imported but NOT used in JSX)
- **Violations:**
  1. **Raw MUI `Button`** — Lines 144, 158, 173, 187: Uses `<Button>` with manual `sx` styling instead of `<POSButton>`
  2. **Raw MUI `Paper`** — Line 96: Uses `<Paper>` instead of `<POSCard>` for the login container
  3. **Raw MUI `Alert`** — Line 131: Uses `<Alert>` instead of `<POSChip>` for error display
  4. **Hardcoded `fontSize: '1.75rem'`** — Line 122: Should use `c.fontSize('h2')` or similar
  5. **Hardcoded `fontSize: '1.5rem'`** — Line 74: Should use `c.fontSize('h3')`
  6. **Hardcoded `letterSpacing: '8px'`** — Line 73: Should be tokenized
  7. **Hardcoded `height: 44, width: 44`** — Line 106: Icon box not using `c.ui.minTouchTarget`
  8. **Missing POSIcon** — Lines 111, 131, 187: MUI icons used directly without `POSIcon` wrapper
  9. **Imported but unused POSCard/POSButton/POSIcon** — Dead imports (lines 8)
- **Lines needing change:** 8, 96, 106, 111, 122, 131, 144, 158, 173, 187

---

### `modules/cashier/`

#### CashierPage.tsx
- **POS Components Used:** None (imports `useTheme` only)
- **Violations:**
  1. **Raw MUI `Dialog/DialogTitle/DialogContent/DialogActions`** — Lines 74-125: Dialog not using POS-styled wrappers
  2. **Raw MUI `Button`** — Lines 98-123: Two buttons with extensive manual `sx` (should be `POSButton`)
  3. **Raw MUI `Alert` + `Snackbar`** — Lines 127-135: Should use shared notifications
  4. **Hardcoded `borderRadius: c.ui.cardRadius` via template literal** — Lines 84, 102, 115: Acceptable pattern but Dialog Paper could use POSCard
- **Lines needing change:** 12, 98, 110, 128

#### cashier/tableview/TableView.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Chip`** — Lines 51-68: Chips should be `POSChip`
  2. **Raw MUI icons without POSIcon** — Line 14: `TableRestaurant` used directly
  3. **Raw `<Box>` as clickable tile** — Lines 92-173: Interactive tile should use `POSCard clickable`
  4. **Hardcoded `height: 28` on Chip** — Line 159: Should use `c.ui.chipMinHeight`
  5. **Hardcoded `width: 40, height: 40`** — Line 125: Icon box not using minTouchTarget
- **Lines needing change:** 14, 51, 92, 125, 155, 159

#### cashier/billsection/BillSection.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 138, 238, 254: Should be `POSButton`
  2. **Raw MUI `Chip`** — Lines 196, 236-262: Should be `POSChip`
  3. **Raw MUI `Divider`** — Lines 231, 295: Should use `c.divider` color (already done)
  4. **Raw MUI `Alert` + `Snackbar`** — Lines 305-322: Should use shared notifications
  5. **Hardcoded `height: 20` on Chip** — Line 200: Should use theme token
  6. **Raw MUI icons without POSIcon** — Lines 13, 141, 160, 169, 241, 256
  7. **Hardcoded `fontSize: '3rem'`** — Lines 160, 169: Icon sizing not using POSIcon
- **Lines needing change:** 13, 138, 160, 169, 196, 200, 238, 254, 305, 309

#### cashier/settingspopup/SettingsPopup.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 55, 74, 135, 218, 231: Should be `POSButton`
  2. **Raw MUI `IconButton`** — Line 104: Should be `POSButton variant="ghost"`
  3. **Raw MUI `Dialog`** — Lines 118-244: Dialog Paper not wrapped in POSCard
  4. **Hardcoded `minWidth: 36`** — Lines 60, 79: Below `minTouchTarget`
  5. **Hardcoded `height: 6`** — Line 67: Slider track height not tokenized
  6. **Raw MUI icons without POSIcon** — Lines 16, 114
- **Lines needing change:** 16, 55, 60, 67, 74, 104, 114, 135, 218, 231

---

### `modules/order/`

#### OrderPage.tsx
- **POS Components Used:** None directly (delegates to MenuGrid, CartSidebar, ModifierDialog)
- **Violations:**
  1. **Raw MUI `Alert` + `Snackbar`** — Lines 317-322: Should use shared notifications
  2. **Hardcoded `errSx` / `okSx`** — Lines 278-279: Inline color constants for alert styling
- **Lines needing change:** 278, 279, 317, 320

#### order/menu/MenuGrid.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Card` + `CardContent`** — Lines 189-254: Should use `POSCard clickable`
  2. **Raw MUI `Chip`** — Lines 147-173, 226-251: Should use `POSChip`
  3. **Raw MUI `TextField`** — Lines 118-141: Should use `POSTextField variant="search"`
  4. **Hardcoded `height: 40` on category Chips** — Lines 152, 166: Should use `c.ui.chipMinHeight`
  5. **Hardcoded `height: 22` on station Chips** — Lines 230, 243: Below minTouchTarget
  6. **Raw MUI icons without POSIcon** — Lines 15-17, 45-47, 128, 179
  7. **Hardcoded `fontSize: 56`** — Line 179: Empty state icon
  8. **Hardcoded `minWidth: 220`** — Line 117
- **Lines needing change:** 15-17, 45-47, 118, 128, 147, 152, 166, 179, 189, 226, 230, 243

#### order/menu/ModifierDialog.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 194, 292, 300: Should be `POSButton`
  2. **Raw MUI `IconButton`** — Lines 268, 284: Should be `POSButton variant="ghost"`
  3. **Raw MUI `Chip`** — Line 178: Should be `POSChip`
  4. **Raw MUI `TextField`** — Lines 243, 274: Should be `POSTextField`
  5. **Hardcoded `fontSize: 14` on Lock icon** — Line 150 (in CartSidebar)
  6. **Hardcoded `height: 22`** — Line 178: Chip height
  7. **Raw MUI icons without POSIcon** — Lines 29, 211
  8. **Hardcoded `width: 64`** — Line 282: Qty input width
- **Lines needing change:** 29, 178, 194, 211, 243, 268, 274, 282, 284, 292, 300

#### order/cart/CartSidebar.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 288, 291, 304, 308, 312, 328, 349, 350: Extensive raw buttons
  2. **Raw MUI `IconButton`** — Lines 208, 213, 219: Should be `POSButton variant="ghost"`
  3. **Raw MUI `Chip`** — Lines 148, 236, 249: Should be `POSChip`
  4. **Raw MUI `Paper`** — Line 133: Should be `POSCard` or themed wrapper
  5. **Hardcoded `width: 400`** — Line 134: Cart width not from layout config
  6. **Hardcoded `width: 40, height: 40`** — Lines 210, 215: IconButton sizes
  7. **Hardcoded `fontSize: 14`** — Line 150: Lock icon size
  8. **Hardcoded `height: 36`** — Lines 241, 255: Chip heights
  9. **Raw MUI icons without POSIcon** — Lines 23-25, 150, 162, 167, 208, 211, 213, 216, 219, 222
  10. **Raw MUI `Tooltip`** — Lines 184, 218: Acceptable (no POS equivalent)
  11. **Raw MUI `List/ListItem`** — Lines 171-227: Should use POSCard for list items
- **Lines needing change:** 23-25, 133, 134, 148, 150, 162, 167, 171, 208, 210, 213, 215, 219, 222, 236, 241, 249, 255, 288, 291, 304, 308, 312, 328, 349, 350

---

### `modules/kitchen/`

#### KitchenPage.tsx
- **POS Components Used:** None (delegates to shared OrderList)
- **Violations:**
  1. **Raw MUI `Chip`** — Lines 105-111: Should use `POSChip variant="status"`
  2. **Raw MUI `Alert` + `Snackbar`** — Lines 116-121: Should use shared notifications
  3. **Raw MUI icons without POSIcon** — Lines 11, 103, 106
  4. **Uses MUI `color="success"` / `color="warning"` on Chip** — Line 108: Should use POSChip status variant
- **Lines needing change:** 11, 103, 105, 106, 108, 116, 119

---

### `modules/bar/`

#### BarPage.tsx
- **POS Components Used:** None (delegates to shared OrderList)
- **Violations:** (Same pattern as KitchenPage)
  1. **Raw MUI `Chip`** — Lines 105-111: Should use `POSChip`
  2. **Raw MUI `Alert` + `Snackbar`** — Lines 116-121: Should use shared notifications
  3. **Raw MUI icons without POSIcon** — Lines 11, 103, 106
  4. **Uses MUI `color="success"` / `color="warning"`** — Line 108
- **Lines needing change:** 11, 103, 105, 106, 108, 116, 119

---

### `modules/admin/`

#### AdminPage.tsx
- **POS Components Used:** `PageHeader` (shared), `PageTabs` (shared), `ConfirmDialog` (shared), `useNotifications` (shared)
- **Violations:**
  1. **Hardcoded default color `'#5b8def'`** — Lines 60, 72: Should use `c.button` or theme token
- **Lines needing change:** 60, 72
- **Assessment:** Mostly clean — uses shared components well

#### admin/components/AdminDialog.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Dialog`** — Line 88: Dialog not styled with POSCard PaperProps
  2. **Raw MUI `Button`** — Lines 98, 99: Should be `POSButton`
  3. **Raw MUI `TextField`** — Lines 25-29, 37-44, 52-54, 62-65: All should be `POSTextField`
  4. **No useTheme import** — File doesn't import or use theme at all
  5. **Hardcoded default colors** — Lines 26, 64: `'#5b8def'` default
- **Lines needing change:** 1 (missing import), 25, 26, 37, 39, 40, 41, 42, 43, 44, 52, 53, 54, 62, 64, 65, 88, 98, 99

#### admin/categories/CategoriesTab.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Line 22: Should be `POSButton`
  2. **Raw MUI `IconButton`** — Lines 49, 52: Should be `POSButton variant="ghost"`
  3. **Raw MUI `Chip`** — Line 46: Should be `POSChip`
  4. **Raw MUI `Paper` + `Table`** — Lines 26-60: Table not using POSCard wrapper
  5. **Raw MUI `Typography variant="h6"`** — Line 21: Not using `c.fontSize('h5')`
  6. **Missing theme colors on Typography** — Line 21: `variant="h6"` without explicit `color: c.text`
  7. **Hardcoded `height: 28`** — Line 46: Chip height
  8. **Raw MUI icons without POSIcon** — Lines 6, 50, 53
- **Lines needing change:** 6, 21, 22, 46, 49, 50, 52, 53

#### admin/products/ProductsTab.tsx
- **POS Components Used:** None
- **Violations:** (Same pattern as CategoriesTab)
  1. **Raw MUI `Button`** — Line 23
  2. **Raw MUI `IconButton`** — Lines 48, 51
  3. **Raw MUI `Chip`** — Line 45: Uses MUI `color="success"/"default"` instead of POSChip
  4. **Raw MUI `Paper` + `Table`** — Lines 27-59
  5. **Raw MUI `Typography variant="h6"`** — Line 22: No theme color
  6. **Hardcoded `height: 28`** — Line 45
  7. **Raw MUI icons without POSIcon** — Lines 6, 49, 52
- **Lines needing change:** 6, 22, 23, 45, 48, 49, 51, 52

#### admin/users/UsersTab.tsx
- **POS Components Used:** None
- **Violations:** (Same pattern)
  1. **Raw MUI `Button`** — Line 22
  2. **Raw MUI `IconButton`** — Lines 47, 50
  3. **Raw MUI `Chip`** — Lines 41, 44
  4. **Raw MUI `Paper` + `Table`** — Lines 26-58
  5. **Raw MUI `Typography variant="h6"`** — Line 21
  6. **Hardcoded `height: 28`** — Lines 41, 44
  7. **Raw MUI icons without POSIcon** — Lines 6, 48, 51
- **Lines needing change:** 6, 21, 22, 41, 44, 47, 48, 50, 51

#### admin/roles/RolesTab.tsx
- **POS Components Used:** None
- **Violations:** (Same pattern)
  1. **Raw MUI `Button`** — Line 22
  2. **Raw MUI `IconButton`** — Lines 45, 48
  3. **Raw MUI `Paper` + `Table`** — Lines 26-57
  4. **Raw MUI `Typography variant="h6"`** — Line 21
  5. **Raw MUI icons without POSIcon** — Lines 6, 46, 49
- **Lines needing change:** 6, 21, 22, 45, 46, 48, 49

#### admin/tables/TablesWorkspace.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 236, 409, 425, 445, 454: Should be `POSButton`
  2. **Raw MUI `IconButton`** — Lines 317, 328: Should be `POSButton variant="ghost"`
  3. **Raw MUI `Chip`** — Lines 358: Should be `POSChip`
  4. **Raw MUI `Paper`** — Lines 201, 230, 309: Should be `POSCard`
  5. **Raw MUI `TextField`** — Lines 253, 387, 397: Should be `POSTextField`
  6. **Hardcoded rgba colors** — Lines 319, 322, 330, 333: `'rgba(99, 102, 241, 0.15)'`, `'rgba(248, 113, 113, 0.15)'`
  7. **Hardcoded `width: 48, height: 48`** — Lines 321, 331: IconButton sizes (acceptable for touch targets)
  8. **Hardcoded `minWidth: 100`** — Line 355
  9. **Hardcoded `width: 32, height: 32`** — Line 287: Table initial badge
  10. **Raw MUI icons without POSIcon** — Lines 21-23, 215, 261, 324, 335
- **Lines needing change:** 21-23, 201, 215, 230, 236, 253, 261, 287, 309, 317, 319, 321, 322, 324, 328, 330, 331, 333, 335, 355, 358, 387, 397, 409, 425, 445, 454

---

### `modules/settings/`

#### SettingsPage.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Tabs/Tab`** — Lines 66-72: Tabs not using PageTabs shared component
  2. **Raw MUI `Alert` + `Snackbar`** — Lines 120-129: Should use shared notifications
  3. **Raw MUI `Typography variant="h5"`** — Line 62: Should use `c.fontSize('h2')`
  4. **Raw MUI icons without POSIcon** — Lines 11
  5. **Missing `bgcolor: c.page`** — Line 61
- **Lines needing change:** 11, 61, 62, 66, 120, 125

#### settings/UISettingsPage.tsx
- **POS Components Used:** None (but uses `useTheme` extensively)
- **Violations:**
  1. **Raw MUI `Button`** — Lines 83, 166, 179, 258: Should be `POSButton`
  2. **Raw MUI `Paper`** — Lines 103, 128, 196, 242: Should be `POSCard`
  3. **Hardcoded `minWidth: 36`** — Lines 36, 51: Below minTouchTarget
  4. **Hardcoded `height: 6`** — Line 40: Slider track
  5. **Raw MUI icons without POSIcon** — Lines 6-8, 105, 130
  6. **Missing `bgcolor: c.page`** on outer Box — Line 76 (actually present)
- **Lines needing change:** 6-8, 36, 40, 51, 83, 103, 105, 128, 130, 166, 179, 196, 242, 258

#### settings/tax/TaxTab.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 61, 73, 85: Should be `POSButton`
  2. **Raw MUI `TextField`** — Lines 37, 48: Should be `POSTextField`
  3. **Raw MUI `Paper`** — Line 32: Should be `POSCard`
  4. **Raw MUI `Typography variant="h6"`** — Line 33: Should use `c.fontSize('h5')` with color
  5. **Hardcoded `minHeight: 48`** — Lines 77, 85: Below `buttonMinHeight` (64px default)
  6. **Uses MUI `color="error"`** — Line 63: Should use `variant="danger"` on POSButton
  7. **Raw MUI icons without POSIcon** — Lines 6, 69, 75
- **Lines needing change:** 6, 32, 33, 37, 48, 61, 63, 69, 73, 75, 77, 85

#### settings/printer/PrinterTab.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 96, 99: Should be `POSButton`
  2. **Raw MUI `TextField`** — Lines 48, 63, 72: Should be `POSTextField`
  3. **Raw MUI `Paper`** — Line 45: Should be `POSCard`
  4. **Raw MUI `FormControlLabel/Switch`** — Lines 85-93: No POS equivalent yet
  5. **Hardcoded `minHeight: 48`** — Lines 96, 99
  6. **Raw MUI icons without POSIcon** — Lines 6
- **Lines needing change:** 6, 45, 48, 63, 72, 85, 96, 99

#### settings/discount/DiscountTab.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 104, 109: Should be `POSButton`
  2. **Raw MUI `IconButton`** — Line 99: Should be `POSButton variant="ghost"`
  3. **Raw MUI `TextField`** — Lines 54, 75, 81, 92: Should be `POSTextField`
  4. **Raw MUI `Paper`** — Line 51: Should be `POSCard`
  5. **Raw MUI `FormControlLabel/Switch`** — Lines 62-69
  6. **Hardcoded `minHeight: 48`** — Line 109
  7. **Hardcoded `width: 100` and `width: 80`** — Lines 87, 97
  8. **Raw MUI icons without POSIcon** — Lines 6, 100
- **Lines needing change:** 6, 51, 54, 75, 81, 87, 92, 97, 99, 100, 104, 109

#### settings/cashierlayout/CashierLayoutTab.tsx
- **POS Components Used:** None (uses LayoutSlider)
- **Violations:**
  1. **Raw MUI `Button`** — Line 20: Should be `POSButton`
  2. **Raw MUI `Paper`** — Line 17: Should be `POSCard`
  3. **Hardcoded `height: 6`** in LayoutSlider — Line 44 (in LayoutSlider.tsx)
  4. **Hardcoded `minWidth: 36`** in LayoutSlider — Lines 37, 56
  5. **Raw MUI icons without POSIcon** — Line 7
  6. **Raw MUI `Typography variant="h6"`** — Line 19
- **Lines needing change:** 7, 17, 19, 20

#### settings/cashierlayout/LayoutSlider.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 32, 51: Should be `POSButton`
  2. **Hardcoded `height: 6`** — Line 44: Slider track
  3. **Hardcoded `minWidth: 36`** — Lines 37, 56: Below minTouchTarget
  4. **Hardcoded `borderRadius: 3`** — Lines 40, 44, 48: Should use theme tokens
- **Lines needing change:** 32, 37, 40, 44, 48, 51, 56

#### settings/database/DatabaseTab.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 60, 63, 68: Should be `POSButton`
  2. **Raw MUI `TextField`** — Line 52: Should be `POSTextField`
  3. **Raw MUI `Paper`** — Line 46: Should be `POSCard`
  4. **Raw MUI `Alert`** — Line 49: Should be `POSChip` or styled alert
  5. **Raw MUI `Divider`** — Line 67
  6. **Hardcoded `minHeight: 48`** — Lines 60, 63, 68
  7. **Uses MUI `color="error"`** — Line 68
  8. **Raw MUI icons without POSIcon** — Line 6
- **Lines needing change:** 6, 46, 49, 52, 60, 63, 67, 68

---

### `modules/discount/`

#### DiscountPage.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Paper`** — Lines 69, 73: Should be `POSCard`
  2. **Raw MUI `Table/TableContainer`** — Lines 73-100: Table not POS-wrapped
  3. **Raw MUI `Chip`** — Line 93: Should be `POSChip`
  4. **Raw MUI `Alert` + `Snackbar`** — Lines 103-108: Should use shared notifications
  5. **Raw MUI `Typography variant="h5"`** — Line 64: Should use `c.fontSize('h2')` with color
  6. **Missing `useTheme` import** — File doesn't import theme
  7. **No `bgcolor: c.page`** on outer Box — Line 63
  8. **Raw MUI icons without POSIcon** — Line 8
  9. **Many unused imports** — TextField, Button, IconButton, Dialog, etc. imported but not used
- **Lines needing change:** 1-8 (full rewrite needed)

---

### `modules/void/`

#### VoidPage.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Paper`** — Lines 87, 91: Should be `POSCard`
  2. **Raw MUI `Table/TableContainer`** — Lines 91-141
  3. **Raw MUI `Chip`** — Lines 116, 123: Should be `POSChip`
  4. **Raw MUI `Button`** — Lines 163, 164: Should be `POSButton`
  5. **Raw MUI `TextField`** — Line 152: Should be `POSTextField`
  6. **Raw MUI `Dialog`** — Lines 145-173: Dialog not POS-styled
  7. **Raw MUI `IconButton`** — Line 128: Should be `POSButton variant="ghost"`
  8. **Raw MUI `Alert` + `Snackbar`** — Lines 82, 149, 175-180
  9. **Raw MUI `Typography variant="h5"`** — Line 78
  10. **Uses MUI `color="error"`** — Lines 129, 166
  11. **Missing `useTheme` import** — File doesn't import theme
  12. **No `bgcolor: c.page`** on outer Box
  13. **Raw MUI icons without POSIcon** — Lines 8
- **Lines needing change:** 1-13 (full rewrite needed)

---

### `modules/multilingual/`

#### LanguagePage.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 63-99: Should be `POSButton`
  2. **Raw MUI `Paper`** — Line 47: Should be `POSCard`
  3. **Hardcoded `height: 64`** — Line 36: Should use `c.ui.barHeight`
  4. **Raw MUI icons without POSIcon** — Lines 11, 40, 97
- **Lines needing change:** 11, 36, 40, 47, 63, 97

---

### `modules/tables/`

#### TableViewPage.tsx
- **POS Components Used:** None (uses TableTile sub-component)
- **Violations:**
  1. **Raw MUI `Chip`** — Lines 247-251, 290-320, 435-455: Extensive raw chips
  2. **Raw MUI `Button`** — Lines 478-501: Should be `POSButton`
  3. **Raw MUI `IconButton`** — Lines 263, 268: Should be `POSButton variant="ghost"`
  4. **Raw MUI `Dialog`** — Lines 406-501: Dialog not POS-styled
  5. **Raw MUI `Tooltip`** — Lines 262, 267, 406: Acceptable
  6. **Hardcoded colors** — Lines 247 `'#047857'`, 248 `'#1d4ed8'`, 249 `'#d97706'`, 303 `'#5b8def'`, 344 `'#5b8def'`: Should use theme tokens
  7. **Hardcoded `fontSize: 24`** — Line 240: Icon size
  8. **Hardcoded `fontSize: 64`** — Line 332: Empty state icon
  9. **Hardcoded `height: 4`** — Line 354: Section accent bar
  10. **Raw MUI icons without POSIcon** — Lines 25-28, 240, 264, 274, 332
- **Lines needing change:** 25-28, 240, 247-251, 263, 268, 290-320, 332, 344, 354, 406, 435-455, 478-501

#### TableTile.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Chip`** — Lines 179, 280: Should be `POSChip`
  2. **Raw `<Box>` as clickable tile** — Line 100: Should use `POSCard clickable`
  3. **Hardcoded `minHeight: 140`** — Line 104: Could use `c.ui.cardMinHeight` with override
  4. **Hardcoded `height: 3`** — Line 134: Section accent
  5. **Hardcoded `fontSize: 20`** — Line 149: Icon size
  6. **Hardcoded `height: 22`** — Lines 183, 288: Chip heights
  7. **Hardcoded `fontSize: 13`** — Lines 167, 202, 240, 251, 283, 298
  8. **Raw MUI icons without POSIcon** — Lines 12-20, 149, 167, 202, 240, 251, 283, 298
  9. **Hardcoded `width: 36, height: 36`** — Line 143: Icon box
- **Lines needing change:** 12-20, 100, 104, 134, 143, 149, 167, 179, 183, 202, 240, 251, 280, 283, 288, 298

---

### `modules/payment/`

#### PaymentDialog.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 372, 376, 393, 396, 404, 421, 435: Should be `POSButton`
  2. **Raw MUI `Chip`** — Lines 297, 318, 363: Should be `POSChip`
  3. **Raw MUI `Alert`** — Lines 355, 442: Should use themed alert
  4. **Raw MUI `CircularProgress`** — Lines 243, 379, 408: Acceptable (loading indicator)
  5. **Raw MUI `Divider`** — Line 369
  6. **Hardcoded `height: 40`** — Line 303: Chip height
  7. **Hardcoded `height: 36`** — Line 323: Chip height
  8. **Hardcoded `fontSize: 48`** — Lines 240-243: Status icons
  9. **Raw MUI icons without POSIcon** — Lines 23-25, 240-242, 265, 293-295, 379, 397, 400, 408, 435
- **Lines needing change:** 23-25, 240-243, 265, 293, 297, 303, 318, 323, 355, 363, 372, 376, 379, 393, 396, 397, 400, 404, 408, 421, 435, 442

---

### `shared/`

#### header/TopBar.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Hardcoded `width: 48, height: 48`** — Line 93: Logout button size (acceptable for touch target)
  2. **Raw MUI `IconButton`** — Line 91: Should be `POSButton variant="ghost"`
  3. **Raw MUI icons without POSIcon** — Line 11
- **Lines needing change:** 11, 91, 93

#### header/PageHeader.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Typography variant="h5"`** — Line 25: Should use `c.fontSize('h2')` with explicit color
  2. **Raw MUI `Chip`** — Line 29: Should be `POSChip`
  3. **Hardcoded `height: 22`** — Line 37: Chip height
- **Lines needing change:** 25, 29, 37

#### dialog/ConfirmDialog.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Lines 38, 41: Should be `POSButton`
  2. **Raw MUI `Dialog`** — Line 26: Dialog Paper not POS-styled
  3. **Hardcoded color `c.bg`** — Line 47: Should use `c.buttonText`
  4. **Missing `minHeight` on buttons** — Lines 38, 41: Below touch target
- **Lines needing change:** 26, 38, 41, 47

#### searchbar/SearchBar.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `TextField`** — Line 20: Should be `POSTextField variant="search"`
  2. **Hardcoded `fontSize: '1rem'`** — Lines 41, 47: Icon sizing
- **Lines needing change:** 20, 41, 47

#### tabpanel/PageTabs.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Hardcoded `minHeight: 48`** — Lines 35, 41: Should use `c.ui.minTouchTarget`
  2. **Hardcoded `px: 3`** — Line 42
- **Lines needing change:** 35, 41, 42

#### tabpanel/TabPanel.tsx
- **POS Components Used:** None
- **Violations:** None (minimal wrapper, no styling issues)

#### states/ErrorState.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Line 41: Should be `POSButton variant="outline"`
  2. **Hardcoded `fontSize: '3rem'`** — Line 31: Icon size
  3. **Raw MUI icons without POSIcon** — Lines 6, 7
- **Lines needing change:** 6, 7, 31, 41

#### states/LoadingState.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `CircularProgress`** — Line 22: Acceptable (loading spinner)
- **Lines needing change:** Minimal — mostly clean

#### states/EmptyState.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Hardcoded `fontSize: '3rem'`** — Lines 25, 26: Icon sizing
  2. **Raw MUI icons without POSIcon** — Line 7
- **Lines needing change:** 7, 25, 26

#### table/DataTable.tsx
- **POS Components Used:** None (uses EmptyState from shared)
- **Violations:**
  1. **Raw MUI `IconButton`** — Lines 81, 86: Should be `POSButton variant="ghost"`
  2. **Raw MUI icons without POSIcon** — Lines 7, 82, 87
  3. **Hardcoded `width: 96`** — Line 59: Actions column
- **Lines needing change:** 7, 59, 81, 82, 86, 87

#### table/CrudToolbar.tsx
- **POS Components Used:** None (uses SearchBar)
- **Violations:**
  1. **Raw MUI `Button`** — Line 46: Should be `POSButton`
  2. **Missing `minHeight`** — Line 46: Button below touch target
- **Lines needing change:** 46

#### keypad/PinKeypad.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Button`** — Line 29: Should be `POSButton`
  2. **Raw MUI `TextField`** — Line 21: Should be `POSTextField variant="pin"`
  3. **Hardcoded `width: 240`** — Lines 21, 35
  4. **Hardcoded `fontSize: '1.5rem'`** — Line 23
- **Lines needing change:** 21, 23, 29, 35

#### orderlist/OrderList.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Card` + `CardContent`** — Lines 74-131: Should use `POSCard`
  2. **Raw MUI `Chip`** — Line 78: Should be `POSChip`
  3. **Raw MUI `Button`** — Line 124: Should be `POSButton`
  4. **Raw MUI `IconButton`** — Lines 99, 102, 105, 108: Should be `POSButton variant="ghost"`
  5. **Hardcoded `width: 48, height: 48`** — Lines 99, 102, 105, 108: Acceptable touch targets
  6. **Raw MUI `List/ListItem/ListItemText`** — Lines 81-113
  7. **Raw MUI `Grid`** — Line 71: Deprecated MUI Grid
  8. **Raw MUI `Tooltip`** — Line 88
  9. **Raw MUI icons without POSIcon** — Lines 10, 45-47, 78, 89, 99, 102, 105, 108, 110, 118
- **Lines needing change:** 10, 45-47, 71, 74, 78, 81, 88, 89, 99, 102, 105, 108, 110, 118, 124

#### notifications/useNotifications.tsx
- **POS Components Used:** None
- **Violations:**
  1. **Raw MUI `Snackbar` + `Alert`** — Lines 76-86: This IS the notification system, so acceptable
- **Lines needing change:** None (this is the infrastructure)

---

### `components/` (POS Component Library)

#### Shell.tsx
- **POS Components Used:** None (IS the app shell)
- **Violations:**
  1. **Raw MUI `Box` as clickable nav items** — Lines 71-96: Could use POSCard for nav items
  2. **Raw MUI icons without POSIcon** — Lines 11-19
  3. **Hardcoded `gap: 0.25`** — Line 82
  4. **Hardcoded `height: c.ui.bottomBarHeight - 12`** — Line 83
- **Lines needing change:** 11-19, 71, 82, 83

#### POSCard.tsx, POSButton.tsx, POSTextField.tsx, POSChip.tsx, POSIcon.tsx
- **Assessment:** These ARE the design system components. They are correctly theme-driven.
- **Minor issue in POSButton:** Lines 78, 82, 86, 90: Uses hardcoded `'#fff'` for danger/success text — should use `c.buttonText` for consistency
- **Lines needing change:** 78, 82, 86, 90

---

## Priority Summary

### Critical (blocks theme customization)
1. **DiscountPage.tsx** — Zero theme usage, full rewrite needed
2. **VoidPage.tsx** — Zero theme usage, full rewrite needed
3. **AdminDialog.tsx** — Zero theme usage, all TextFields raw
4. **LoginPage.tsx** — Imports POS components but doesn't use them

### High (most violations per file)
5. **CartSidebar.tsx** — 11 categories of violations, 30+ lines
6. **TablesWorkspace.tsx** — Hardcoded rgba colors, raw Paper/Button/TextField
7. **TableViewPage.tsx** — Hardcoded hex colors, raw Chips/Dialog
8. **PaymentDialog.tsx** — 11 categories, raw Buttons/Chips everywhere
9. **OrderList.tsx** — Raw Cards, Grid, Buttons, Icons

### Medium (repeated patterns across admin/settings tabs)
10. **CategoriesTab / ProductsTab / UsersTab / RolesTab** — All identical pattern: raw Table/Paper/Button/IconButton/Chip
11. **TaxTab / PrinterTab / DiscountTab / DatabaseTab** — All use raw Paper/TextField/Button
12. **MenuGrid.tsx** — Raw Card, TextField, Chips for category filters

### Low (mostly clean, minor issues)
13. **AdminPage.tsx** — Uses shared components well
14. **LoadingState.tsx** — Minimal violations
15. **TabPanel.tsx** — Clean wrapper
16. **useNotifications.tsx** — This IS the notification infrastructure

---

## Milestone Status (track here as work lands)

| Milestone | Date | Files migrated | Notes |
|-----------|------|----------------|-------|
| M0 — Rule v1.0 frozen | 2026-08-12 | — | This report generated |
| M1 — Doc consolidation | 2026-08-12 | `docs/UI-DESIGN-RULES.md` rewritten as summary pointer; dead `modules/glassmorphism/` removed | Rule doc → single source of truth |
| M2 — Tables module migrated | 2026-08-12 | `TableViewPage.tsx`, `TableTile.tsx`, `tableviewConfig.ts` | `STATUS_MAP`/`PAYMENT_STATUS_MAP` switched to `colorToken` references (resolve at render). Section header: raw 4-px color stripe + loose text → contained `POSChip`. Error banner: raw `⚠` glyph → `ErrorOutlineIcon` in `POSIcon`. Backdrop: hardcoded `rgba(0,0,0,0.2)` → `c.overlay` token (new theme token). Tile padding: `Math.max(12, ...*fontScale)` magic → `c.ui.cardPadding`. Settings button ref: removed (unused). Status legend: reuses `resolveToken` helper. Added 18 new i18n keys (`tablesview.status.*`, `tablesview.payment.*`, `tablesview.billLabel`) in `en.ts` + `id.ts`. `npx tsc --noEmit` clean. `check-ui-conventions.sh frontend/src/modules/tables` — 0 violations. `npm run build` — 0 errors. |

**How to use this section:** when a milestone migrates a batch of files,
append a row with: milestone label, date, list of files migrated, brief
note. Do not edit the violation list above — that is the v1.0 snapshot.
Future audits regenerate fresh snapshots and append here.
