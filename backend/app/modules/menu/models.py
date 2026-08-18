from __future__ import annotations
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    sort: Mapped[int] = mapped_column(Integer, default=0)
    icon: Mapped[str] = mapped_column(String(40), default="restaurant")
    color: Mapped[str] = mapped_column(String(20), default="#5b8def")
    kind: Mapped[str] = mapped_column(String(20), default="kitchen")

    products: Mapped[list["Product"]] = relationship(back_populates="category", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[float] = mapped_column(Float)
    cost: Mapped[float] = mapped_column(Float, default=0.0, server_default="0")
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    image: Mapped[str] = mapped_column(String(200), default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort: Mapped[int] = mapped_column(Integer, default=0)
    kind: Mapped[str | None] = mapped_column(String(20), default=None)

    category: Mapped[Category] = relationship(back_populates="products")
    modifier_groups: Mapped[list["ModifierGroup"]] = relationship(
        back_populates="product", cascade="all, delete-orphan",
        order_by="ModifierGroup.sort"
    )

class ModifierGroup(Base):
    __tablename__ = "modifier_groups"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    multi: Mapped[bool] = mapped_column(Boolean, default=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    sort: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped[Product] = relationship(back_populates="modifier_groups")
    options: Mapped[list["ModifierOption"]] = relationship(
        back_populates="group", cascade="all, delete-orphan", order_by="ModifierOption.sort"
    )

class ModifierOption(Base):
    __tablename__ = "modifier_options"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    price_delta: Mapped[float] = mapped_column(Float, default=0.0)
    group_id: Mapped[int] = mapped_column(ForeignKey("modifier_groups.id"))
    sort: Mapped[int] = mapped_column(Integer, default=0)

    group: Mapped[ModifierGroup] = relationship(back_populates="options")
