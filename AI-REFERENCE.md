# Brew-POS v2 — AI Reference (Condensed)

> Modular POS: FastAPI + SQLite + Vite/React + MUI.
> Run: `./run.sh` → http://localhost:8000 | Admin PIN: 9999
> UI: Light theme (no dark mode)

## Stack
- Backend: FastAPI, SQLAlchemy 2.0, SQLite, JWT (python-jose), bcrypt, WebSocket
- Frontend: Vite 5, React 18, TS, MUI v6, Redux Toolkit, React Router 6
- Sync: WebSocket hub → all terminals
- Roles: admin, master, cashier, waiter, kitchen, bar
- Theme: Light theme (MUI light palette, no dark mode)

## WebSocket Real-Time Sync

All 5 operational pages receive real-time updates via WebSocket with connection status indicators.

**Pages with WebSocket:**
| Page | Events Listened | Fallback Polling |
|------|----------------|------------------|
| Table View (`/tables`) | `table_*`, `order_*` | 30s |
| Order (`/order`) | `order_updated`, `order_closed`, `order_cancelled` | 10s (bill loaded) |
| Kitchen (`/kitchen`) | `order_*` | 30s |
| Bar (`/bar`) | `order_*` | 30s |
| Cashier (`/cashier`) | `table_*`, `order_*` | 10s |

**Pattern:** Each page tracks `wsConnected` state, shows Wifi/WifiOff chip, falls back to polling when disconnected.

**Events:** `order_created`, `order_updated`, `order_accepted`, `order_item_updated`, `order_served`, `order_closed`, `order_cancelled`, `table_created`, `table_updated`, `table_deleted`

## UI Design System
All UI follows the unified visual language documented in `docs/UI-DESIGN-RULE.md`.

**Core Rule:** Every visible element belongs to a card-based, touch-first component. No raw HTML, no hardcoded values, no uncontained text.

**Components (use these, not raw HTML):**
- `POSCard` — container for all surfaces (tiles, sections, input wrappers)
- `POSButton` — all interactive actions (primary, secondary, danger, success, ghost, outline)
- `POSTextField` — all text/number inputs (default, search, pin)
- `POSChip` — badges, labels, status indicators (status, station, payment, category)
- `POSIcon` — icon wrapper (consistent sizing + semantic color variants)

**Theme Tokens (use `c.tokenName`, never raw values):**
- Colors: `c.button`, `c.text`, `c.subtext`, `c.success`, `c.error`, `c.warning`, `c.info`, `c.stationKitchen`, `c.stationBar`, `c.statusPending`, `c.statusReady`, `c.paymentCash`, etc.
- Sizing: `c.ui.buttonMinHeight`, `c.ui.cardRadius`, `c.ui.cardGap`, `c.ui.sidebarWidth`, `c.ui.barHeight`
- Typography: `c.fontSize('h4')`, `c.fontSize('body1')`, `c.fontSize('caption')`

**Implementation:** See `docs/UI-DESIGN-RULE.md` for full spec, anti-patterns, and checklist.

## Architecture: Modular Registry

**Frontend:** `frontend/src/app/moduleRegistry.ts` — central manifest of all modules
**Backend:** `backend/app/main.py` — MODULE_REGISTRY dict + ENABLED_MODULES flags

Each feature is a self-contained folder:
```
modules/
  auth/         LoginPage (PIN pad, role-based redirect)
  tables/       TableViewPage (FIRST operational screen — visual table overview)
  order/        OrderPage (menu → cart → checkout → send to kitchen)
  cashier/      CashierPage (legacy floor-plan variant)
  payment/      Payment dialog (close-bill flow)
  kitchen/      KitchenPage (order display, item status progression)
  bar/          BarPage (filtered order display for bar station)
  admin/        AdminPage (CRUD: categories, products, users, tables, roles + reports)
  settings/     SettingsPage + UISettingsPage (tax, printer, discount, database, UI tokens)
  discount/     DiscountPage (bill history viewer)
  void/         VoidPage (void bills with required reason)
  multilingual/ i18n module (pluggable, t() helper, en.ts + id.ts)
```

Backend modules:
```
modules/
  auth/         Login, me
  menu/         Menu, tables, table-sections
  orders/       Checkout, open-bill, close, accept, cancel, void, append, print, stats
  admin/        CRUD for all resources + reports
  settings/     Tax, printer, discount, database, text-size, order-approval
  printer/      Status, config, test
  payment/      Initiate, confirm, retry, cancel, get, list-by-order
  i18n/         Locales, translations
```

Glassmorphism module removed (M1, 2026-08-12) — rule is light-only, no glassmorphism.

## Table View (First Operational Screen — `/tables`)

The default landing after login. Visual table overview grouped by section.

**Backend endpoint:** `GET /api/tables` → `get_tables_with_orders(db)` returns every table enriched with:
```
{id, name, seats, active, section, sort,                # table fields
 order_id, order_number, order_status, order_total,      # active order
 items_count, opened_at, occupancy_seconds,              # bill state
 server_id, server_name,                                 # who opened
 payment_status, paid_amount, outstanding_amount}        # payment state
```

**GET /api/table-sections** → `{sections: [{name, color}]}` for the section filter.

**Tile fields (every one data-driven via `tableviewConfig`):**
name, seats, status, orderNumber, itemsCount, orderTotal, openedTime,
occupancy, server, paymentStatus, paidAmount, outstanding

`name` and `status` are always visible (table identifier + state are non-negotiable).
All other fields toggle from the Customize menu. Layout persists to
`localStorage` under `brewpos_tablesview_layout`.

**Tap flow:**
- Free table → confirmation dialog → `/order?table_id=N` (new bill)
- Occupied table → direct nav to `/order?order_id=N&table_id=N` (resume)
- Inactive table → dialog "Yes" button disabled

**Header:** counters (Free/Occupied/Partial/Total/Inactive), refresh button, Customize menu.

**i18n keys:** `tablesview.*` namespace in `en.ts` + `id.ts`.

## Module Contract

Frontend:
```typescript
interface Module {
  key: string;
  path: string;
  permission?: string;
  icon?: string;
  labelKey: string;
  enabled: boolean;
}
```

Backend modules export a FastAPI `router` and are loaded dynamically.

## File Map

```
Brew-POS-V2/
├── run.sh                       One-command run
├── README.md                    User guide
├── PROGRESS.md                  Build progress
├── AI-REFERENCE.md              This file
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI entry; dynamic module loading
│   │   ├── core/                config, security, permissions
│   │   ├── db/                  session, seed
│   │   ├── models/              ORM models (Role, User, Category, Product, Modifier*, Table, Order*, Payment)
│   │   ├── schemas/             Pydantic DTOs (all request/response schemas)
│   │   ├── services/            Business logic (crud, printer, escpos, tickets)
│   │   ├── modules/             Self-contained routers
│   │   │   ├── auth/router.py
│   │   │   ├── menu/router.py
│   │   │   ├── orders/router.py
│   │   │   ├── admin/router.py
│   │   │   ├── settings/router.py
│   │   │   ├── printer/router.py
│   │   │   ├── payment/router.py
│   │   │   └── i18n/router.py
│   │   └── ws/                  WebSocket hub
│   └── brewpos.db
└── frontend/
    ├── src/
    │   ├── main.tsx            React root (MonoThemeProvider + CssBaseline + App)
    │   ├── app/
    │   │   ├── App.tsx         Module-driven router
    │   │   └── moduleRegistry.ts
    │   ├── core/
    │   │   ├── api.ts          API client (all endpoints wired, Bearer auth)
    │   │   ├── store/index.ts  Redux store
    │   │   ├── ws.ts           WebSocket client
    │   │   ├── permissions.ts  usePermissions hook
    │   │   └── theme/monoTheme.tsx  Light theme tokens + provider (useTheme hook)
    │   ├── components/         POSCard, POSButton, POSTextField, POSChip, POSIcon, Shell
    │   ├── shared/             Shared UI patterns (dialog, header, keypad, etc.)
    │   └── modules/
    │       ├── auth/LoginPage.tsx
    │       ├── tables/TableViewPage.tsx
    │       ├── order/OrderPage.tsx
    │       ├── cashier/CashierPage.tsx
    │       ├── payment/PaymentDialog.tsx
    │       ├── kitchen/KitchenPage.tsx
    │       ├── bar/BarPage.tsx
    │       ├── admin/AdminPage.tsx
    │       ├── settings/SettingsPage.tsx + UISettingsPage.tsx
    │       ├── discount/DiscountPage.tsx
    │       ├── void/VoidPage.tsx
    │       └── multilingual/i18n/
    │           ├── en.ts
    │           ├── id.ts
    │           └── useT.ts
    └── vite.config.ts
└── docs/
    ├── UI-DESIGN-RULE.md          UI design specification (v1.0, ACTIVE)
    ├── UI-DESIGN-RULES.md         Summary pointer deferring to UI-DESIGN-RULE.md
    └── UI-DESIGN-AUDIT-REPORT.md  Historical tracking doc for migration compliance
```

## Key Services
- `submit_order()`: create order, single-bill-per-table guard, multi-tax calc
- `open_bill()`: cashier opens empty bill on a table
- `close_order()`: payment, empty bill delete, discount + tax calc
- `cancel_order()`: cancel or delete (if empty), item-level cancellation
- `void_order()`: status→void, zero totals, excluded from reports
- `append_items()`: waiter adds items to existing bill
- `accept_order()`: kitchen acknowledges order (open→accepted)
- `update_order_status()`: progress item status (new→preparing→ready→served)
- `_next_order_number()`: lowest missing # from 1 (recycles gaps)
- `today_stats()`: today_revenue, today_orders, open_tickets, avg_ticket

## Config Helpers (`backend/app/core/config.py`)
- `get_taxes()`, `set_taxes()`, `get_tax_rate()` — multi-tax support
- `get_discount_policy()`, `set_discount_policy()` — presets (amount/percent), max_discount_pct, require_reason
- `get_text_size()`, `set_text_size()` — global UI scale
- `get_active_db_url()`, `set_active_db_url()` — database URL persistence
- `reload_engine()` — swap DB without restart
- `_load_persisted()`, `_persist()` — atomic JSON read/write

## Printer Service (`backend/app/services/printer.py`)
- Modes: dummy, network (TCP), usb
- `auto_print_on_event()`: prints on `on_send_to_kitchen` / `on_payment` events
- `PrintResult`: ok, mode, dry_run, bytes_written, elapsed_ms, error

## Settings Persistence
- File: `backend/brewpos.settings.json`
- Keys: taxes, discount_policy, printer, database_url, text_size
- Override via env: `BREWPOS_SETTINGS_FILE`

## Permissions (PERMISSIONS tuple)
```
Page access: dashboard.view, cashier.view, waiter.view, kitchen.view, bar.view, menu.view, admin.view, settings.view
Task: order.open, order.close, order.cancel, order.discount, order.append, order.void, kitchen.serve, bar.serve
Admin: admin.manage_menu, manage_tables, manage_users, manage_settings, reports
```

## Role Defaults
```
admin/master: all permissions
cashier: dashboard.view, cashier.view, menu.view, order.open, order.close, order.cancel, order.discount, order.append
waiter: dashboard.view, waiter.view, menu.view, order.open, order.append
kitchen: dashboard.view, kitchen.view, bar.view, menu.view, kitchen.serve, bar.serve
bar: dashboard.view, kitchen.view, bar.view, menu.view, kitchen.serve, bar.serve
```

## Order Lifecycle
```
open → accepted → preparing → ready → served → paid
   \_______________> (empty: deleted)            void
```

## OrderItem Status
```
new → preparing → ready → served
   \_____> cancelled
```

## Station Routing
- `kitchen`: items with station in ("kitchen", "both")
- `bar`: items with station in ("bar", "both")
- Product.kind overrides category.kind; default is "kitchen"

## API Client (`frontend/src/core/api.ts`)
```typescript
const API_URL = 'http://localhost:8000';
// All requests send Authorization: Bearer <token> header
// Token stored in localStorage under 'brewpos_token'
// User object stored under 'brewpos_user' (includes role, permissions)
```

All endpoints wired:
- Auth: login, me
- Menu: getMenu, getTables, getTableSections
- Orders: listOrders, checkout, openBill, closeOrder, updateOrder, acceptOrder, cancelOrder, voidOrder, appendItems, printReceipt, printTicket, todayStats
- Admin: getCategories, getProducts, getUsers, getRoles, getAdminTables + CRUD for all
- Reports: getSalesSummary, getSalesByCategory, getItemSales, getPaymentMethods, getBillHistory
- Settings: getSettings, updateTax, updatePrinterSettings, testPrinter, getDiscountSettings, updateDiscountSettings, updateDatabase, reloadDatabase, resetDatabase, restoreDefaults, exportDatabase, importDatabase
- Payments: initiatePayment, confirmPayment, retryPayment, cancelPayment, getPayment, getPaymentsByOrder
- i18n: getLocales, getTranslations

## i18n
- `frontend/src/modules/multilingual/i18n/` — en.ts, id.ts
- `t(key)` function for translations
- `getStoredLocale()`, `setStoredLocale()` — locale in `localStorage` under `brewpos_locale`

## Adding a New Module
1. Create `frontend/src/modules/<name>/` with page component
2. Create `backend/app/modules/<name>/router.py` with FastAPI router
3. Add to `moduleRegistry.ts` (frontend) and `MODULE_REGISTRY` (backend)
4. Set `ENABLED_MODULES["<name>"] = True`

No core files touched. That's the point.
