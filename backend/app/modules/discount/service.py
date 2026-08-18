from __future__ import annotations
from app.core.config import _load_persisted, _persist

DEFAULT_DISCOUNT_POLICY = {
    "max_discount_pct": 0.50,
    "presets": [
        {"label": "VIP", "mode": "amount", "value": 5.0},
        {"label": "Loyalty 10%", "mode": "percent", "value": 10.0},
        {"label": "Staff meal", "mode": "amount", "value": 3.0},
    ],
    "require_reason": True,
}

def get_discount_policy() -> dict:
    persisted = _load_persisted()
    stored = persisted.get("discount_policy") or {}
    return {
        "max_discount_pct": float(stored.get("max_discount_pct", DEFAULT_DISCOUNT_POLICY["max_discount_pct"])),
        "presets": [p for p in (stored.get("presets") or DEFAULT_DISCOUNT_POLICY["presets"])],
        "require_reason": bool(stored.get("require_reason", DEFAULT_DISCOUNT_POLICY["require_reason"])),
    }

def set_discount_policy(patch: dict) -> dict:
    current = get_discount_policy()
    if "max_discount_pct" in patch and patch["max_discount_pct"] is not None:
        current["max_discount_pct"] = max(0.0, min(1.0, float(patch["max_discount_pct"])))
    if "presets" in patch and patch["presets"] is not None:
        current["presets"] = [p for p in patch["presets"] if p.get("label") and float(p.get("value", 0)) > 0][:8]
    if "require_reason" in patch and patch["require_reason"] is not None:
        current["require_reason"] = bool(patch["require_reason"])
    data = _load_persisted()
    data["discount_policy"] = current
    _persist(data)
    return current

def resolve_preset_discount(preset: dict | None, subtotal: float) -> float:
    if not isinstance(preset, dict):
        return 0.0
    subtotal = float(subtotal or 0)
    value = float(preset.get("value", 0) or 0)
    if preset.get("mode") == "percent":
        return round(max(0.0, subtotal) * (value / 100.0), 2)
    return round(max(0.0, value), 2)
