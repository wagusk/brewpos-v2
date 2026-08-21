from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import require_permission
from app.modules.users.models import User as UserModel
from app.modules.inventory.schemas import StockOut, StockUpdateIn
from app.modules.inventory.service import get_stock_levels, update_stock

router = APIRouter(prefix="/api/admin/inventory", tags=["inventory"])

@router.get("", response_model=list[StockOut])
def list_stock(db: Session = Depends(get_db), user: UserModel = Depends(require_permission("inventory.view"))):
    return [StockOut.model_validate(s) for s in get_stock_levels(db)]

@router.put("/products/{product_id}", response_model=StockOut)
def update_product_stock(product_id: int, payload: StockUpdateIn, db: Session = Depends(get_db), user: UserModel = Depends(require_permission("admin.manage_menu"))):
    item = update_stock(db, product_id, payload.quantity, payload.low_stock_threshold)
    return StockOut.model_validate(item)
