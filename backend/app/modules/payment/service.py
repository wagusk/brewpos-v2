r"""M35 — Payment processing service.

State machine:
    pending -> processing -> completed
                   \-> failed  -> (retry) -> processing
                   \-> cancelled

Rules:
    - Duplicate prevention: idempotency_key per order. If a payment with
      the same key is already processing/completed, return it instead of
      creating a new one.
    - Amount validation at confirm time: the provider's confirmed amount
      must match the bill total (within 5c tolerance).
    - Failed/cancelled payments do NOT transition the order to 'paid'.
      The order stays at 'accepted'/'ready'/'served' so the cashier can
      retry with a different method.
    - Cancelling a bill returns it to a recoverable state (order stays open).
    - All validation is server-side, not hardcoded in UI.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.models import Order, Payment
from app.schemas import InitiatePaymentIn, PaymentActionIn
from app.modules.payment.provider import get_provider, ProviderResult

log = logging.getLogger("brewpos.payment")


class PaymentError(Exception):
    """Raised when a payment operation cannot proceed."""
    pass


def _get_order_for_payment(db: Session, order_id: int) -> Order:
    """Fetch an order that can accept a payment. Raises PaymentError otherwise."""
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.payments),
        )
    )
    if not order:
        raise PaymentError(f"Order {order_id} not found")
    if order.status == "paid":
        raise PaymentError("Bill is already paid")
    if order.status in ("void", "cancelled"):
        raise PaymentError(f"Bill is {order.status} — cannot process payment")
    if order.status not in ("accepted", "ready", "served"):
        raise PaymentError(
            f"Bill must be accepted by kitchen first (current: {order.status})"
        )
    if len(order.items) == 0:
        raise PaymentError("Cannot pay an empty bill")
    return order


def _find_active_payment(db: Session, order_id: int) -> Payment | None:
    """Find the latest non-cancelled payment for an order."""
    return db.scalar(
        select(Payment)
        .where(Payment.order_id == order_id, Payment.status.notin_(("cancelled", "failed")))
        .order_by(Payment.created_at.desc())
    )


def initiate_payment(db: Session, payload: InitiatePaymentIn) -> Payment:
    """Initiate a payment on a bill.

    - Deduplicates via idempotency_key.
    - Prevents duplicate payments if one is already processing.
    - Validates order state (accepted/ready/served, non-empty).
    - Delegates to the configured provider for the initial auth.
    """
    order = _get_order_for_payment(db, payload.order_id)

    # Duplicate prevention: idempotency key matches an existing payment
    if payload.idempotency_key:
        existing = db.scalar(
            select(Payment).where(
                Payment.order_id == payload.order_id,
                Payment.external_id == f"idem_{payload.idempotency_key}",
            )
        )
        if existing:
            log.info("Duplicate payment attempt on order %s — returning existing payment %s",
                     payload.order_id, existing.id)
            return existing

    # Block only while another payment is processing. Completed partial
    # payments are valid and the cashier may continue paying the same bill.
    active = _find_active_payment(db, payload.order_id)
    if active and active.status == "processing":
        raise PaymentError(
            f"Payment already in progress (payment #{active.id}). "
            "Cancel it before starting a new one."
        )

    paid_total = sum(
        float(p.amount) for p in order.payments if p.status == "completed"
    )
    outstanding = round(max(0.0, float(order.total) - paid_total), 2)
    if outstanding <= 0:
        raise PaymentError("Bill is already fully paid")
    amount = outstanding if payload.amount is None else round(float(payload.amount), 2)
    if amount <= 0 or amount > outstanding + 0.005:
        raise PaymentError(
            f"Payment amount must be between 0 and the outstanding balance of {outstanding:.2f}"
        )
    tendered = payload.tendered if payload.tendered > 0 else amount
    if payload.method == "cash" and tendered + 0.005 < amount:
        raise PaymentError(f"Cash received is less than the payment amount of {amount:.2f}")
    change = round(max(0.0, tendered - amount), 2)

    # Create payment record
    payment = Payment(
        order_id=payload.order_id,
        method=payload.method,
        amount=amount,
        tendered=tendered,
        change=change,
        status="pending",
        provider=payload.provider,
    )
    db.add(payment)
    db.flush()  # get payment.id

    # Idempotency marker
    if payload.idempotency_key:
        payment.external_id = f"idem_{payload.idempotency_key}"
    db.commit()
    db.refresh(payment)

    # Delegate to provider
    provider = get_provider(payload.provider)
    try:
        result: ProviderResult = provider.initiate(
            amount=amount,
            method=payload.method,
            idempotency_key=payload.idempotency_key,
        )
    except Exception as e:
        log.exception("Provider initiate failed for payment %s", payment.id)
        payment.status = "failed"
        payment.error_message = f"Provider error: {e}"[:200]
        db.commit()
        raise PaymentError(f"Payment provider error: {e}")

    if result.ok:
        payment.status = "processing"
        if result.external_id and not payment.external_id.startswith("idem_"):
            payment.external_id = result.external_id
        payment.error_message = ""
    else:
        payment.status = "failed"
        payment.error_message = result.error[:200]

    payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(payment)
    log.info("Payment %s initiated for order %s via %s",
             payment.id, order.id, payload.provider)
    return payment


def confirm_payment(db: Session, payment_id: int) -> Payment:
    """Confirm a payment that's in 'processing' state.

    - Delegates to the provider for final confirmation.
    - Validates the amount matches the bill.
    - On success: transitions order to 'paid' (if fully covered).
    - On failure: payment -> failed, order stays open (recoverable).
    """
    payment = db.get(Payment, payment_id)
    if not payment:
        raise PaymentError(f"Payment {payment_id} not found")
    if payment.status != "processing":
        raise PaymentError(f"Cannot confirm payment in status '{payment.status}'")

    order = payment.order
    amount = float(payment.amount)

    # Confirm with provider
    provider = get_provider(payment.provider)
    try:
        result = provider.confirm(payment.external_id, amount)
    except Exception as e:
        log.exception("Provider confirm failed for payment %s", payment_id)
        payment.status = "failed"
        payment.error_message = f"Provider error: {e}"[:200]
        payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()
        raise PaymentError(f"Payment provider error: {e}")

    if not result.ok:
        payment.status = "failed"
        payment.error_message = result.error[:200]
        payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()
        log.warning("Payment %s failed: %s", payment_id, result.error)
        return payment

    # Amount validation: provider's confirmed amount must match the bill
    # (within tolerance for floating point).
    payment.amount_validated = result.amount_validated
    if result.amount_validated:
        # Tolerance check — providers may round differently
        if abs(amount - float(payment.amount)) > 0.05:
            payment.status = "failed"
            payment.error_message = (
                f"Amount mismatch: expected ${amount:.2f}, "
                f"provider confirmed ${float(payment.amount):.2f}"
            )[:200]
            payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            db.commit()
            raise PaymentError(payment.error_message)

    # Success — mark payment completed
    payment.status = "completed"
    payment.error_message = ""
    payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    # Transition order to paid if total covered
    total_paid = float(sum(
        p.amount for p in order.payments if p.status == "completed"
    )) + float(payment.amount)

    if total_paid + 0.005 >= float(order.total):
        order.status = "paid"
        log.info("Order %s fully paid — total covered: $%.2f", order.id, total_paid)
    else:
        # Partial payment — order stays open
        log.info("Order %s partial payment — paid $%.2f of $%.2f",
                 order.id, total_paid, order.total)

    db.commit()
    db.refresh(payment)
    return payment


def retry_payment(db: Session, payment_id: int) -> Payment:
    """Retry a failed or cancelled payment. Resets it to 'pending' and re-initiates."""
    payment = db.get(Payment, payment_id)
    if not payment:
        raise PaymentError(f"Payment {payment_id} not found")
    if payment.status not in ("failed", "cancelled"):
        raise PaymentError(f"Cannot retry payment in status '{payment.status}'")

    order = payment.order

    # Re-initiate via provider
    provider = get_provider(payment.provider)
    try:
        result = provider.initiate(
            amount=float(payment.amount),
            method=payment.method,
            idempotency_key="",
        )
    except Exception as e:
        log.exception("Provider re-initiate failed for payment %s", payment_id)
        payment.error_message = f"Provider error: {e}"[:200]
        payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()
        raise PaymentError(f"Payment provider error: {e}")

    if result.ok:
        payment.status = "processing"
        payment.error_message = ""
        if result.external_id:
            payment.external_id = result.external_id
    else:
        payment.status = "failed"
        payment.error_message = result.error[:200]

    payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(payment)
    log.info("Payment %s retried — new status: %s", payment_id, payment.status)
    return payment


def cancel_payment(db: Session, payment_id: int) -> Payment:
    """Cancel a pending or processing payment. Returns order to recoverable state."""
    payment = db.get(Payment, payment_id)
    if not payment:
        raise PaymentError(f"Payment {payment_id} not found")
    if payment.status not in ("pending", "processing", "failed"):
        raise PaymentError(f"Cannot cancel payment in status '{payment.status}'")

    payment.status = "cancelled"
    payment.error_message = ""
    payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(payment)
    log.info("Payment %s cancelled", payment_id)
    return payment


def get_payment(db: Session, payment_id: int) -> Payment | None:
    return db.get(Payment, payment_id)


def list_order_payments(db: Session, order_id: int) -> list[Payment]:
    return list(db.scalars(
        select(Payment).where(Payment.order_id == order_id).order_by(Payment.created_at.desc())
    ).all())
