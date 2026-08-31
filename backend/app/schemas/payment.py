from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict

PaymentMethod = Literal["CASH", "QR_PAYMENT"]


class CheckoutRequest(BaseModel):
    method: PaymentMethod
    reference: str | None = None


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_session_id: int
    method: PaymentMethod
    amount: Decimal
    paid_at: datetime
    reference: str | None
    receipt_number: str


class ReceiptItem(BaseModel):
    product_name: str
    quantity: int
    unit_price: Decimal
    total: Decimal


class ReceiptOut(BaseModel):
    receipt_number: str
    table_session_id: int
    items: list[ReceiptItem]
    subtotal: Decimal
    amount_paid: Decimal
    method: PaymentMethod
    paid_at: datetime
