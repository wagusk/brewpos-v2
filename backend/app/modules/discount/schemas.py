from __future__ import annotations
from pydantic import BaseModel, Field, model_validator

class DiscountPresetIn(BaseModel):
    label: str = Field(min_length=1, max_length=32)
    mode: str = Field(default="amount", pattern=r"^(amount|percent)$")
    value: float = Field(gt=0, le=10000)

    @model_validator(mode="after")
    def _cap_percent(self):
        if self.mode == "percent" and self.value > 100:
            raise ValueError("value must be <= 100 when mode='percent'")
        return self

class DiscountPolicyOut(BaseModel):
    max_discount_pct: float
    presets: list[DiscountPresetIn]
    require_reason: bool

class DiscountPolicyIn(BaseModel):
    max_discount_pct: float | None = Field(default=None, ge=0, le=1)
    presets: list[DiscountPresetIn] | None = None
    require_reason: bool | None = None
