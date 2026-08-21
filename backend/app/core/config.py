"""Brew-POS configuration. Single source of truth."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BACKEND_DIR / "brewpos.db"

# ── Settings persistence ────────────────────────────────────────────
SETTINGS_FILE = Path(
    os.environ.get("BREWPOS_SETTINGS_FILE", str(BACKEND_DIR / "brewpos.settings.json"))
)

# ── UI scale defaults ─────────────────────────────────────────────
DEFAULT_TEXT_SIZE = 1.0


def get_text_size() -> float:
    return float(_load_persisted().get("text_size", DEFAULT_TEXT_SIZE))


def get_order_approval_required() -> bool:
    return bool(_load_persisted().get("order_approval_required", True))


def set_order_approval_required(value: bool) -> None:
    data = _load_persisted()
    data["order_approval_required"] = bool(value)
    _persist(data)


def set_text_size(size: float) -> None:
    data = _load_persisted()
    data["text_size"] = max(0.8, min(1.5, float(size)))
    _persist(data)


# ── POS operations (per-terminal knobs) ─────────────────────────────
DEFAULT_AUTO_PRINT_KITCHEN = True
DEFAULT_AUTO_PRINT_RECEIPT = True
DEFAULT_STATION = "kitchen"
DEFAULT_TERMINAL_NAME = "Front Counter"
DEFAULT_TERMINAL_LOCATION = ""


def get_pos_ops() -> dict:
    """POS-terminal-specific knobs (terminal identity + automation toggles)."""
    p = _load_persisted()
    return {
        "auto_print_on_send_to_kitchen": bool(
            p.get("auto_print_on_send_to_kitchen", DEFAULT_AUTO_PRINT_KITCHEN)
        ),
        "auto_print_on_payment": bool(
            p.get("auto_print_on_payment", DEFAULT_AUTO_PRINT_RECEIPT)
        ),
        "default_station": str(p.get("default_station") or DEFAULT_STATION),
        "terminal_name": str(p.get("terminal_name") or DEFAULT_TERMINAL_NAME).strip()
        or DEFAULT_TERMINAL_NAME,
        "terminal_location": str(p.get("terminal_location") or "").strip(),
    }


def set_pos_ops(updates: dict) -> dict:
    """Persist any subset of POS operations knobs. Returns the full new state."""
    if not isinstance(updates, dict):
        raise ValueError("pos ops payload must be an object")
    data = _load_persisted()
    if "auto_print_on_send_to_kitchen" in updates:
        data["auto_print_on_send_to_kitchen"] = bool(
            updates["auto_print_on_send_to_kitchen"]
        )
    if "auto_print_on_payment" in updates:
        data["auto_print_on_payment"] = bool(updates["auto_print_on_payment"])
    if "default_station" in updates:
        station = str(updates["default_station"] or "").strip().lower()
        if station not in ("kitchen", "bar", "both"):
            raise ValueError("default_station must be kitchen, bar, or both")
        data["default_station"] = station
    if "terminal_name" in updates:
        name = str(updates["terminal_name"] or "").strip()
        if not name:
            raise ValueError("terminal_name cannot be empty")
        if len(name) > 80:
            raise ValueError("terminal_name too long (max 80 chars)")
        data["terminal_name"] = name
    if "terminal_location" in updates:
        loc = str(updates["terminal_location"] or "").strip()
        if len(loc) > 120:
            raise ValueError("terminal_location too long (max 120 chars)")
        data["terminal_location"] = loc
    _persist(data)
    return get_pos_ops()


# ── Table sections (M28) ──────────────────────────────────────────
DEFAULT_TABLE_SECTIONS: list[dict] = [
    {"name": "Main Hall", "color": "#5b8def"},
    {"name": "Patio",     "color": "#10b981"},
    {"name": "Bar",       "color": "#f59e0b"},
    {"name": "Private",   "color": "#a855f7"},
]


def get_table_sections() -> list[dict]:
    persisted = _load_persisted()
    stored = persisted.get("table_sections")
    if not isinstance(stored, list) or not stored:
        return [dict(s) for s in DEFAULT_TABLE_SECTIONS]
    seen: set[str] = set()
    out: list[dict] = []
    for raw in stored:
        if not isinstance(raw, dict):
            continue
        name = str(raw.get("name") or "").strip()
        if not name or name in seen:
            continue
        color = str(raw.get("color") or "#5b8def")
        if not (color.startswith("#") and len(color) == 7):
            color = "#5b8def"
        out.append({"name": name, "color": color})
        seen.add(name)
    return out or [dict(s) for s in DEFAULT_TABLE_SECTIONS]


def set_table_sections(sections: list[dict]) -> list[dict]:
    data = _load_persisted()
    cleaned: list[dict] = []
    seen: set[str] = set()
    for raw in sections or []:
        if not isinstance(raw, dict):
            continue
        name = str(raw.get("name") or "").strip()
        if not name or name in seen:
            continue
        color = str(raw.get("color") or "#5b8def")
        if not (color.startswith("#") and len(color) == 7):
            color = "#5b8def"
        cleaned.append({"name": name, "color": color})
        seen.add(name)
    data["table_sections"] = cleaned or [dict(s) for s in DEFAULT_TABLE_SECTIONS]
    _persist(data)
    return get_table_sections()


def _load_persisted() -> dict:
    if not SETTINGS_FILE.exists():
        return {}
    try:
        import json
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _persist(data: dict) -> None:
    import json
    import os
    tmp = SETTINGS_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, SETTINGS_FILE)


class Settings(BaseSettings):
    app_name: str = "Brew-POS"
    database_url: str = f"sqlite:///{DB_PATH}"
    jwt_secret: str = "brewpos-dev-secret-change-me-please-32chars-min"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 12
    frontend_dist: Path = BACKEND_DIR.parent / "frontend" / "dist"
    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(env_prefix="BREWPOS_", env_file=".env", extra="ignore")


settings = Settings()


def get_active_db_url() -> str:
    persisted = _load_persisted()
    if persisted.get("database_url"):
        return persisted["database_url"]
    return settings.database_url


def set_active_db_url(url: str) -> None:
    data = _load_persisted()
    data["database_url"] = url
    _persist(data)


def reset_persisted_settings() -> None:
    if SETTINGS_FILE.exists():
        SETTINGS_FILE.unlink()
