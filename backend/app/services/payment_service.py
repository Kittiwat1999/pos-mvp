import secrets
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order
from app.models.payment import Payment
from app.models.table import Table, TableSession
from app.schemas.payment import CheckoutRequest, ReceiptOut


class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def checkout(self, session_id: int, payload: CheckoutRequest) -> Payment:
        session = self.db.scalar(
            select(TableSession)
            .options(selectinload(TableSession.orders).selectinload(Order.items))
            .where(TableSession.id == session_id)
            .with_for_update()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Table session not found")
        if session.status != "OPEN":
            raise HTTPException(status_code=409, detail="Table session is already closed")

        billable_orders = [order for order in session.orders if order.status != "CANCELLED"]
        amount = sum((order.total for order in billable_orders), Decimal("0.00"))
        if amount <= 0:
            raise HTTPException(status_code=409, detail="Cannot checkout a session with no billable orders")

        payment = Payment(
            table_session_id=session.id,
            method=payload.method,
            amount=amount,
            reference=payload.reference,
            receipt_number=f"RCPT-{secrets.token_hex(6).upper()}",
        )
        session.status = "CLOSED"
        session.closed_at = datetime.now(timezone.utc)
        table = self.db.get(Table, session.table_id, with_for_update=True)
        if table:
            table.status = "CLEANING"
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def receipt(self, payment_id: int) -> ReceiptOut:
        payment = self.db.scalar(
            select(Payment)
            .options(selectinload(Payment.table_session).selectinload(TableSession.orders).selectinload(Order.items))
            .where(Payment.id == payment_id)
        )
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        items = []
        for order in payment.table_session.orders:
            if order.status == "CANCELLED":
                continue
            for item in order.items:
                items.append({
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total": item.unit_price * item.quantity - item.discount,
                })

        return ReceiptOut(
            receipt_number=payment.receipt_number,
            table_session_id=payment.table_session_id,
            items=items,
            subtotal=payment.amount,
            amount_paid=payment.amount,
            method=payment.method,
            paid_at=payment.paid_at,
        )
