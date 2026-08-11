"""Printer module — public status only.

Config and test endpoints were moved to /api/admin/settings/printer
(handled by the settings module). This module keeps /api/printer/status
as a public, unauthenticated endpoint so the frontend can poll printer
connectivity from any terminal.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.services.printer import get_status

router = APIRouter(prefix="/api/printer", tags=["printer"])

class PrinterStatusOut(BaseModel):
    mode: str
    dry_run: bool

@router.get("/status", response_model=PrinterStatusOut)
def status():
    """Public printer status — no secrets exposed."""
    s = get_status()
    return PrinterStatusOut(mode=s["mode"], dry_run=s["dry_run"])
