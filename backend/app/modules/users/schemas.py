from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    role: str
    permissions: list[str] = []
    active: bool = True
    created_at: datetime

class UserIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    pin: str = Field(min_length=4, max_length=8)
    role: str = Field(min_length=1, max_length=20)
    permissions: list[str] | None = None
    active: bool = True

class UserUpdateIn(BaseModel):
    name: str | None = None
    pin: str | None = Field(default=None, max_length=8)
    role: str | None = Field(default=None, min_length=1, max_length=20)
    permissions: list[str] | None = None
    active: bool | None = None

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class LoginIn(BaseModel):
    pin: str = Field(min_length=4, max_length=8)
