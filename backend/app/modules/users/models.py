from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.types import JSON
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    pin: Mapped[str] = mapped_column(String(120))  # bcrypt hash
    role: Mapped[str] = mapped_column(String(20))  # references roles.name
    permissions: Mapped[list[str]] = mapped_column(MutableList.as_mutable(JSON), default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
