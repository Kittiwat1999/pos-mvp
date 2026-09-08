from app.schemas.order import OrderStatus
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, order_id: int) -> Order | None:
        statement = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        return self.db.scalar(statement)

    def list_for_session(self, session_id: int) -> list[Order]:
        statement = (
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.table_session_id == session_id)
            .order_by(Order.created_at, Order.id)
        )
        return list(self.db.scalars(statement).unique().all())

    def list_orders(self, status: OrderStatus | None = None) -> list[Order]:
        order_direction = "desc" if status in {"COMPLETED", "CANCELLED"} else "asc"
        statement = (
            select(Order)
            .where(Order.status == status)
            .options(selectinload(Order.items))
            .order_by(
                getattr(Order.created_at, order_direction)(),
                getattr(Order.id, order_direction)(),
            )
        )
        return list(self.db.scalars(statement).unique().all())
