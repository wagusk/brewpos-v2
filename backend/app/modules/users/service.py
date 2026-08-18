from __future__ import annotations
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.modules.users.models import User
from app.core.security import hash_pin
from app.core.permissions import default_permissions, normalise_permissions

def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.role, User.name)).all())

def count_users(db: Session) -> int:
    return db.scalar(select(func.count(User.id))) or 0

def create_user(db: Session, *, name: str, pin: str, role: str, active: bool, permissions: list[str] | None = None) -> User:
    u = User(name=name, pin=hash_pin(pin), role=role, active=active, permissions=normalise_permissions(role, permissions))
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

def update_user(db: Session, uid: int, *, name: str | None, pin: str | None, role: str | None, permissions: list[str] | None = None, active: bool | None) -> User | None:
    u = db.get(User, uid)
    if not u:
        return None
    if name is not None:
        u.name = name
    if pin is not None:
        u.pin = hash_pin(pin)
    new_role = role if role is not None else u.role
    role_changed = role is not None and role != u.role
    if role is not None:
        u.role = role
    if permissions is not None:
        u.permissions = normalise_permissions(new_role, permissions)
    elif role_changed:
        u.permissions = default_permissions(new_role)
    if active is not None:
        u.active = active
    db.commit()
    db.refresh(u)
    return u

def delete_user(db: Session, uid: int) -> bool:
    u = db.get(User, uid)
    if not u:
        return False
    if u.role == "admin":
        admin_count = db.scalar(
            select(User.id).where(User.role == "admin", User.active.is_(True), User.id != uid).limit(1)
        )
        if admin_count is None:
            raise ValueError("Cannot delete the last active admin")
    db.delete(u)
    db.commit()
    return True
