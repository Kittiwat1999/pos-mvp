from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.deps import get_current_user
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.services.order_service import OrderService

router = APIRouter(tags=["orders"])


@router.post("/table-sessions/{session_id}/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(session_id: int, payload: OrderCreate, db: Session = Depends(get_db)):
    return OrderService(db).create(session_id, payload)


@router.post("/qr/{qr_token}/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_qr_order(qr_token: str, payload: OrderCreate, db: Session = Depends(get_db)):
    return OrderService(db).create_for_qr(qr_token, payload)


@router.get("/table-sessions/{session_id}/orders", response_model=list[OrderOut])
def list_session_orders(session_id: int, db: Session = Depends(get_db)):
    return OrderService(db).list_for_session(session_id)


@router.get("/qr/{qr_token}/orders", response_model=list[OrderOut])
def list_qr_orders(qr_token: str, db: Session = Depends(get_db)):
    return OrderService(db).list_for_qr(qr_token)


@router.get("/orders", response_model=list[OrderOut])
def list_orders(status_filter: str | None = Query(default=None, alias="status"), db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    if status_filter == "pending" or status_filter is None:
        return OrderService(db).list_pending()
    return []


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return OrderService(db).update_status(order_id, payload)
