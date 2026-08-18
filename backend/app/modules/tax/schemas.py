from __future__ import annotations
from pydantic import BaseModel, Field, field_validator

class TaxItem(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    rate: float = Field(ge=0.0, le=1.0)

class TaxIn(BaseModel):
    taxes: list[TaxItem]

    @field_validator("taxes")
    @classmethod
    def _validate_taxes(cls, v):
        if not v:
            raise ValueError("At least one tax is required")
        return v
