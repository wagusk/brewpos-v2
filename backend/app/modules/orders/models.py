from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.modules.tables.models import Table

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[int] = mapped_column(Integer, unique=True)
    table_id: Mapped[int | None] = mapped_column(ForeignKey("tables.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open")
    type: Mapped[str] = mapped_column(String(20), default="dine_in")
    customer_name: Mapped[str] = mapped_column(String(80), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc).replace(tzinfo=None), onupdate=datetime.now(timezone.utc).replace(tzinfo=None))

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderItem.id"
    )
    table: Mapped[Table | None] = relationship()
    payments: Mapped[list["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    name: Mapped[str] = mapped_column(String(120))
    price: Mapped[float] = mapped_column(Float)
    qty: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="new")
    notes: Mapped[str] = mapped_column(Text, default="")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    station: Mapped[str] = mapped_column(String(20), default="kitchen")

    order: Mapped[Order] = relationship(back_populates="items")
    modifiers: Mapped[list["OrderItemModifier"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )

class OrderItemModifier(Base):
    __tablename__ = "order_item_modifiers"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"))
    name: Mapped[str] = mapped_column(String(80))
    price_delta: Mapped[float] = mapped_column(Float, default=0.0)

    item: Mapped[OrderItem] = relationship(back_populates="modifiers")
