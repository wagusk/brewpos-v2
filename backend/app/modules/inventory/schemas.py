from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field

class StockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: float
    low_stock_threshold: float

class StockUpdateIn(BaseModel):
    quantity: float | None = Field(default=None, ge=0)
    low_stock_threshold: float | None = Field(default=None, ge=0)
