from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.types import JSON
from app.db.session import Base

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20), unique=True)
    label: Mapped[str] = mapped_column(String(40))
    color: Mapped[str] = mapped_column(String(20), default="#5b8def")
    sort: Mapped[int] = mapped_column(Integer, default=0)
    permissions: Mapped[list[str]] = mapped_column(MutableList.as_mutable(JSON), default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Role {self.name}>"
