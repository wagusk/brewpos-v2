"""
Brew-POS v2 — Modular Backend

Each module is a self-contained FastAPI router.
Adding a feature = create folder + register in MODULE_REGISTRY.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import logging
import sys

from app.core.config import settings
from app.db.session import current_engine, Base, SessionLocal
from app.db.seed import run as run_seed
from app.models import User as UserModel

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
}

ENABLED_MODULES: dict[str, bool] = {
    "auth": True,
    "menu": True,
    "orders": True,
    "admin": True,
    "settings": True,
    "printer": True,
    "i18n": True,
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

# WebSocket
from app.ws.hub import router as ws_router
app.include_router(ws_router)


@app.get("/health")
def health():
    return {"ok": True, "app": settings.app_name, "version": "2.0.0"}


@app.get("/api/modules")
def list_modules():
    return {"modules": [{"key": k, "enabled": v} for k, v in ENABLED_MODULES.items()]}


# --- Static frontend (must be AFTER all api routes) ---
FRONTEND_DIST = settings.frontend_dist
if FRONTEND_DIST.exists():
    assets = FRONTEND_DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/")
    def index():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith(("api", "ws", "docs", "openapi", "health", "assets")):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        file = FRONTEND_DIST / full_path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def no_frontend():
        return JSONResponse({
            "app": settings.app_name,
            "version": "2.0.0",
            "message": "Frontend not built. Run `npm install && npm run build` in frontend/",
            "api_docs": "/docs",
        })
