"""M35 — Payment processing REST endpoints.

Endpoints:
    POST /api/payments/initiate   — start a payment (with duplicate prevention)
    POST /api/payments/confirm    — confirm a processing payment
    POST /api/payments/retry      — retry a failed payment
    POST /api/payments/cancel     — cancel a pending/processing payment
    GET  /api/payments/{id}       — get payment status
    GET  /api/payments/order/{id} — list payments for an order
"""
from __future__ import annotations
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import current_user, require_permission
from app.models import User
from app.schemas import InitiatePaymentIn, PaymentActionIn, PaymentOut
from app.modules.payment.service import (
    initiate_payment, confirm_payment, retry_payment, cancel_payment,
    get_payment, list_order_payments, PaymentError,
)

log = logging.getLogger("brewpos.payment")
router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/initiate", response_model=PaymentOut)
async def initiate(
    payload: InitiatePaymentIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("order.close")),
):
    try:
        payment = initiate_payment(db, payload)
    except PaymentError as e:
        raise HTTPException(400, str(e))
    return PaymentOut.model_validate(payment)


@router.post("/confirm", response_model=PaymentOut)
async def confirm(
    payload: PaymentActionIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("order.close")),
):
    try:
        payment = confirm_payment(db, payload.payment_id)
    except PaymentError as e:
        raise HTTPException(400, str(e))
    return PaymentOut.model_validate(payment)


@router.post("/retry", response_model=PaymentOut)
async def retry(
    payload: PaymentActionIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("order.close")),
):
    try:
        payment = retry_payment(db, payload.payment_id)
    except PaymentError as e:
        raise HTTPException(400, str(e))
    return PaymentOut.model_validate(payment)


@router.post("/cancel", response_model=PaymentOut)
async def cancel(
    payload: PaymentActionIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("order.close")),
):
    try:
        payment = cancel_payment(db, payload.payment_id)
    except PaymentError as e:
        raise HTTPException(400, str(e))
    return PaymentOut.model_validate(payment)


@router.get("/{payment_id}", response_model=PaymentOut)
async def get_one(
    payment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    payment = get_payment(db, payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    return PaymentOut.model_validate(payment)


@router.get("/order/{order_id}", response_model=list[PaymentOut])
async def list_for_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    payments = list_order_payments(db, order_id)
    return [PaymentOut.model_validate(p) for p in payments]
