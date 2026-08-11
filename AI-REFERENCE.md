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

## Architecture: Modular Registry

**Frontend:** `frontend/src/app/moduleRegistry.ts` — central manifest of all modules
**Backend:** `backend/app/main.py` — MODULE_REGISTRY dict + ENABLED_MODULES flags

Each feature is a self-contained folder:
```
modules/
  auth/         LoginPage (PIN pad, role-based redirect)
  cashier/      CashierPage (menu → cart → checkout → orders → close bills)
  waiter/       WaiterPage (menu → cart → open bill → send to kitchen)
  kitchen/      KitchenPage (order display, item status progression)
  bar/          BarPage (filtered order display for bar station)
  admin/        AdminPage (CRUD: categories, products, users, tables, roles + reports)
  settings/     SettingsPage (tax, printer, discount, database config)
  discount/     DiscountPage (bill history viewer)
  void/         VoidPage (void bills with required reason)
  glassmorphism/ Static dark theme (glassTheme.ts, GlassComponents.tsx)
  multilingual/ i18n module (pluggable)
  dashboard/    (placeholder)
```

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
│   │   │   └── i18n/router.py
│   │   └── ws/                  WebSocket hub
│   └── brewpos.db
└── frontend/
    ├── src/
    │   ├── main.tsx            React root (glassTheme + CssBaseline + App)
    │   ├── app/
    │   │   ├── App.tsx         Module-driven router (10+ routes)
    │   │   └── moduleRegistry.ts
    │   ├── core/
    │   │   ├── api.ts          API client (all endpoints wired, Bearer auth)
    │   │   ├── store/index.ts  Redux store (empty reducers)
    │   │   └── theme/index.ts  (deprecated — glassTheme used instead)
    │   ├── components/
    │   │   └── Shell.tsx       Glass sidebar + role-based nav + user chip
    │   └── modules/
    │       ├── auth/LoginPage.tsx
    │       ├── cashier/CashierPage.tsx
    │       ├── waiter/WaiterPage.tsx
    │       ├── kitchen/KitchenPage.tsx
    │       ├── bar/BarPage.tsx
    │       ├── admin/AdminPage.tsx
    │       ├── settings/SettingsPage.tsx
    │       ├── discount/DiscountPage.tsx
    │       ├── void/VoidPage.tsx
    │       └── multilingual/i18n/
    │           ├── en.ts
    │           ├── id.ts
    │           └── index.ts
    └── vite.config.ts
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
const API_URL = 'http://localhost:8001';
// All requests send Authorization: Bearer <token> header
// Token stored in localStorage under 'brewpos_token'
// User object stored under 'brewpos_user' (includes role, permissions)
```

All endpoints wired:
- Auth: login, me
- Menu: getMenu, getTables
- Orders: listOrders, checkout, openBill, closeOrder, updateOrder, acceptOrder, cancelOrder, voidOrder, appendItems, printReceipt
- Admin: getCategories, getProducts, getUsers, getRoles, getAdminTables + CRUD for all
- Reports: getSalesSummary, getSalesByCategory, getItemSales, getPaymentMethods, getBillHistory
- Settings: getSettings, updateTax, updatePrinterSettings, testPrinter, getDiscountSettings, updateDiscountSettings, updateDatabase, reloadDatabase, resetDatabase
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
