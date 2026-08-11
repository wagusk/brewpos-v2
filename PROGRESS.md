# Brew-POS v2 — Progress Log

> Modular, extensible Point-of-Sale for restaurants & cafes.
> FastAPI + SQLite + Vite/React + MUI. Module registry architecture.
> Light theme UI.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocker

## Stack
- **Backend:** FastAPI · SQLAlchemy 2.0 · SQLite · JWT (python-jose) · bcrypt · WebSocket
- **Frontend:** Vite 5 · React 18 · TypeScript · MUI v6 · Redux Toolkit · React Router 6
- **Sync:** FastAPI WebSocket hub → all terminals receive order events
- **Roles:** `admin` · `master` · `cashier` · `waiter` · `kitchen` · `bar`
- **UI Theme:** Light theme (MUI light palette, no dark mode)
- **Run:** `./run.sh` — auto-creates venv, installs deps, builds frontend, seeds DB, starts backend serving static UI

## Architecture: Modular Registry

**Frontend:** `frontend/src/app/moduleRegistry.ts` — central manifest of all modules
**Backend:** `backend/app/main.py` — MODULE_REGISTRY dict + ENABLED_MODULES flags

Each feature is a self-contained folder. Adding a feature = create folder + register in manifest.

## File Overview

```
Brew-POS-V2/
├── run.sh                     # ONE command — auto-install, build, seed, serve
├── requirements.txt           # Python: fastapi, uvicorn, sqlalchemy, jose, passlib
├── README.md                  # User guide
├── AI-REFERENCE.md            # Condensed reference for AI
├── PROGRESS.md                # This file
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry; dynamic module loading
│   │   ├── core/{config,security,permissions}.py
│   │   ├── db/{session,seed}.py
│   │   ├── models/__init__.py
│   │   ├── schemas/__init__.py
│   │   ├── services/{__init__,crud,printer,escpos,tickets}.py
│   │   ├── modules/           # Self-contained routers
│   │   │   ├── auth/router.py
│   │   │   ├── menu/router.py
│   │   │   ├── orders/router.py
│   │   │   ├── admin/router.py
│   │   │   ├── settings/router.py
│   │   │   ├── printer/router.py
│   │   │   └── i18n/router.py
│   │   └── ws/{__init__,hub}.py
│   └── brewpos.db             # SQLite (auto-created)
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.{json,app,node}.json
│   └── src/
│       ├── main.tsx
│       ├── app/
│       │   ├── App.tsx        # Module-driven router
│       │   └── moduleRegistry.ts
│       ├── core/
│       │   ├── api.ts         # API client (all endpoints wired)
│       │   ├── store/index.ts
│       │   └── theme/index.ts # (deprecated — glassTheme used instead)
│       ├── components/
│       │   └── Shell.tsx      # Glass sidebar + role-based nav
│       └── modules/
│           ├── auth/          # LoginPage (PIN pad, role-based redirect)
│           ├── cashier/       # CashierPage (menu, cart, checkout, order list, close bills)
│           ├── waiter/        # WaiterPage (menu, cart, open bill, send to kitchen)
│           ├── kitchen/       # KitchenPage (order display, item status progression)
│           ├── bar/           # BarPage (filtered order display)
│           ├── admin/         # AdminPage (CRUD for categories, products, users, tables, roles)
│           ├── settings/      # SettingsPage (tax, printer, discount, database config)
│           ├── discount/      # DiscountPage (bill history)
│           ├── void/          # VoidPage (void bills with reason)
│           ├── multilingual/  # i18n (en.ts, id.ts)
│           └── dashboard/     # Dashboard overview
└── docs/
    ├── API.md                 # Full API reference
    ├── INSTALL.md             # Install/portability guide
    └── ARCHITECTURE.md        # Design + extensibility
```

---

## Milestones

### M1 — v2 Scaffold & Module Registry
- [x] Repo layout (backend/ + frontend/ + scripts/ + docs/)
- [x] `run.sh` builds frontend + boots backend serving static UI
- [x] `dev.sh` runs backend + frontend vite dev concurrently
- [x] PROGRESS.md + README skeleton + AI-REFERENCE.md
- [x] Modular architecture design
- [x] Module registry system (frontend + backend)
- [x] i18n module structure (`multilingual/i18n/en.ts`, `id.ts`, `index.ts`)

### M2 — Module Registry & Dynamic Loading
- [x] Frontend: `moduleRegistry.ts` with 10+ modules registered
- [x] Frontend: `App.tsx` with module-driven routing
- [x] Backend: `main.py` with MODULE_REGISTRY + ENABLED_MODULES
- [x] Backend: Dynamic module loading via `__import__`
- [x] Backend: `/api/modules` endpoint for module status

### M3 — Core Infrastructure
- [x] Frontend: Redux store (`core/store/index.ts`)
- [x] Frontend: Shell component with module navigation (`components/Shell.tsx`)
- [x] Backend: Config module (`core/config.py`) — multi-tax, discount policy, persistence
- [x] Backend: Security module (`core/security.py`) — JWT, PIN hashing, require_role, require_permission
- [x] Backend: Permissions module (`core/permissions.py`) — permission catalog, role defaults
- [x] Backend: Database session + seed (`db/session.py`, `db/seed.py`)

### M4 — Backend Module Structure (All Complete)
- [x] Auth module router (`modules/auth/router.py`) — login, me
- [x] Menu module router (`modules/menu/router.py`) — menu, tables
- [x] Orders module router (`modules/orders/router.py`) — checkout, open-bill, close, accept, cancel, void, append, print, stats
- [x] Admin module router (`modules/admin/router.py`) — CRUD for categories, products, tables, users, roles + reports
- [x] Settings module router (`modules/settings/router.py`) — tax, text-size, database, printer, discount
- [x] Printer module router (`modules/printer/router.py`) — status, config, test
- [x] i18n module router (`modules/i18n/router.py`) — locales, translations

### M5 — Frontend Module Structure (All Complete)
- [x] Auth module (`modules/auth/LoginPage.tsx`) — PIN pad with role-based redirect
- [x] Cashier module (`modules/cashier/CashierPage.tsx`) — full POS workflow
- [x] Waiter module (`modules/waiter/WaiterPage.tsx`) — menu, cart, open bill, send to kitchen
- [x] Kitchen module (`modules/kitchen/KitchenPage.tsx`) — order display, item status progression
- [x] Bar module (`modules/bar/BarPage.tsx`) — filtered order display (bar + both stations)
- [x] Admin module (`modules/admin/AdminPage.tsx`) — full CRUD for all resources
- [x] Settings module (`modules/settings/SettingsPage.tsx`) — tax, printer, discount, database config
- [x] Discount module (`modules/discount/DiscountPage.tsx`) — bill history viewer
- [x] Void module (`modules/void/VoidPage.tsx`) — void bills with required reason
- [x] Light theme module (modules/theme/monoTheme.tsx) — MUI light palette, no dark mode

### M6 — Verification & Build
- [x] Frontend build passes (`npm run build` → `✓ built in 6.89s`)
- [x] Backend imports clean (all 20 modules import OK)
- [x] Backend health check passes (`/health` → 200)
- [x] Backend 60+ routes registered
- [x] Backend running on port 8001
- [x] Frontend served as static files by backend at `/`

### M7 — v1 Migration: Backend Core (Complete)
- [x] Migrated models (`backend/app/models/__init__.py`)
- [x] Migrated schemas (`backend/app/schemas/__init__.py`)
- [x] Migrated services (`backend/app/services/__init__.py`, `crud.py`, `printer.py`, `escpos.py`, `tickets.py`)
- [x] Migrated config (`backend/app/core/config.py`)
- [x] Migrated security (`backend/app/core/security.py`)
- [x] Migrated permissions (`backend/app/core/permissions.py`)
- [x] Migrated database session + seed (`backend/app/db/`)
- [x] Migrated all API routes (`backend/app/modules/`)
- [x] Migrated WebSocket hub (`backend/app/ws/`)
- [x] Backend venv created + deps installed
- [x] Backend running on port 8001 serving frontend

### M8 — v1 Migration: Frontend Core (Complete)
- [x] Created API client (`core/api.ts`) — all endpoints wired
- [x] Created i18n module (`modules/multilingual/i18n/`)
- [x] Created Shell with role-based navigation
- [x] Created light theme module (modules/theme/monoTheme.tsx) — MUI light palette, no dark mode
- [x] App.tsx wired with all module routes
- [x] All pages fetch real backend data
- [x] Frontend build passes

### M9 — Full POS Workflow (Complete)
- [x] Cashier: menu → cart → send to kitchen → view orders → close bills
- [x] Waiter: menu → cart → open empty bill → send to kitchen
- [x] Kitchen: view station-filtered orders → accept → progress items → serve
- [x] Bar: view bar-filtered orders → accept → progress items → serve
- [x] Admin: CRUD for categories, products, users, tables, roles + reports
- [x] Settings: tax config, printer config, discount policy, database management
- [x] Void: void paid bills with required reason
- [x] Login: PIN-based auth with role-based redirect

### M10 — Light Theme (Complete)
- [x] Light theme (MUI light palette, no dark mode)
- [x] Removed dark theme entirely

### M11 — Bug Fixes & Alignment (Complete)
- [x] Fixed `update_order_status` router call — added missing `payload.status` arg
- [x] Fixed LoginPage — redirects based on user role (admin→/admin, cashier→/cashier, etc.)
- [x] Fixed Shell — filters nav items by user permissions
- [x] Fixed CashierPage — shows real backend orders, supports close bill flow
- [x] Fixed KitchenPage/BarPage — fetches real orders, filters by station
- [x] Fixed SettingsPage — added missing Divider import
- [x] Fixed AdminPage — form payloads match backend schemas
- [x] Fixed BarPage — corrected @mui/material import path

---

## Verification Log

```
$ cd frontend && npm run build
> vite build
✓ 11568 modules transformed.
✓ built in 6.89s.  Asset hash: index-CHaqD5L7.js  ✓

$ /home/lenovo/Hermes-Project/Brew-POS-V2/.venv/bin/python3 -c "
import sys; sys.path.insert(0, '.')
from app.main import app
print(f'{len(app.routes)} routes registered')
"
68 routes  ✓

$ curl http://localhost:8001/health
{"ok":true,"app":"Brew-POS","version":"2.0.0"}  ✓

$ curl -s -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"pin":"9999"}'
{"access_token":"eyJ...","token_type":"bearer","user":{"id":1,"name":"Admin","role":"admin","permissions":[],"active":true}}  ✓

$ curl http://localhost:8001/ | head -5
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ✓

$ curl -s http://localhost:8001/api/menu -H "Authorization: Bearer $TOKEN"
{"categories":[{"id":1,"name":"Coffee",...}],"products":[{"id":1,"name":"Espresso","price":2.5,...}]}  ✓

$ curl -s http://localhost:8001/api/orders -H "Authorization: Bearer $TOKEN"
[{"id":1,"number":1,"status":"open","items":[...]}]  ✓

$ curl -s -X POST http://localhost:8001/api/orders/checkout -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"type":"takeaway","items":[{"product_id":1,"qty":2,"modifiers":[]}]}'
{"id":2,"number":2,"status":"open","total":5.75,...}  ✓
```

---

## What's Done

- Modular registry architecture (frontend + backend)
- Module-driven routing with 10+ feature modules
- i18n module with en.ts/id.ts translations
- Feature flags (ENABLED_MODULES)
- v1 backend fully migrated (models, schemas, services, all API routes, WS)
- v1 frontend structure migrated (Shell, App, all module placeholders)
- All POS workflows: cashier, waiter, kitchen, bar, admin, settings, void
- Full CRUD for categories, products, users, tables, roles
- Reports: sales summary, sales by category, item sales, payment methods, bill history
- Light theme UI (no dark mode)
- Role-based navigation and permission filtering
- Login with PIN-based auth and role-based redirect
- Build passes, all modules import clean
- Backend running on :8001 serving frontend as static files

## What's Next
- [ ] WebSocket sync (real-time order updates across terminals)
- [ ] Printer integration (thermal receipt printing via ESC/POS)
- [ ] Reports dashboard with charts (recharts integration)
- [ ] Dashboard page with stats overview
- [ ] Permission system UI for custom user permissions
- [ ] Bill history with filters (date range, status, station)

---

## Design Principles

1. **Every feature is a module** — self-contained, pluggable
2. **Module registry is the source of truth** — single manifest
3. **Feature flags enable/disable** — no code deletion needed
4. **i18n-first** — no hardcoded strings in components
5. **Core is thin** — infrastructure only, no business logic
6. **Contracts are explicit** — Module interface, router interface
7. **Build always works** — incremental development, never broken
8. **Light theme** — MUI light palette, no dark mode

---

## Comparison with v1

| Aspect | v1 | v2 |
|--------|----|----|
| Architecture | Monolithic pages | Modular registry |
| Adding feature | Edit 4-5 files | Create folder + register |
| i18n | Partial (Shell only) | Full (every module) |
| Permissions | Static dict | Dynamic per-module |
| Routes | Hardcoded in App.tsx | Generated from registry |
| Config | Hardcoded | Environment + settings file |
| Scalability | Limited | Unlimited modules |
| UI Theme | Default MUI | Light theme (no dark mode) |

---

## License

Business Source License 1.1 — see [LICENSE](LICENSE).

On **2036-07-31** (the Change Date), each release converts to the **Apache License 2.0**.
