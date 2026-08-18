from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field

class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    label: str
    color: str
    sort: int
    permissions: list[str] = []
    active: bool = True

class RoleIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    label: str = Field(min_length=1, max_length=40)
    color: str = Field(default="#5b8def", pattern=r"^#[0-9a-fA-F]{6}$")
    sort: int = 0
    permissions: list[str] | None = None

class RoleUpdateIn(BaseModel):
    name: str | None = None
    label: str | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    sort: int | None = None
    permissions: list[str] | None = None
