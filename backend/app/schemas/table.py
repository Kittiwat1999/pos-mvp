from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TableStatus = Literal["AVAILABLE", "OCCUPIED", "CLEANING"]
SessionStatus = Literal["OPEN", "CLOSED"]


class TableCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class TableOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status: TableStatus
    created_at: datetime
    updated_at: datetime


class TableSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_id: int
    qr_token: str
    status: SessionStatus
    opened_at: datetime
    closed_at: datetime | None


class QrSessionOut(BaseModel):
    session_id: int
    table_id: int
    table_name: str
    status: Literal["OPEN"]
