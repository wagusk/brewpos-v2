# Brew-POS v2 — Current Project Status

Last reviewed: 2026-08-21

Brew-POS v2 is an actively developed restaurant and café POS. The current
working tree contains a modular React workspace backed by a modular FastAPI
API. The application is functional for local development, but should still
be treated as pre-production until deployment hardening (default secrets,
clean-environment verification) is complete.

## Status summary

| Area | Status | Current state |
|---|---|---|
| Backend API | Complete for current scope | FastAPI app, SQLAlchemy models, JWT/PIN auth, permissions, WebSocket hub, and registered feature routers are present. |
| Frontend workspace | Complete for current scope | Per-screen modules under `frontend/src/screens/`; shared helpers in `common/`; semantic CSS in `styles.css`. |
| Data-driven configuration | Implemented | Menu, tables, orders, roles, permissions, tax, discount, inventory, vouchers, printer, and application settings use API/database data. |
| Payments and order flow | Implemented | Checkout, open bills, item append, acceptance, close/cancel/void, payment processing, and order statistics are wired. |
| Reporting and administration | Implemented | User, role, category, product, table, settings, inventory, and sales/bill-history API workflows are present. |
| Production readiness | Not complete | Default credentials/secrets remain development-oriented; deployment hardening remains. |

## Current stack

- Backend: Python 3, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic 2
- Persistence: SQLite by default; PostgreSQL via `psycopg`
- Security: JWT bearer tokens, PIN login, role and permission checks
- Realtime: FastAPI WebSocket hub at `/ws`
- Frontend: React 18, Vite 6, TypeScript, Lucide icons, semantic CSS classes
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

The frontend is split into per-screen modules under `frontend/src/screens/`:

| Screen | File | Purpose |
|---|---|---|
| Login | `Login.tsx` | PIN pad with role-based session restore |
| POS | `POS.tsx` | Table grid, bill editor, cart, save/print/cancel |
| Station | `Station.tsx` | Kitchen and bar ticket queues |
| Cashier | `Cashier.tsx` | Partial-payment flow with bill picker |
| Admin | `Admin.tsx` | 3-level menu + per-resource sub-components in `admin/` |
| Settings | `Settings.tsx` | 6-tab settings with sub-components in `settings/` |
| Inventory | `Inventory.tsx` | Stock levels editor |
| Dashboard | `Dashboard.tsx` | Floor status (currently inactive UI) |

Cross-cutting helpers in `frontend/src/common/`:

- `auth.ts` — `can(user, permission)` permission check
- `useToast.ts` — `useToast()` hook + `Notify` callback type
- `format.ts` — `money()`, `title()` formatters
- `chrome.tsx` — `PanelTitle`, `Loading`, `Empty`, `Metric` primitives
- `screen.ts` — `Screen` route type

## Verification

Verified on 2026-08-21:

```text
cd frontend && npm run build
✓ vite production build passed
✓ 1,608 modules transformed
✓ output written to frontend/dist
```

```text
cd backend && PYTHONPATH=. python -m pytest tests/ -q
...........                                                       [100%]
11 passed, 1 warning in ~21s
```

End-to-end smoke verified against a fresh server:

- Cashier PIN `1111` login → checkout → accept → close (full payment)
- Partial payment flow (pay 1/2, then pay the rest)
- Admin `/api/admin/inventory`, `/api/admin/settings/tax`, `/api/admin/users`
  all return 200
- Cashier permission gating (403 on admin endpoints)

## Recent changes

17 commits on the working branch since 2026-08-18. Highlights:

- **Frontend modular split** — `App.tsx` reduced from 2,652 to 235 lines.
  Settings (629 → 177), Admin (636 → 145), and the rest split into
  per-screen modules.
- **`Notify` type de-duplication** — was defined identically in 6 screen
  files; now declared once in `common/useToast.ts`.
- **`Order` model schema completeness** — `discount`, `discount_reason`,
  and `tax` columns are now declared on the model. The M36 startup ALTER
  TABLE migration backfills legacy databases. Without this, fresh DBs
  would fail every checkout with `NOT NULL constraint failed:
  orders.discount`.
- **POS actions wired** — Print (kitchen ticket or paid receipt) and
  Cancel (with reason) actions on the bill panel are now functional.
  Discount was removed from POS because it's a payment-time concept
  already handled by the Cashier screen.

## Next work

- Replace development JWT secrets and default PINs before deployment.
- Add or confirm migration coverage for future schema changes beyond the
  current additive startup migrations (M28 tables, M35 payments, M36 orders).
- Resolve the dev-only `jose/jwt.py` deprecation warning
  (`datetime.utcnow` in third-party library).
- Add frontend interaction tests (the current suite is backend-only).
- Production deployment documentation (Docker, environment configuration).
- Consider adopting or removing the unused `POSCard`/`POSButton`/etc.
  component stubs in `frontend/src/components/`.

