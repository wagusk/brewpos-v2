"""Orders module — checkout, open-bill, close, accept, cancel, void, append, print, stats."""
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import (
    CheckoutIn, OrderOut, OrderStatusIn, StatsOut, CloseOrderIn, CancelOrderIn, OpenBillIn, VoidOrderIn,
    AppendItemsIn,
)
from app.models import User, Order
from app.core.security import current_user, require_permission
from app.core.permissions import can
from app.services import (
    submit_order, list_orders, get_order, update_order_status, to_order_out,
    today_stats, accept_order, close_order, cancel_order, append_items, open_bill, void_order,
)
from app.ws import manager

log = logging.getLogger("brewpos.orders")

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _fire_kitchen_ticket(db: Session, order) -> None:
    try:
        from app.services import tickets, printer
        for station in ("kitchen", "bar"):
            payload = tickets.build_station_ticket(db, order, station)
            if payload is None:
                continue
            result = printer.auto_print_on_event("on_send_to_kitchen", payload)
            if result is not None and not result.ok:
                log.warning("%s ticket for order #%s failed: %s", station, order.number, result.error)
    except Exception as e:
        log.warning("kitchen/bar ticket for order #%s raised: %s", order.number, e)


def _fire_customer_receipt(db: Session, order) -> None:
    try:
        from app.services import tickets, printer
        payload = tickets.build_customer_receipt(db, order)
        result = printer.auto_print_on_event("on_payment", payload)
        if result is not None and not result.ok:
            log.warning("customer receipt for order #%s failed: %s", order.number, result.error)
    except Exception as e:
        log.warning("customer receipt for order #%s raised: %s", order.number, e)


@router.post("/checkout", response_model=OrderOut)
async def checkout(payload: CheckoutIn, db: Session = Depends(get_db), user: User = Depends(require_permission("order.open"))):
    try:
        order = submit_order(db, payload, user)
    except ValueError as e:
        raise HTTPException(400, str(e))
    out = to_order_out(order)
    await manager.broadcast("order_created", out.model_dump())
    _fire_kitchen_ticket(db, order)
    return out


@router.post("/open-bill", response_model=OrderOut)
async def open_bill_endpoint(payload: OpenBillIn, db: Session = Depends(get_db), user: User = Depends(require_permission("order.open"))):
    try:
        order = open_bill(db, payload, user)
    except ValueError as e:
        raise HTTPException(400, str(e))
    out = to_order_out(order)
    await manager.broadcast("order_created", out.model_dump())
    return out


@router.get("", response_model=list[OrderOut])
def list_endpoint(
    status: str | None = None,
    limit: int = 100,
    station: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    role = user.role
    if station is None and role == "kitchen":
        station = "kitchen"
    if station is None and role == "bar":
        station = "bar"
    if role == "cashier":
        orders = [o for o in list_orders(db, status=None, limit=limit, station=None) if o.status in ("accepted", "ready", "served")]
    elif role in ("kitchen", "bar"):
        orders = [o for o in list_orders(db, status=None, limit=limit, station=station) if o.status in ("open", "accepted", "preparing", "ready")]
    elif role == "waiter":
        orders = [o for o in list_orders(db, status=None, limit=limit) if o.status != "paid"]
    else:
        orders = list_orders(db, status=status, limit=limit, station=station)
    return [to_order_out(o) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
def get_endpoint(order_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    o = get_order(db, order_id)
    if not o:
        raise HTTPException(404, "Not found")
    return to_order_out(o)


@router.patch("/{order_id}", response_model=OrderOut)
async def update_endpoint(order_id: int, payload: OrderStatusIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not can(user, "kitchen.serve") and not can(user, "bar.serve"):
        raise HTTPException(403, "Missing permission: kitchen.serve or bar.serve")
    try:
        order = update_order_status(db, order_id, payload.status, payload.item_id, payload.item_status)
    except ValueError as e:
        raise HTTPException(400, str(e))
    out = to_order_out(order)
    await manager.broadcast("order_updated", out.model_dump())
    return out


@router.post("/{order_id}/accept", response_model=OrderOut)
async def accept_endpoint(order_id: int, db: Session = Depends(get_db), user: User = Depends(require_permission("kitchen.serve"))):
    try:
        order = accept_order(db, order_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    out = to_order_out(order)
    await manager.broadcast("order_updated", out.model_dump())
    return out


@router.post("/{order_id}/close", response_model=OrderOut)
async def close_endpoint(order_id: int, payload: CloseOrderIn, db: Session = Depends(get_db), user: User = Depends(require_permission("order.close"))):
    from app.core.config import get_discount_policy, resolve_preset_discount

    resolved_discount = max(0.0, float(payload.discount or 0))
    applied_reason = (payload.discount_reason or "").strip()
    preset_applied = False
    if payload.preset_label:
        policy = get_discount_policy()
        match = next((p for p in policy.get("presets", []) if p.get("label") == payload.preset_label), None)
        if not match:
            raise HTTPException(404, f"Discount preset '{payload.preset_label}' not found")
        order_for_subtotal = db.get(Order, order_id)
        if not order_for_subtotal:
            raise HTTPException(404, "Order not found")
        resolved_discount = resolve_preset_discount(match, order_for_subtotal.subtotal)
        applied_reason = applied_reason or str(match.get("label") or "")
        preset_applied = True

    if resolved_discount > 0 and not preset_applied:
        if "order.discount" not in (user.permissions or []):
            raise HTTPException(403, "You don't have permission to apply a discount.")

    if resolved_discount > 0:
        policy = get_discount_policy()
        if policy.get("require_reason") and not applied_reason:
            raise HTTPException(400, "Discount reason is required")

    try:
        order = close_order(db, order_id, payload.payment_method, payload.tendered, discount=resolved_discount, discount_reason=applied_reason)
    except ValueError as e:
        raise HTTPException(400, str(e))

    if order is None:
        await manager.broadcast("order_deleted", {"order_id": order_id})
        return JSONResponse({"detail": "Empty bill deleted — no record kept", "order_id": order_id}, status_code=200)

    out = to_order_out(order)
    await manager.broadcast("order_updated", out.model_dump())
    _fire_customer_receipt(db, order)
    return out


@router.post("/{order_id}/cancel", response_model=OrderOut)
async def cancel_endpoint(order_id: int, payload: CancelOrderIn, db: Session = Depends(get_db), user: User = Depends(require_permission("order.cancel"))):
    try:
        order = cancel_order(db, order_id, payload.reason, payload.item_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if order is None:
        await manager.broadcast("order_deleted", {"order_id": order_id})
        return JSONResponse({"detail": "Empty bill deleted — no record kept", "order_id": order_id}, status_code=200)
    out = to_order_out(order)
    await manager.broadcast("order_cancelled" if payload.item_id is None else "order_item_cancelled", out.model_dump())
    return out


@router.post("/{order_id}/void", response_model=OrderOut)
async def void_endpoint(order_id: int, payload: VoidOrderIn, db: Session = Depends(get_db), user: User = Depends(require_permission("order.void"))):
    try:
        order = void_order(db, order_id, payload.reason, user)
    except ValueError as e:
        raise HTTPException(400, str(e))
    out = to_order_out(order)
    await manager.broadcast("order_updated", out.model_dump())
    return out


@router.post("/{order_id}/items", response_model=OrderOut)
async def append_items_endpoint(order_id: int, payload: AppendItemsIn, db: Session = Depends(get_db), user: User = Depends(require_permission("order.append"))):
    try:
        order = append_items(db, order_id, payload, user)
    except ValueError as e:
        raise HTTPException(400, str(e))
    out = to_order_out(order)
    await manager.broadcast("order_updated", out.model_dump())
    return out


@router.post("/{order_id}/print-ticket")
async def reprint_ticket_endpoint(order_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(404, "Not found")
    perms = set(user.permissions or [])
    has_bar_only = "bar.view" in perms and "kitchen.view" not in perms
    has_any_station_perm = "bar.view" in perms or "kitchen.view" in perms
    if not (has_any_station_perm or user.role in ("admin", "master")):
        raise HTTPException(403, "Missing permission: kitchen.view or bar.view")
    station = "bar" if has_bar_only else "kitchen"
    try:
        from app.services import tickets, printer
        payload = tickets.build_station_ticket(db, order, station)
        if payload is None:
            raise HTTPException(400, f"No items for station '{station}' on this order")
        result = printer.print_bytes(payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Print failed: {e}") from e
    return result.to_dict()


@router.post("/{order_id}/print-receipt")
async def reprint_receipt_endpoint(order_id: int, db: Session = Depends(get_db), user: User = Depends(require_permission("cashier.view"))):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(404, "Not found")
    if order.status != "paid":
        raise HTTPException(400, "Receipt can only be reprinted for paid orders")
    try:
        from app.services import tickets, printer
        payload = tickets.build_customer_receipt(db, order)
        result = printer.print_bytes(payload)
    except Exception as e:
        raise HTTPException(500, f"Print failed: {e}") from e
    return result.to_dict()


@router.get("/_stats/today", response_model=StatsOut)
def stats(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return StatsOut(**today_stats(db))
