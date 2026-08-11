# Brew-POS v2

A modular, extensible Point-of-Sale for restaurants and cafes.

**Every feature is a module. Every module is pluggable.**

```
./run.sh
```

Then open `http://localhost:8000` on any terminal.

---

## Architecture

Brew-POS v2 uses a **modular registry** pattern. Every feature (orders, void, discount, printer, multilingual, etc.) lives in its own folder and self-registers via a central manifest.

### Frontend
```
frontend/src/
├── app/
│   ├── App.tsx              # Module-driven router
│   └── moduleRegistry.ts    # Central module manifest
├── core/                    # Cross-cutting infrastructure
│   ├── Shell.tsx
│   ├── store/
│   ├── theme/
│   └── ws/
├── modules/                 # Feature modules (each self-contained)
│   ├── auth/               # Login, session, JWT
│   ├── cashier/            # Cashier workspace
│   ├── waiter/             # Waiter workspace
│   ├── kitchen/            # Kitchen display
│   ├── bar/                # Bar display
│   ├── admin/              # Admin CRUD, reports
│   ├── settings/           # Device/environment config
│   ├── discount/           # Discount module (pluggable)
│   ├── void/               # Void module (pluggable)
│   ├── multilingual/       # i18n module (pluggable)
│   │   └── i18n/
│   │       ├── en.ts
│   │       ├── id.ts
│   │       └── useT.ts
│   └── dashboard/          # Dashboard overview
└── types/                  # Shared TS types
```

### Backend
```
backend/app/
├── main.py                  # App entry; loads modules dynamically
├── core/                    # config, security, permissions, db
├── db/                      # session, seed
├── models/                  # ORM models
├── schemas/                 # Pydantic DTOs
├── modules/                 # Self-contained FastAPI routers
│   ├── orders/router.py
│   ├── discount/router.py
│   ├── void/router.py
│   ├── printer/router.py
│   ├── auth/router.py
│   ├── menu/router.py
│   ├── admin/router.py
│   ├── settings/router.py
│   └── i18n/router.py
└── ws/hub.py               # WebSocket endpoint
```

---

## Module Contract

Every module exports a standard shape:

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

Backend modules export a FastAPI `router` and are loaded via `ENABLED_MODULES` feature flags.

---

## Features

- **Multi-terminal sync** — Cashier, Waiter, Kitchen, Bar terminals see the same orders in real time via WebSocket
- **Touch-friendly UI** — Big buttons (48–72px), grid layout, 12px rounded corners, light theme
- **Roles** — `admin`, `master`, `cashier`, `waiter`, `kitchen`, `bar` with granular permissions
- **PIN login** — Tap a 4–8 digit PIN, no usernames/passwords
- **Modifiers** — Required/single-select & optional/multi-select groups per product
- **Tables** — Floor-plan view with open-bill color coding
- **Payments** — Cash / card / mobile with tendered + change
- **Station routing** — Products route to kitchen, bar, or both
- **Station-isolated serving** — Kitchen and bar operate independently
- **Single-bill-per-table** — Only one open bill per table
- **Permission-based access** — Granular per-user permissions
- **Dynamic roles** — Admin can create/edit roles with custom permissions
- **Multiple taxes** — Custom names and rates, stacked calculation
- **Discount presets** — Fixed or percent, configurable by admin
- **Order voiding** — Admin can void any order (stays in DB, status=void)
- **Printer integration** — ESC/POS, network/usb/dummy modes
- **Multilingual UI** — English + Bahasa Indonesia, extensible
- **Database portability** — URL editor, reload, reset, export/import
- **Modular architecture** — Every feature is a pluggable module

---

## Quick Start

### 1. Run

```bash
cd Brew-POS-V2
./run.sh
```

### 2. Login

| Role | PIN | What they see |
|------|-----|---------------|
| Admin | `9999` | Dashboard with live stats, reports, user/product/table/role management |
| Cashier | `1111` | Floor plan + bill view. Open bills, pay, reprint receipts |
| Waiter | `2222` | Floor-plan view, take orders, add to existing bills, send to kitchen |
| Kitchen | `3333` | Live ticket board, mark items ready/served |
| Bar | `3333` | Live drink ticket board, independent from kitchen |

---

## Adding a New Module

1. Create folder in `frontend/src/modules/<name>/`
2. Create folder in `backend/app/modules/<name>/`
3. Add entry to `frontend/src/app/moduleRegistry.ts`
4. Add entry to `backend/app/main.py` MODULE_REGISTRY dict
5. Set `ENABLED_MODULES["<name>"] = True`

That's it. No touching core files.

---

## Configuration

| Var | Default | Description |
|-----|---------|-------------|
| `BREWPOS_DATABASE_URL` | `sqlite:///backend/brewpos.db` | SQLAlchemy URL |
| `BREWPOS_JWT_SECRET` | dev value | JWT signing key (CHANGE IN PROD) |
| `BREWPOS_JWT_EXPIRE_MINUTES` | `720` | Token lifetime (12 h) |
| `BREWPOS_HOST` | `0.0.0.0` | Bind host |
| `BREWPOS_PORT` | `8000` | Bind port |

---

## Order Flow

```
Waiter                    Kitchen / Bar              Cashier
  │                           │                         │
  ├─ Open Bill (or new) ──────┤                         │
  ├─ Add items ──────────────►│                         │
  ├─ Send to Kitchen ────────►│                         │
  │                           ├─ Start → Ready → Served │
  │                           │                         │
  │                           ├─ (all items served) ──►├─ Auto-bump to "served"
  │                           │                         ├─ Pay Bill → paid
  │                           │                         └─ Receipt
```

---

## License

Business Source License 1.1 — see [LICENSE](LICENSE).

On **2036-07-31** (the Change Date), each release converts to the **Apache License 2.0**.
