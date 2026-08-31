from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.table import Table, TableSession


class TableRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Table]:
        return list(self.db.scalars(select(Table).order_by(Table.name)).all())

    def get(self, table_id: int, for_update: bool = False) -> Table | None:
        statement = select(Table).where(Table.id == table_id)
        if for_update:
            statement = statement.with_for_update()
        return self.db.scalar(statement)

    def create(self, table: Table) -> Table:
        self.db.add(table)
        self.db.flush()
        return table


class TableSessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, session_id: int) -> TableSession | None:
        return self.db.get(TableSession, session_id)
    
    def list_sessions(self) -> list[TableSession]:
        return list(self.db.scalars(select(TableSession)).all())

    def get_open_sessions(self) -> list[TableSession]:
        statement = select(TableSession).where(TableSession.status == "OPEN")
        return list(self.db.scalars(statement).all())

    def get_open_by_token(self, token: str) -> TableSession | None:
        statement = select(TableSession).where(TableSession.qr_token == token, TableSession.status == "OPEN")
        return self.db.scalar(statement)

    def create(self, session: TableSession) -> TableSession:
        self.db.add(session)
        self.db.flush()
        return session
