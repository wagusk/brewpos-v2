"""Settings module — tax, discount, printer, database, text-size."""
from __future__ import annotations
import os
import re
import shutil
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.orm import Session
from sqlalchemy import inspect as sa_inspect

from app.db.session import get_db, reload_engine, current_engine, Base
from app.db.seed import run as run_seed
from app.core.config import (
    BACKEND_DIR, DB_PATH, SETTINGS_FILE, DEFAULT_TAXES,
    get_active_db_url, get_tax_rate, get_taxes, set_taxes,
    get_text_size, set_text_size, set_active_db_url,
    reset_persisted_settings, get_discount_policy, set_discount_policy,
)
from app.core.security import current_user, require_role
from app.models import User as UserModel
from app.services.crud import count_products, count_users
from app.services.printer import (
    DEFAULT_CONFIG as PRINTER_DEFAULTS, PrintResult,
    get_config as get_printer_config, get_status as get_printer_status,
    print_bytes, update_config as update_printer_config,
)

router = APIRouter(prefix="/api/admin/settings", tags=["settings"])


class TaxIn(BaseModel):
    taxes: list[dict]

    @field_validator("taxes")
    @classmethod
    def _validate_taxes(cls, v):
        if not v:
            raise ValueError("At least one tax is required")
        for tax in v:
            if "name" not in tax or "rate" not in tax:
                raise ValueError("Each tax must have 'name' and 'rate'")
            if not isinstance(tax["rate"], (int, float)) or tax["rate"] < 0 or tax["rate"] > 1:
                raise ValueError(f"Tax rate must be between 0 and 1: {tax}")
        return v


class DatabaseUrlIn(BaseModel):
    database_url: str = Field(min_length=8)

    @field_validator("database_url")
    @classmethod
    def _accept(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("sqlite://") or v.startswith("postgresql://") or v.startswith("mysql://")):
            raise ValueError("URL must start with sqlite://, postgresql://, or mysql://")
        return v


class SettingsOut(BaseModel):
    tax_rate: float
    taxes: list[dict]
    text_size: float
    database_url: str
    default_database_url: str
    db_kind: str
    db_file_exists: bool
    product_count: int
    user_count: int
    discount_policy: dict


def _kind(url: str) -> str:
    if url.startswith("sqlite://"):
        return "sqlite"
    if url.startswith("postgresql://"):
        return "postgresql"
    if url.startswith("mysql://"):
        return "mysql"
    return "other"


def _file_path_for_sqlite(url: str) -> Path | None:
    if not url.startswith("sqlite://"):
        return None
    p = url[len("sqlite://"):]
    if p.startswith("/") or p.startswith("."):
        return Path(p).resolve()
    return None


def _ensure_settings_dir() -> None:
    url = get_active_db_url()
    fp = _file_path_for_sqlite(url)
    if fp:
        fp.parent.mkdir(parents=True, exist_ok=True)


def _sqlite_filename_for_export(url: str) -> str:
    fp = _file_path_for_sqlite(url)
    if fp is None:
        return "brewpos.db"
    return fp.name


def _build_settings_out(db: Session) -> SettingsOut:
    url = get_active_db_url()
    fp = _file_path_for_sqlite(url)
    return SettingsOut(
        tax_rate=get_tax_rate(),
        taxes=get_taxes(),
        text_size=get_text_size(),
        database_url=url,
        default_database_url=f"sqlite:///{DB_PATH}",
        db_kind=_kind(url),
        db_file_exists=(fp.exists() if fp else True),
        product_count=count_products(db),
        user_count=count_users(db),
        discount_policy=get_discount_policy(),
    )


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    return _build_settings_out(db)


@router.put("/tax", response_model=SettingsOut)
def update_tax(payload: TaxIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    set_taxes(payload.taxes)
    return _build_settings_out(db)


@router.put("/text-size", response_model=SettingsOut)
def update_text_size(payload: dict, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    size = float(payload.get("text_size", 1.0))
    set_text_size(size)
    return _build_settings_out(db)


@router.put("/database", response_model=SettingsOut)
def update_database(payload: DatabaseUrlIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    set_active_db_url(payload.database_url)
    return _build_settings_out(db)


@router.post("/database/reload", response_model=SettingsOut)
def reload_database(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    url = get_active_db_url()
    _ensure_settings_dir()
    try:
        reload_engine(url)
    except Exception as e:
        raise HTTPException(400, f"Failed to bind to {url}: {e}")
    from app.db.session import SessionLocal
    sess = SessionLocal()
    try:
        if count_users(sess) == 0:
            run_seed()
    finally:
        sess.close()
    return _build_settings_out(db)


@router.post("/database/reset", response_model=SettingsOut)
def reset_database(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    engine = current_engine()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    run_seed()
    return _build_settings_out(db)


@router.post("/database/restore-defaults")
def restore_default_settings(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    reset_persisted_settings()
    reload_engine()
    run_seed()
    return _build_settings_out(db)


@router.get("/database/export")
def export_database(user: UserModel = Depends(require_role("admin"))):
    url = get_active_db_url()
    if not url.startswith("sqlite://"):
        raise HTTPException(400, "Export is only supported for SQLite databases.")
    fp = _file_path_for_sqlite(url)
    if fp is None or not fp.exists():
        raise HTTPException(404, "No SQLite file at the active path.")
    return FileResponse(path=str(fp), filename=_sqlite_filename_for_export(url), media_type="application/octet-stream")


class ImportIn(BaseModel):
    contents_b64: str = Field(min_length=8)


@router.post("/database/import", response_model=SettingsOut)
def import_database(payload: ImportIn, db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    import base64
    url = get_active_db_url()
    if not url.startswith("sqlite://"):
        raise HTTPException(400, "Import is only supported for SQLite databases.")
    fp = _file_path_for_sqlite(url)
    if fp is None:
        raise HTTPException(400, "Active SQLite URL has no file path.")
    try:
        raw = base64.b64decode(payload.contents_b64, validate=True)
        if not raw.startswith(b"SQLite format 3"):
            raise ValueError("Not a SQLite file (bad magic header)")
    except Exception as e:
        raise HTTPException(400, f"Bad payload: {e}")
    backup = fp.with_suffix(fp.suffix + ".bak")
    if fp.exists():
        shutil.copy2(fp, backup)
    fp.parent.mkdir(parents=True, exist_ok=True)
    fp.write_bytes(raw)
    reload_engine(url)
    return _build_settings_out(db)


# ── Printer settings ─────────────────────────────────────────────────
class PrinterSettingsOut(BaseModel):
    mode: str
    network: dict
    usb: dict
    paper: dict
    auto_print: dict
    dry_run: bool


class PrinterSettingsIn(BaseModel):
    mode: str | None = None
    network: dict | None = None
    usb: dict | None = None
    paper: dict | None = None
    auto_print: dict | None = None
    dry_run: bool | None = None

    @field_validator("mode")
    @classmethod
    def _mode_allowed(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = ("dummy", "network", "usb")
        if v not in allowed:
            raise ValueError(f"mode must be one of {allowed}")
        return v


class PrintResultOut(BaseModel):
    ok: bool
    mode: str
    dry_run: bool
    bytes_written: int
    elapsed_ms: int
    error: str | None = None


@router.get("/printer", response_model=PrinterSettingsOut)
def get_printer_settings(user: UserModel = Depends(require_role("admin"))):
    cfg = get_printer_config()
    return PrinterSettingsOut(**cfg)


@router.put("/printer", response_model=PrinterSettingsOut)
def update_printer_settings(payload: PrinterSettingsIn, user: UserModel = Depends(require_role("admin"))):
    patch = {k: v for k, v in payload.model_dump().items() if v is not None}
    cfg = update_printer_config(patch)
    return PrinterSettingsOut(**cfg)


@router.post("/printer/test", response_model=PrintResultOut)
def test_printer(db: Session = Depends(get_db), user: UserModel = Depends(require_role("admin"))):
    from app.services.tickets import build_test_ticket
    payload = build_test_ticket(db)
    res: PrintResult = print_bytes(payload)
    return PrintResultOut(**res.to_dict())


# ── Discount policy ──────────────────────────────────────────────────
class DiscountPresetIn(BaseModel):
    label: str = Field(min_length=1, max_length=32)
    mode: str = Field(default="amount", pattern=r"^(amount|percent)$")
    value: float = Field(gt=0, le=10000)

    @model_validator(mode="after")
    def _cap_percent(self):
        if self.mode == "percent" and self.value > 100:
            raise ValueError("value must be <= 100 when mode='percent'")
        return self


class DiscountPolicyOut(BaseModel):
    max_discount_pct: float
    presets: list[DiscountPresetIn]
    require_reason: bool


class DiscountPolicyIn(BaseModel):
    max_discount_pct: float | None = Field(default=None, ge=0, le=1)
    presets: list[DiscountPresetIn] | None = None
    require_reason: bool | None = None


@router.get("/discount", response_model=DiscountPolicyOut)
def get_discount_settings(user: UserModel = Depends(require_role("admin"))):
    return DiscountPolicyOut(**get_discount_policy())


@router.put("/discount", response_model=DiscountPolicyOut)
def update_discount_settings(payload: DiscountPolicyIn, user: UserModel = Depends(require_role("admin"))):
    patch = payload.model_dump(exclude_none=True)
    return DiscountPolicyOut(**set_discount_policy(patch))
