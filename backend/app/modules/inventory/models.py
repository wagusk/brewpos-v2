from __future__ import annotations
from sqlalchemy import Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.modules.menu.models import Product

class StockItem(Base):
    __tablename__ = "stock_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), unique=True)
    quantity: Mapped[float] = mapped_column(Float, default=0.0)
    low_stock_threshold: Mapped[float] = mapped_column(Float, default=5.0)

    product: Mapped[Product] = relationship()
