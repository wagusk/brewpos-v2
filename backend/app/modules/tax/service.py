from __future__ import annotations
from app.core.config import _load_persisted, _persist

DEFAULT_TAXES = [
    {"name": "VAT", "rate": 0.10},
    {"name": "Service", "rate": 0.05},
]

def get_taxes() -> list[dict]:
    persisted = _load_persisted()
    if "taxes" in persisted:
        return persisted["taxes"]
    return DEFAULT_TAXES

def set_taxes(taxes: list[dict]) -> None:
    data = _load_persisted()
    data["taxes"] = taxes
    _persist(data)

def get_tax_rate() -> float:
    return sum(float(t.get("rate", 0)) for t in get_taxes())
