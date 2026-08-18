# Brew-POS v2 — Current Project Status

Last reviewed: 2026-08-18

Brew-POS v2 is an actively developed restaurant and café POS. The current
working tree contains a consolidated React workspace backed by a modular
FastAPI API. The application is functional for local development, but should
still be treated as pre-production until the full API workflow and deployment
configuration are verified in a clean environment.

## Status summary

| Area | Status | Current state |
|---|---|---|
| Backend API | Complete for current scope | FastAPI app, SQLAlchemy models, JWT/PIN auth, permissions, WebSocket hub, and registered feature routers are present. |
| Frontend workspace | Complete for current scope | React/Vite/TypeScript workspace provides POS, kitchen, bar, cashier, admin, settings, and inventory screens. |
| Data-driven configuration | Implemented | Menu, tables, orders, roles, permissions, tax, discount, inventory, vouchers, printer, and application settings use API/database data. |
| Payments and order flow | Implemented | Checkout, open bills, item append, acceptance, close/cancel/void, payment processing, and order statistics are wired. |
| Reporting and administration | Implemented | User, role, category, product, table, settings, inventory, and sales/bill-history API workflows are present. |
| Production readiness | Not complete | Default credentials/secrets remain development-oriented; clean-environment API verification and deployment hardening remain. |

## Current stack

- Backend: Python 3, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic 2
- Persistence: SQLite by default; PostgreSQL via `psycopg`
- Security: JWT bearer tokens, PIN login, role and permission checks
- Realtime: FastAPI WebSocket hub at `/ws`
- Frontend: React 18, Vite 6, TypeScript, Lucide icons, CSS custom properties
- Tests: pytest and FastAPI `TestClient` tests in `backend/tests/`

## Implemented backend modules

The enabled router registry is defined in `backend/app/main.py` and currently
contains 12 modules:

- auth
- menu
- orders
- admin
- settings
- printer
- i18n
- payment
- tax
- discount
- inventory
- vouchers

Users, roles, tables, orders, payments, inventory, vouchers, and menu entities
also have dedicated model/service files where needed. The module status is
available from `GET /api/modules`.

## Implemented frontend screens

The current frontend is intentionally consolidated in `frontend/src/App.tsx`
with shared API, type, theme, component, and stylesheet files:

- PIN login and session recovery
- POS menu, modifiers, cart, table selection, checkout, and open bills
- Kitchen and bar station workflows
- Cashier order and payment workflows
- Admin CRUD and reporting views
- Settings for database, printer, tax, discount, order approval, and UI
- Inventory workspace and voucher API support
- Permission-aware navigation and responsive touch-oriented styling

The older frontend `app/`, `core/`, `modules/`, and `shared/` tree is no
longer the active implementation.

## Verification

Verified on 2026-08-18:

```text
cd frontend && npm run build
✓ vite production build passed
✓ 1,579 modules transformed
✓ output written to frontend/dist
```

Backend tests are present but were not runnable in the current shell because
the `pytest` executable is not installed. Run them after installing the
project dependencies:

```bash
PYTHONPATH=backend pytest -q
```

## Next work

- Install backend dependencies and run the complete API test suite.
- Exercise the main POS, station, payment, admin, and settings flows against a
  freshly seeded database.
- Replace development JWT secrets and default PINs before deployment.
- Add or confirm migration coverage for schema changes beyond the current
  additive startup migrations.
- Add frontend interaction tests and deployment documentation as the product
  moves toward production use.
