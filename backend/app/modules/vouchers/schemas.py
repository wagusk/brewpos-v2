from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field

class VoucherOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    mode: str
    value: float
    active: bool

class VoucherIn(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    mode: str = Field(default="percent", pattern=r"^(percent|amount)$")
    value: float = Field(gt=0, le=10000)
    active: bool = True

class VoucherValidateIn(BaseModel):
    code: str
    subtotal: float
