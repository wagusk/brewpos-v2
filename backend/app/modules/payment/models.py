from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.modules.orders.models import Order

class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    method: Mapped[str] = mapped_column(String(20))
    amount: Mapped[float] = mapped_column(Float)
    tendered: Mapped[float] = mapped_column(Float, default=0.0)
    change: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    provider: Mapped[str] = mapped_column(String(40), default="mock")
    external_id: Mapped[str] = mapped_column(String(120), default="")
    error_message: Mapped[str] = mapped_column(String(200), default="")
    amount_validated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc).replace(tzinfo=None), onupdate=datetime.now(timezone.utc).replace(tzinfo=None))

    order: Mapped[Order] = relationship(back_populates="payments")
