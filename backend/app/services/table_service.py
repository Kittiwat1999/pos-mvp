import secrets
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.table import Table, TableSession
from app.repositories.table_repo import TableRepository, TableSessionRepository
from app.schemas.table import TableCreate


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Table already exists or is in use") from exc


class TableService:
    def __init__(self, db: Session):
        self.db = db
        self.tables = TableRepository(db)
        self.sessions = TableSessionRepository(db)

    def list_tables(self) -> list[Table]:
        return self.tables.list()

    def create_table(self, payload: TableCreate) -> Table:
        table = self.tables.create(Table(name=payload.name.strip()))
        _commit(self.db)
        self.db.refresh(table)
        return table

    def open_table(self, table_id: int) -> TableSession:
        table = self.tables.get(table_id, for_update=True)
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        if table.status != "AVAILABLE":
            raise HTTPException(status_code=409, detail="Table is not available")

        table.status = "OCCUPIED"
        session = self.sessions.create(
            TableSession(table_id=table.id, qr_token=secrets.token_urlsafe(32), status="OPEN")
        )
        _commit(self.db)
        self.db.refresh(session)
        return session
    
    def list_table_sessions(self) -> list[TableSession]:
        return self.sessions.get_open_sessions()

    def close_session(self, session_id: int) -> TableSession:
        session = self.sessions.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Table session not found")
        if session.status != "OPEN":
            raise HTTPException(status_code=409, detail="Table session is already closed")

        table = self.tables.get(session.table_id, for_update=True)
        session.status = "CLOSED"
        session.closed_at = datetime.now(timezone.utc)
        if table:
            table.status = "CLEANING"
        _commit(self.db)
        self.db.refresh(session)
        return session

    def mark_cleaned(self, table_id: int) -> Table:
        table = self.tables.get(table_id, for_update=True)
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        if table.status != "CLEANING":
            raise HTTPException(status_code=409, detail="Table is not awaiting cleaning")
        table.status = "AVAILABLE"
        _commit(self.db)
        self.db.refresh(table)
        return table

    def resolve_qr(self, token: str) -> dict:
        session = self.sessions.get_open_by_token(token)
        if not session:
            raise HTTPException(status_code=404, detail="QR session is invalid or expired")
        return {
            "session_id": session.id,
            "table_id": session.table_id,
            "table_name": session.table.name,
            "status": "OPEN",
        }
