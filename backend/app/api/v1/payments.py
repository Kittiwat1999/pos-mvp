from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.deps import get_current_user
from app.models.payment import Payment
from app.schemas.payment import CheckoutRequest, PaymentOut, ReceiptOut
from app.services.payment_service import PaymentService

router = APIRouter(tags=["payments"])


@router.post("/table-sessions/{session_id}/checkout", response_model=PaymentOut)
def checkout(session_id: int, payload: CheckoutRequest, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return PaymentService(db).checkout(session_id, payload)


@router.get("/payments/{payment_id}", response_model=PaymentOut)
def get_payment(payment_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    payment = db.get(Payment, payment_id)
    if not payment:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.get("/payments/{payment_id}/receipt", response_model=ReceiptOut)
def get_receipt(payment_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return PaymentService(db).receipt(payment_id)
