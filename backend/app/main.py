"""
Brew-POS v2 — Modular Backend API
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
import sys

from app.core.config import settings
from app.db.session import current_engine, Base, SessionLocal
from app.db.seed import run as run_seed
from app.modules.users.models import User as UserModel
from app.modules.roles.models import Role
from app.modules.menu.models import Category, Product, ModifierGroup, ModifierOption
from app.modules.tables.models import Table
from app.modules.orders.models import Order, OrderItem, OrderItemModifier
from app.modules.payment.models import Payment
from app.modules.inventory.models import StockItem
from app.modules.vouchers.models import Voucher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    stream=sys.stdout,
)

# ── Module Registry ─────────────────────────────────────────────────────
MODULE_REGISTRY: dict[str, str] = {
    "auth": "app.modules.auth.router",
    "menu": "app.modules.menu.router",
    "orders": "app.modules.orders.router",
    "admin": "app.modules.admin.router",
    "settings": "app.modules.settings.router",
    "printer": "app.modules.printer.router",
    "i18n": "app.modules.i18n.router",
    "payment": "app.modules.payment.router",
    "tax": "app.modules.tax.router",
    "discount": "app.modules.discount.router",
    "inventory": "app.modules.inventory.router",
    "vouchers": "app.modules.vouchers.router",
}

ENABLED_MODULES: dict[str, bool] = {
    "auth": True,
    "menu": True,
    "orders": True,
    "admin": True,
    "settings": True,
    "printer": True,
    "i18n": True,
    "payment": True,
    "tax": True,
    "discount": True,
    "inventory": True,
    "vouchers": True,
}


def load_modules(app: FastAPI) -> None:
    """Dynamically load and register all enabled modules."""
    for module_key, import_path in MODULE_REGISTRY.items():
        if not ENABLED_MODULES.get(module_key, False):
            continue
        try:
            module = __import__(import_path, fromlist=["router"])
            if hasattr(module, "router"):
                app.include_router(module.router)
                logging.info(f"Module loaded: {module_key}")
        except ImportError as e:
            logging.warning(f"Failed to load module {module_key}: {e}")


# ── Bootstrap ────────────────────────────────────────────────────────────
def _bootstrap_default_admin() -> None:
    try:
        sess = SessionLocal()
        try:
            if sess.query(UserModel).count() == 0:
                run_seed()
        finally:
            sess.close()
    except Exception:
        pass


Base.metadata.create_all(bind=current_engine())

# M28 - additive column migrations for tables
from sqlalchemy import text
with current_engine().begin() as _migrate:
    for _col, _ddl in (
        ("section", "VARCHAR(40) DEFAULT 'Main Hall'"),
        ("sort",    "INTEGER DEFAULT 0"),
    ):
        try:
            _migrate.execute(text(f"ALTER TABLE tables ADD COLUMN {_col} {_ddl}"))
        except Exception:
            pass

# One active bill per table. The service layer returns a readable validation
# error; this unique partial index also protects against concurrent requests.
with current_engine().begin() as _migrate:
    try:
        _migrate.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_one_active_bill_per_table "
            "ON orders (table_id) WHERE table_id IS NOT NULL "
            "AND status IN ('open', 'accepted', 'preparing', 'ready', 'served')"
        ))
    except Exception as _index_error:
        logging.warning("Could not create single-bill table index: %s", _index_error)

# M35 — additive column migrations for payment processing
with current_engine().begin() as _migrate:
    for _col, _ddl in (
        ("status",          "VARCHAR(20) DEFAULT 'pending'"),
        ("provider",        "VARCHAR(40) DEFAULT 'mock'"),
        ("external_id",     "VARCHAR(120) DEFAULT ''"),
        ("error_message",   "VARCHAR(200) DEFAULT ''"),
        ("amount_validated", "BOOLEAN DEFAULT 0"),
        ("updated_at",      "DATETIME"),
    ):
        try:
            _migrate.execute(text(f"ALTER TABLE payments ADD COLUMN {_col} {_ddl}"))
        except Exception:
            pass

# M36 — additive column migrations for orders (discount/tax support).
# Without these, fresh DBs can't insert because the legacy dev DB
# already has NOT NULL columns the model doesn't declare.
with current_engine().begin() as _migrate:
    for _col, _ddl in (
        ("discount",        "FLOAT DEFAULT 0.0 NOT NULL"),
        ("discount_reason", "VARCHAR(200) DEFAULT '' NOT NULL"),
        ("tax",             "FLOAT DEFAULT 0.0 NOT NULL"),
    ):
        try:
            _migrate.execute(text(f"ALTER TABLE orders ADD COLUMN {_col} {_ddl}"))
        except Exception:
            pass

_bootstrap_default_admin()

# ── App ───────────────────────────────────────────────────────────────────
app = FastAPI(title=settings.app_name, version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load all enabled modules
load_modules(app)

# Serve the compiled frontend when it is available. The API remains usable as
# a backend-only service when no frontend build has been produced yet.
_frontend_index = settings.frontend_dist / "index.html"
if _frontend_index.exists():
    _frontend_assets = settings.frontend_dist / "assets"
    if _frontend_assets.exists():
        app.mount("/assets", StaticFiles(directory=_frontend_assets), name="frontend-assets")

# WebSocket
from app.ws.hub import router as ws_router
app.include_router(ws_router)


@app.get("/")
def index():
    if _frontend_index.exists():
        return FileResponse(_frontend_index)
    return JSONResponse({
        "app": settings.app_name,
        "version": "2.0.0",
        "description": "Brew-POS v2 Modular Backend API Service (Backend Only)",
        "api_docs": "/docs",
        "health": "/health",
        "modules": list(ENABLED_MODULES.keys()),
    })


@app.get("/health")
def health():
    return {"ok": True, "app": settings.app_name, "version": "2.0.0"}


@app.get("/api/modules")
def list_modules():
    return {"modules": [{"key": k, "enabled": v} for k, v in ENABLED_MODULES.items()]}


@app.get("/{path:path}", include_in_schema=False)
def frontend_fallback(path: str):
    """Support browser-side navigation for the compiled frontend SPA."""
    if _frontend_index.exists() and not path.startswith(("api/", "docs", "openapi.json", "health", "ws")):
        return FileResponse(_frontend_index)
    return JSONResponse({"detail": "Not found"}, status_code=404)
