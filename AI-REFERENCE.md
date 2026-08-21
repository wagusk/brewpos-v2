# Brew-POS v2 — AI Reference (Condensed)

> Modular POS: FastAPI + SQLite + Vite/React + TypeScript.
> Run: `./run.sh` → http://localhost:8000 | Admin PIN: 9999
> UI: Light theme, lucide-react icons, semantic CSS classes

## Stack

- **Backend**: FastAPI, SQLAlchemy 2.0, SQLite (PostgreSQL via `psycopg`), JWT
  (python-jose), bcrypt, WebSocket hub
- **Frontend**: Vite 6, React 18, TypeScript, lucide-react icons
- **State**: React `useState`/`useEffect` per component (no Redux/Zustand)
- **Routing**: simple `Screen` type + ternary in `App.tsx` (no React Router)
- **Realtime**: WebSocket hub broadcasts `order_created`, `order_updated`,
  `order_item_updated`, `order_cancelled`, `order_deleted` events. Most
  screens use `api.*()` polling instead of subscribing — WS broadcast is
  fire-and-forget from the backend.
- **Roles**: superuser, admin, master, cashier, waiter, kitchen, bar
- **Theme**: Light theme via `frontend/src/styles.css` + runtime-adjustable
  radii/scale from `frontend/src/theme.ts` (`localStorage` key `brewpos_ui`)

## File Map

```
Brew-POS-V2/
├── run.sh                       One-command run
├── README.md                    User guide
├── PROGRESS.md                  Build progress
├── AI-REFERENCE.md              This file
├── AGENTS.md                    Coding rules
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI entry; module registry
│   │   ├── core/                config, security, permissions, JWT
│   │   ├── db/                  session, seed
│   │   ├── models/              ORM models (Role, User, Category, Product, Modifier*, Table, Order*, Payment)
│   │   ├── schemas/             Pydantic DTOs (request/response models)
│   │   ├── services/            Business logic (crud, tickets, printer)
│   │   ├── modules/             Self-contained routers
│   │   │   ├── auth/router.py
│   │   │   ├── menu/router.py
│   │   │   ├── orders/router.py
│   │   │   ├── admin/router.py
│   │   │   ├── settings/router.py
│   │   │   ├── printer/router.py
│   │   │   ├── payment/router.py
│   │   │   ├── tax/router.py
│   │   │   ├── discount/router.py
│   │   │   ├── inventory/router.py
│   │   │   ├── vouchers/router.py
│   │   │   └── i18n/router.py
│   │   └── ws/                  WebSocket hub
│   ├── tests/                   pytest + FastAPI TestClient
│   └── brewpos.db
└── frontend/
    ├── src/
    │   ├── main.tsx            React root (renders App)
    │   ├── App.tsx             Router shell + sidebar (~235 lines)
    │   ├── api.ts              API client (Bearer auth, all endpoints)
    │   ├── types.ts            Shared TypeScript types
    │   ├── theme.ts            UISettings + localStorage persistence
    │   ├── styles.css          Semantic CSS classes
    │   ├── common/             Cross-screen helpers
    │   │   ├── auth.ts         can(user, permission) check
    │   │   ├── useToast.ts     useToast() hook + Notify type
    │   │   ├── format.ts       money(), title()
    │   │   ├── chrome.tsx      PanelTitle, Loading, Empty, Metric
    │   │   └── screen.ts       Screen route type
    │   ├── screens/            Per-screen modules
    │   │   ├── Login.tsx       PIN pad
    │   │   ├── POS.tsx         Table grid, bill editor, cart
    │   │   ├── Station.tsx     Kitchen + bar ticket queues
    │   │   ├── Cashier.tsx     Partial-payment flow
    │   │   ├── Admin.tsx       3-level menu orchestrator
    │   │   ├── admin/          Admin sub-components
    │   │   │   ├── menu.ts        types + ADMIN_MENU + pickFirstDetailId
    │   │   │   ├── fields.ts      ADMIN_FIELDS schema
    │   │   │   ├── AdminResourceDialog.tsx
    │   │   │   ├── ResourceTable.tsx
    │   │   │   ├── Reports.tsx
    │   │   │   └── BillHistory.tsx
    │   │   ├── Settings.tsx    6-tab settings orchestrator
    │   │   ├── settings/       Settings sub-components
    │   │   │   ├── GeneralSettings.tsx
    │   │   │   ├── AppearanceSettings.tsx
    │   │   │   ├── SettingValue.tsx
    │   │   │   ├── TaxSettings.tsx
    │   │   │   ├── DiscountSettings.tsx
    │   │   │   ├── PrinterSettings.tsx
    │   │   │   └── DatabaseSettings.tsx
    │   │   ├── Inventory.tsx   Stock levels editor
    │   │   └── Dashboard.tsx   Floor status (inactive)
    │   └── components/         POS* component STUBS — NOT in active use
    │       ├── POSCard.tsx     (5-line stub, unused)
    │       ├── POSButton.tsx   (8-line stub, unused)
    │       ├── POSChip.tsx     (8-line stub, unused)
    │       ├── POSIcon.tsx     (5-line stub, unused)
    │       └── POSTextField.tsx (7-line stub, unused)
    └── vite.config.ts
└── docs/
    ├── UI-DESIGN-RULE.md       Historical design spec — superseded; describes
    │                           POSCard/POSButton/etc. design system that was
    │                           never adopted (current code uses raw HTML +
    │                           semantic CSS classes)
    ├── UI-DESIGN-RULES.md      Summary pointer to UI-DESIGN-RULE.md — superseded
    └── UI-DESIGN-AUDIT-REPORT.md  Historical tracking doc — superseded
```

## Permissions (PERMISSIONS tuple)

Defined in `backend/app/core/permissions.py`.

```
Page access: dashboard.view, pos.view, menu.view, kitchen.view, bar.view,
             admin.view, settings.view, history.view, inventory.view
Task: order.open, order.close, order.cancel, order.discount, order.append,
      order.void, order.accept, kitchen.serve, bar.serve
Admin: admin.manage_menu, admin.manage_tables, admin.manage_users,
       admin.manage_settings, admin.reports, admin.manage_tax,
       admin.discount_manage
```

## Role Defaults (`backend/app/core/permissions.py:default_permissions`)

```
superuser: all 21 permissions (granted unconditionally)
admin/master: all 21 permissions (granted unconditionally)
cashier: dashboard.view, pos.view, menu.view, order.open, order.close,
         order.cancel, order.append (7)
waiter: dashboard.view, pos.view, menu.view, order.open, order.append (5)
kitchen: dashboard.view, pos.view, menu.view, kitchen.serve, order.accept (5)
bar: dashboard.view, pos.view, menu.view, order.accept, bar.serve (5)
```

The frontend `can()` in `frontend/src/common/auth.ts` mirrors these defaults
plus a fallback map for cashier/waiter/kitchen/bar so legacy users with
empty `permissions` arrays still get correct access.

## Order Lifecycle

```
open → accepted → preparing → ready → served → paid
   \_____________→ (empty: deleted)             void
cancel  (allowed at any stage before paid; item-level allowed)
```

## OrderItem Status

```
new → preparing → ready → served
   \_____→ cancelled
```

## Station Routing

- `kitchen`: items with `product.kind` in (`kitchen`, `both`)
- `bar`: items with `product.kind` in (`bar`, `both`)
- Product.kind overrides category.kind; default is `kitchen`

## API Client (`frontend/src/api.ts`)

```typescript
const API_ROOT = import.meta.env.VITE_API_URL ?? ""
// Token stored in module-scoped var + localStorage under 'brewpos_token'
// All requests send Authorization: Bearer *** (if token present)
// Errors throw Error with .message = response.detail or "Request failed (status)"
```

Endpoints exposed (selected):

- **Auth**: `login(pin)`, `me()`
- **Menu**: `menu()`, `tables()`, `sections()`
- **Orders**: `orders(query)`, `order(id)`, `checkout(body)`, `openBill(body)`,
  `appendItems(id, body)`, `updateOrder(id, body)`, `acceptOrder(id)`,
  `closeOrder(id, body)`, `cancelOrder(id, body)`, `voidOrder(id, body)`,
  `printTicket(id)`, `printReceipt(id)`, `stats()`
- **Payments**: `payments(orderId)`, `initiatePayment(body)`, `confirmPayment(body)`
- **Settings**: `settings()`, `updateSettings(path, body, method)`,
  `printer()`, `updatePrinter(body)`, `testPrinter()`, `taxes()`,
  `updateTaxes(body)`, `discount()`, `updateDiscount(body)`
- **Inventory**: `stock()`, `updateStock(id, body)`
- **Admin CRUD**: `resource<T>(path)`, `mutate<T>(path, method, body?)`
- **Vouchers**: `vouchers()`, `validateVoucher(body)`

## Key Services (`backend/app/services/__init__.py`)

- `submit_order()`: create order, single-bill-per-table guard, multi-tax calc
- `open_bill()`: cashier opens empty bill on a table
- `close_order()`: payment, empty bill delete, partial payments supported
- `cancel_order()`: cancel or delete (if empty), item-level cancellation
- `void_order()`: status→void, zero totals, excluded from reports
- `append_items()`: waiter adds items to existing bill
- `accept_order()`: kitchen acknowledges order (open→accepted)
- `update_order_status()`: progress item status (new→preparing→ready→served)
- `_next_order_number()`: lowest missing # from 1 (recycles gaps)
- `today_stats()`: today_revenue, today_orders, open_tickets, avg_ticket

## Schema Notes (Migrations)

The DB layer uses `Base.metadata.create_all()` at startup plus additive ALTER
TABLE migrations for columns that predate the current model. As of 2026-08-21:

- **M28** — adds `section`, `sort` to `tables` if missing
- **M35** — adds `status`, `provider`, `external_id`, `error_message`,
  `amount_validated`, `updated_at` to `payments` if missing
- **M36** — adds `discount`, `discount_reason`, `tax` to `orders` if missing
- **Partial unique index** `uq_orders_one_active_bill_per_table` — one
  active bill per table at a time

## Config Helpers (`backend/app/core/config.py`)

- `get_taxes()`, `set_taxes()`, `get_tax_rate()` — multi-tax support
- `get_discount_policy()`, `set_discount_policy()` — presets, max_discount_pct, require_reason
- `get_text_size()`, `set_text_size()` — global UI scale
- `get_active_db_url()`, `set_active_db_url()` — database URL persistence
- `reload_engine()` — swap DB without restart
- `_load_persisted()`, `_persist()` — atomic JSON read/write to `brewpos.settings.json`

## Printer Service (`backend/app/services/printer.py`)

- Modes: dummy, network (TCP), usb
- `auto_print_on_event()`: prints on `on_send_to_kitchen` / `on_payment` events
- `PrintResult`: ok, mode, dry_run, bytes_written, elapsed_ms, error

## Settings Persistence

- File: `backend/brewpos.settings.json`
- Keys: taxes, discount_policy, printer, database_url, text_size,
  order_approval_required
- Override via env: `BREWPOS_SETTINGS_FILE`

## UI Conventions (current, not MUI)

- **No external UI library** (no MUI, no Chakra, no Ant Design). Raw HTML
  elements with semantic CSS classes in `frontend/src/styles.css`.
- **Icons**: `lucide-react` (e.g. `import { Plus, Pencil } from "lucide-react"`).
- **Theme tokens**: `frontend/src/theme.ts` defines `UISettings` (radii,
  fontScale, buttonHeight, cardGap, sidebarWidth, bottomBarHeight,
  animationMs). Defaults in `DEFAULT_UI`. Persisted to `localStorage`
  under `brewpos_ui`. Applied via CSS custom properties
  (`var(--ui-card-radius)`, etc.) set in `styles.css`.
- **Permission gating**: every interactive element calls `can(user, perm)`
  from `frontend/src/common/auth.ts`. The frontend permission model mirrors
  the backend's role defaults so users with empty `permissions` arrays
  still get correct access.
- **Toasts**: `useToast()` hook in `common/useToast.ts`; toast is rendered
  by `App.tsx` based on hook state. `notify(message, kind?)` is the
  shared callback type (`Notify`).
- **Modals**: `<div className="modal-backdrop">` + `<section className="modal">`.
  No portal — render inline where needed.

## Adding a New Screen

1. Create `frontend/src/screens/<Name>.tsx` exporting `default` function
2. If it needs shared helpers, import from `../common`
3. Register the route in `App.tsx` `Screen` type (`common/screen.ts`) and
   add a ternary render in `App.tsx`
4. Add sidebar item in `App.tsx` `Sidebar` `items` array
5. Add a permission entry in `backend/app/core/permissions.py` if needed

No module registry. No router library. No state manager. Just files and a
ternary.

## Historical (Do Not Follow)

- `frontend/src/components/POSCard.tsx` etc. are 5-8 line stubs from an
  earlier proposed design system that was never adopted. The code uses
  raw HTML + CSS classes, not these components.
- `docs/UI-DESIGN-RULE.md` describes the never-adopted POSCard/POSButton
  design system. It is superseded by `frontend/src/styles.css` and
  `frontend/src/theme.ts`.
- The `app/`, `core/`, `modules/`, `shared/` tree under `frontend/src/`
  mentioned in earlier revisions of this file does not exist in the
  current code. Per-screen modules live under `frontend/src/screens/`.
