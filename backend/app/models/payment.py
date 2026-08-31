from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    table_session_id: Mapped[int] = mapped_column(ForeignKey("table_sessions.id", ondelete="RESTRICT"), unique=True, nullable=False)
    method: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100))
    receipt_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    table_session: Mapped["TableSession"] = relationship("TableSession", back_populates="payment")
