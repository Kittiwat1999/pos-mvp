from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.table import TableSession
from app.repositories.order_repo import OrderRepository
from app.schemas.order import OrderCreate, OrderStatus, OrderStatusUpdate

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "PENDING": {"CONFIRMED", "CANCELLED"},
    "CONFIRMED": {"COMPLETED", "CANCELLED"},
    "COMPLETED": set(),
    "CANCELLED": set(),
}


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.orders = OrderRepository(db)

    def create(self, session_id: int, payload: OrderCreate) -> Order:
        session = self.db.get(TableSession, session_id)
        if not session or session.status != "OPEN":
            raise HTTPException(status_code=409, detail="Table session is invalid or closed")

        product_ids = [item.product_id for item in payload.items]
        products = {
            product.id: product
            for product in self.db.scalars(select(Product).where(Product.id.in_(product_ids))).all()
        }
        if len(products) != len(set(product_ids)):
            raise HTTPException(status_code=400, detail="One or more products were not found")

        order = Order(table_session_id=session_id, status="PENDING", subtotal=Decimal("0.00"), discount=Decimal("0.00"), tax=Decimal("0.00"), total=Decimal("0.00"))
        subtotal = Decimal("0.00")
        for requested in payload.items:
            product = products[requested.product_id]
            if not product.active:
                raise HTTPException(status_code=400, detail=f"Product '{product.name}' is inactive")
            unit_price = product.price
            subtotal += unit_price * requested.quantity
            order.items.append(OrderItem(product_id=product.id, product_name=product.name, quantity=requested.quantity, unit_price=unit_price, discount=Decimal("0.00"), note=requested.note))

        order.subtotal = subtotal
        order.total = subtotal
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return self.orders.get(order.id)  # type: ignore[return-value]

    def create_for_qr(self, qr_token: str, payload: OrderCreate) -> Order:
        session = self.db.scalar(
            select(TableSession).where(TableSession.qr_token == qr_token, TableSession.status == "OPEN")
        )
        if not session:
            raise HTTPException(status_code=404, detail="QR session is invalid or expired")
        return self.create(session.id, payload)

    def list_for_session(self, session_id: int) -> list[Order]:
        if not self.db.get(TableSession, session_id):
            raise HTTPException(status_code=404, detail="Table session not found")
        return self.orders.list_for_session(session_id)

    def list_for_qr(self, qr_token: str) -> list[Order]:
        session = self.db.scalar(
            select(TableSession).where(TableSession.qr_token == qr_token, TableSession.status == "OPEN")
        )
        if not session:
            raise HTTPException(status_code=404, detail="QR session is invalid or expired")
        return self.orders.list_for_session(session.id)

    def list_orders(self, status: OrderStatus | None = None) -> list[Order]:
        if status is None:
            return []
        return self.orders.list_orders(status)

    def update_status(self, order_id: int, payload: OrderStatusUpdate) -> Order:
        order = self.orders.get(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if payload.status not in ALLOWED_TRANSITIONS[order.status]:
            raise HTTPException(status_code=409, detail=f"Cannot move order from {order.status} to {payload.status}")
        order.status = payload.status
        self.db.commit()
        self.db.refresh(order)
        return self.orders.get(order.id)  # type: ignore[return-value]
