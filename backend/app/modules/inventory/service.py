from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.modules.inventory.models import StockItem

def get_stock_levels(db: Session) -> list[StockItem]:
    return list(db.scalars(select(StockItem)).all())

def update_stock(db: Session, product_id: int, quantity: float | None, threshold: float | None) -> StockItem:
    item = db.scalar(select(StockItem).where(StockItem.product_id == product_id))
    if not item:
        item = StockItem(product_id=product_id, quantity=quantity or 0.0, low_stock_threshold=threshold or 5.0)
        db.add(item)
    else:
        if quantity is not None:
            item.quantity = quantity
        if threshold is not None:
            item.low_stock_threshold = threshold
    db.commit()
    db.refresh(item)
    return item
