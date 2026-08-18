from fastapi import APIRouter, Depends
from app.core.security import require_permission
from app.modules.users.models import User as UserModel
from app.modules.discount.schemas import DiscountPolicyIn, DiscountPolicyOut
from app.modules.discount.service import get_discount_policy, set_discount_policy

router = APIRouter(prefix="/api/admin/settings/discount", tags=["discount"])

@router.get("", response_model=DiscountPolicyOut)
def get_discount_settings(user: UserModel = Depends(require_permission("settings.view"))):
    return DiscountPolicyOut(**get_discount_policy())

@router.put("", response_model=DiscountPolicyOut)
def update_discount_settings(payload: DiscountPolicyIn, user: UserModel = Depends(require_permission("settings.manage_discount"))):
    patch = payload.model_dump(exclude_none=True)
    return DiscountPolicyOut(**set_discount_policy(patch))
