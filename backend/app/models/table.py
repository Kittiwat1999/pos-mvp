from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Table(Base):
    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="AVAILABLE", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    sessions: Mapped[list["TableSession"]] = relationship("TableSession", back_populates="table")


class TableSession(Base):
    __tablename__ = "table_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id", ondelete="RESTRICT"), nullable=False, index=True)
    qr_token: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="OPEN", nullable=False, index=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    table: Mapped[Table] = relationship("Table", back_populates="sessions")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="table_session")
    payment: Mapped["Payment | None"] = relationship("Payment", back_populates="table_session", uselist=False)
