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
implementation is the consolidated [App.tsx](frontend/src/App.tsx) workspace,
with the API client in [api.ts](frontend/src/api.ts), shared styles, types, and
small reusable POS components.

The POS menu and modifier dialogs use the live menu API; station screens use
product routing returned by orders; admin and settings screens read and write
the corresponding backend resources.

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
│   ├── services/               CRUD, tickets, and printer services
│   └── ws/                     WebSocket hub
└── tests/                      API tests
docs/                           UI design and audit documents
run.sh                          Installer, build, seed, and runner script
requirements.txt                Python dependencies
```

## Testing

From the repository root:

```bash
PYTHONPATH=backend pytest -q
```

The tests cover health and root endpoints, login success/failure, menu and
table access, and admin authorization. Install the dependencies first if
`pytest` is not available in the current environment.

## License

Business Source License 1.1 — see [LICENSE](LICENSE) if present in the
distribution. On 2036-07-31, the Change Date, each release converts to the
Apache License 2.0.
