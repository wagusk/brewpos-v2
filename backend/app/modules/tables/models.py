from __future__ import annotations
from sqlalchemy import String, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class Table(Base):
    __tablename__ = "tables"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(40), unique=True)
    seats: Mapped[int] = mapped_column(Integer, default=4)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    section: Mapped[str] = mapped_column(String(40), default="Main Hall")
    sort: Mapped[int] = mapped_column(Integer, default=0)
