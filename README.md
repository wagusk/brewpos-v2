# Brew-POS v2

Brew-POS v2 is a modular restaurant and café point-of-sale application built
with a React/Vite frontend and a FastAPI/SQLAlchemy backend. The frontend is
data-driven: menu, tables, orders, permissions, roles, taxes, discounts,
inventory, vouchers, printer configuration, database settings, and order-flow
settings are loaded from the backend rather than embedded in the UI.

## Current stack

- Python 3
- FastAPI and Uvicorn
- SQLAlchemy 2
- SQLite by default; PostgreSQL is supported through `psycopg`
- JWT bearer authentication with PIN-based login
- WebSocket endpoint for real-time order updates
- Pydantic request and response schemas
- pytest tests using FastAPI's `TestClient`
- React 18, Vite, TypeScript, and Lucide icons

Install the dependencies from [requirements.txt](requirements.txt).

## Quick start

The one-command runner installs both dependency sets, builds the frontend,
seeds the database, and serves the compiled application from the backend:

```bash
./run.sh
```

For frontend development, start the API and Vite separately. Create or
activate a virtual environment, install dependencies, and start the API from
the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The compiled application and API are available at `http://localhost:8000`;
the Vite development application is available at `http://localhost:5173`.

- Health check: `GET /health`
- Service information: `GET /` when no frontend build is present
- Interactive API documentation: `http://localhost:8000/docs`
- WebSocket updates: `ws://localhost:8000/ws`

The database is created and seeded automatically when the application starts
with an empty user table. To seed it explicitly:

```bash
python -m app.db.seed
```

Run that command from the `backend` directory, or set `PYTHONPATH=backend` when
running it from the repository root.

## Default accounts

The seed creates these users and roles:

| User | PIN | Role |
|---|---:|---|
| Superuser | `8888` | `superuser` |
| Admin | `9999` | `admin` |
| Cashier | `1111` | `cashier` |
| Waiter | `2222` | `waiter` |
| Kitchen | `3333` | `kitchen` |

The `bar` role is also seeded as a role. PINs are for local development only;
change them and the JWT secret before using the service in production.

Roles and users support granular permission toggles, including page access,
menu/table/user/settings management, order actions, and history/report access.
The `superuser` role always has every permission enabled.

## Current frontend workspaces

The frontend provides role-aware workspaces for point of sale, kitchen, bar,
cashier, administration, inventory, and settings. Navigation is filtered by
the authenticated user's permissions and enabled backend modules. The active
implementation is split across `frontend/src/App.tsx` (router + shell, ~235
lines) and per-screen modules under `frontend/src/screens/`:

|| Screen | File | Purpose |
||---|---|---|
|| `Login` | `screens/Login.tsx` | PIN pad with role-based session restore |
|| `POS` | `screens/POS.tsx` | Table grid, bill editor, cart, save + print + cancel |
|| `Station` | `screens/Station.tsx` | Kitchen and bar ticket queues (filtered by station) |
|| `Cashier` | `screens/Cashier.tsx` | Partial-payment flow with bill picker + method |
|| `Admin` | `screens/Admin.tsx` | 3-level menu (section → item → period) for products, categories, tables, users, roles, inventory, sales reports, bill history |
|| `Settings` | `screens/Settings.tsx` | 6-tab settings (general, appearance, tax, discount, printer, database) |
|| `Inventory` | `screens/Inventory.tsx` | Stock levels and threshold editor (admin sub-tab) |
|| `Dashboard` | `screens/Dashboard.tsx` | Floor status + role-based access list (currently inactive UI) |

Cross-cutting code lives in:

|| Directory | Purpose |
||---|---|
|| `App.tsx` | Router shell + sidebar |
|| `api.ts` | Typed API client (all endpoints wired, Bearer auth) |
|| `types.ts` | Shared TypeScript types (`User`, `Menu`, `Order`, etc.) |
|| `theme.ts` | UI token storage (radii, scale) persisted to `localStorage` |
|| `common/` | Shared helpers: `can()`, `useToast()`, `money()`, `title()`, `PanelTitle`/`Loading`/`Empty`/`Metric` chrome, `Screen` type, `Notify` type |
|| `screens/settings/` | Settings tab sub-components (one per tab) |
|| `screens/admin/` | Admin sub-components (dialog editor, resource table, reports, bill history) + menu schema + field schema |
|| `components/` | Stubs only — `POSCard`, `POSButton`, `POSChip`, `POSIcon`, `POSTextField` are not in active use |

The POS menu and modifier dialogs use the live menu API; station screens use
product routing returned by orders; admin and settings screens read and write
the corresponding backend resources. UI styling uses semantic CSS classes
(`.panel`, `.primary`, `.secondary`, `.metric`, `.setting-value`, etc.)
defined in `frontend/src/styles.css`, with runtime-adjustable radii and
heights from `theme.ts`.

## Backend modules

All enabled API modules are registered in `backend/app/main.py` and expose
FastAPI routers:

- `auth` — PIN login and current-user lookup
- `menu` — categories, products, modifiers, tables, and table sections
- `orders` — checkout, open bills, item append, order lifecycle, void/cancel,
  ticket and receipt printing, and daily statistics
- `payment` — payment initiation, confirmation, retry, cancellation, and lookup
- `admin` — CRUD for users, roles, categories, products, and tables, plus sales
  and bill-history reports
- `settings` — database, printer, text-size, and order-approval settings
- `tax` and `discount` — configurable tax and discount policies
- `inventory` — product stock tracking
- `vouchers` — voucher management and validation
- `printer` — printer status
- `i18n` — available locales and translations

The backend registry currently enables 12 modules. Supporting model and
service packages for users, roles, tables, orders, payments, inventory, and
vouchers are kept alongside the routers where appropriate.

The module status endpoint is `GET /api/modules`.

## Authentication and permissions

Login with a PIN:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"pin":"9999"}'
```

Use the returned access token as a bearer token for protected endpoints. Access
is controlled by role and granular permissions defined in
`backend/app/core/permissions.py`. Admin and master roles have full access;
cashier, waiter, kitchen, and bar roles receive focused permissions.

## Configuration

Settings use the `BREWPOS_` environment prefix and can also be loaded from a
`.env` file:

| Variable | Default | Purpose |
|---|---|---|
| `BREWPOS_DATABASE_URL` | `sqlite:///backend/brewpos.db` | SQLAlchemy database URL |
| `BREWPOS_JWT_SECRET` | Development secret | JWT signing secret; change in production |
| `BREWPOS_JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `BREWPOS_JWT_EXPIRE_MINUTES` | `720` | Token lifetime |
| `BREWPOS_SETTINGS_FILE` | `backend/brewpos.settings.json` | Persisted application settings |
| `BREWPOS_HOST` | `0.0.0.0` | Uvicorn bind host when using `run.sh` |
| `BREWPOS_PORT` | `8000` | Uvicorn bind port when using `run.sh` |

Database settings can also be changed at runtime through the admin settings
API. The application supports SQLite and PostgreSQL URLs.

## Project layout

```text
backend/
├── app/
│   ├── main.py                 FastAPI application and module registry
│   ├── core/                   Configuration, security, and permissions
│   ├── db/                     Session management and seed data
│   ├── modules/                Feature routers, models, and services
│   ├── schemas/                Pydantic request/response models
│   ├── services/               CRUD, tickets, and printer services
│   └── ws/                     WebSocket hub
└── tests/                      API tests
frontend/
├── src/
│   ├── App.tsx                 Router shell + sidebar (~235 lines)
│   ├── api.ts                  API client with Bearer auth
│   ├── types.ts                Shared TypeScript types
│   ├── theme.ts                UI token storage + localStorage
│   ├── styles.css              Semantic CSS classes
│   ├── common/                 Cross-screen helpers (can, useToast, format, chrome)
│   ├── screens/                Per-screen modules
│   │   ├── Admin.tsx, Cashier.tsx, Dashboard.tsx, Inventory.tsx,
│   │   ├── Login.tsx, POS.tsx, Settings.tsx, Station.tsx
│   │   ├── admin/              Admin sub-components + schemas
│   │   └── settings/           Settings tab sub-components
│   └── components/             POS* component stubs (not in active use)
docs/                           UI design documents (mostly historical)
run.sh                          Installer, build, seed, and runner script
requirements.txt                Python dependencies
```

## Recent changes

For detailed change history, see `git log` or the recent commits at
https://github.com/wagusk/brewpos-v2/commits/master. Notable refactors:

- **Frontend modular split** — `App.tsx` reduced from 2,652 to 235 lines; the
  remaining components live in `screens/`, `screens/admin/`, and
  `screens/settings/`. Shared helpers consolidated into `common/`.
- **Notification type deduplication** — the `Notify` callback type was
  defined identically in six screens; now declared once in
  `common/useToast.ts`.
- **Schema consistency fix** — `orders.discount`, `orders.discount_reason`,
  and `orders.tax` columns are now declared on the `Order` model so fresh
  databases (built via `Base.metadata.create_all`) match the legacy dev
  schema. A startup ALTER TABLE migration backfills older databases.

## Testing

From the `backend` directory:

```bash
PYTHONPATH=. python -m pytest tests/ -q
```

The current test suite contains 11 tests covering:

- `/health` and `/` (root, including SPA HTML fallback)
- PIN login (success + failure)
- Menu and tables access
- Admin authorization (cashier denied, admin allowed)
- Cashier checkout permissions regression
- Order model schema (discount/discount_reason/tax columns present)
- OrderOut schema fields

Install the dependencies first if `pytest` is not available in the current
environment.

## License

Business Source License 1.1 — see [LICENSE](LICENSE) if present in the
distribution. On 2036-07-31, the Change Date, each release converts to the
Apache License 2.0.
