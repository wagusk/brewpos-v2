from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.modules.vouchers.models import Voucher

def list_vouchers(db: Session) -> list[Voucher]:
    return list(db.scalars(select(Voucher).order_by(Voucher.code)).all())

def create_voucher(db: Session, *, code: str, mode: str, value: float, active: bool = True) -> Voucher:
    v = Voucher(code=code.upper().strip(), mode=mode, value=value, active=active)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v

def delete_voucher(db: Session, vid: int) -> bool:
    v = db.get(Voucher, vid)
    if not v:
        return False
    db.delete(v)
    db.commit()
    return True

def validate_and_calculate_voucher(db: Session, code: str, subtotal: float) -> tuple[bool, float, str]:
    code = (code or "").upper().strip()
    v = db.scalar(select(Voucher).where(Voucher.code == code, Voucher.active.is_(True)))
    if not v:
        return False, 0.0, "Invalid or inactive voucher code"
    subtotal = float(subtotal or 0)
    if v.mode == "percent":
        discount_amount = round(subtotal * (v.value / 100.0), 2)
    else:
        discount_amount = round(min(subtotal, v.value), 2)
    return True, discount_amount, f"Voucher applied: {v.code}"
