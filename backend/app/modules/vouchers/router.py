from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import require_permission
from app.modules.users.models import User as UserModel
from app.modules.vouchers.schemas import VoucherOut, VoucherIn, VoucherValidateIn
from app.modules.vouchers.service import list_vouchers, create_voucher, delete_voucher, validate_and_calculate_voucher

router = APIRouter(prefix="/api/vouchers", tags=["vouchers"])

@router.get("", response_model=list[VoucherOut])
def get_vouchers(db: Session = Depends(get_db), user: UserModel = Depends(require_permission("settings.view"))):
    return [VoucherOut.model_validate(v) for v in list_vouchers(db)]

@router.post("", response_model=VoucherOut)
def post_voucher(payload: VoucherIn, db: Session = Depends(get_db), user: UserModel = Depends(require_permission("admin.manage_settings"))):
    try:
        v = create_voucher(db, code=payload.code, mode=payload.mode, value=payload.value, active=payload.active)
        return VoucherOut.model_validate(v)
    except Exception as e:
        raise HTTPException(400, str(e))

@router.delete("/{vid}")
def remove_voucher(vid: int, db: Session = Depends(get_db), user: UserModel = Depends(require_permission("admin.manage_settings"))):
    ok = delete_voucher(db, vid)
    if not ok:
        raise HTTPException(404, "Voucher not found")
    return {"deleted": vid}

@router.post("/validate")
def validate_voucher(payload: VoucherValidateIn, db: Session = Depends(get_db), user: UserModel = Depends(require_permission("pos.view"))):
    valid, discount, message = validate_and_calculate_voucher(db, payload.code, payload.subtotal)
    if not valid:
        raise HTTPException(400, message)
    return {"valid": True, "discount_amount": discount, "message": message}
