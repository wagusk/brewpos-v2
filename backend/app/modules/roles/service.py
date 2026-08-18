from __future__ import annotations
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.modules.roles.models import Role
from app.core.permissions import default_permissions, normalise_permissions
from app.modules.users.models import User

def list_roles(db: Session) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.sort, Role.name)).all())

def get_role(db: Session, rid: int) -> Role | None:
    return db.get(Role, rid)

def create_role(db: Session, *, name: str, label: str, color: str, sort: int = 0, permissions: list[str] | None = None) -> Role:
    perms = normalise_permissions(name, permissions) if permissions is not None else default_permissions(name)
    role = Role(name=name, label=label, color=color, sort=sort, permissions=perms)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def update_role(db: Session, rid: int, *, name: str | None, label: str | None, color: str | None, sort: int | None = None, permissions: list[str] | None = None) -> Role | None:
    role = db.get(Role, rid)
    if not role:
        return None
    if name is not None:
        role.name = name
    if label is not None:
        role.label = label
    if color is not None:
        role.color = color
    if sort is not None:
        role.sort = sort
    if permissions is not None:
        role.permissions = normalise_permissions(role.name, permissions)
    db.commit()
    db.refresh(role)
    return role

def delete_role(db: Session, rid: int) -> bool:
    role = db.get(Role, rid)
    if not role:
        return False
    user_count = db.scalar(select(func.count(User.id)).where(User.role == role.name))
    if user_count and user_count > 0:
        raise ValueError(f"Cannot delete role '{role.name}': {user_count} user(s) still have this role")
    db.delete(role)
    db.commit()
    return True
