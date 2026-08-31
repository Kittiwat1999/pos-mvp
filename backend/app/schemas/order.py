from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

OrderStatus = Literal["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)
    note: str | None = Field(default=None, max_length=500)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    discount: Decimal
    note: str | None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_session_id: int
    status: OrderStatus
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal
    created_at: datetime
    items: list[OrderItemOut]
