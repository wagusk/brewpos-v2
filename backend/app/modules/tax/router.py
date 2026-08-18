from fastapi import APIRouter, Depends
from app.core.security import require_permission
from app.modules.users.models import User as UserModel
from app.modules.tax.schemas import TaxIn
from app.modules.tax.service import get_taxes, set_taxes, get_tax_rate

router = APIRouter(prefix="/api/admin/settings/tax", tags=["tax"])

@router.get("")
def get_tax_settings(user: UserModel = Depends(require_permission("settings.view"))):
    return {"taxes": get_taxes(), "tax_rate": get_tax_rate()}

@router.put("")
def update_tax_settings(payload: TaxIn, user: UserModel = Depends(require_permission("settings.manage_tax"))):
    set_taxes([t.model_dump() for t in payload.taxes])
    return {"taxes": get_taxes(), "tax_rate": get_tax_rate()}
