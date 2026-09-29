from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session

from app.models.table import Table, TableSession

class TableRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, search: str | None = None, status: str | None = None, active: bool | None = None, page: int | None = 1, limit: int | None = 10 ) -> list[Table]:
        statement = select(Table).order_by(Table.id)
        page_number = max(page or 1, 1)
        page_size = max(limit or 10, 1)
        if active is not None:
            statement = statement.where(Table.active == active)
        if status is not None:
            statement = statement.where(Table.status == status)
        if search:
            term = f"%{search.strip()}%"
            statement = statement.where(or_(Table.name.ilike(term)))
        statement = (
            statement
            .offset((page_number - 1) * page_size)
            .limit(page_size)
        )
        return list(self.db.scalars(statement).all())

    def get(self, table_id: int, for_update: bool = False) -> Table | None:
        statement = select(Table).where(Table.id == table_id)
        if for_update:
            statement = statement.with_for_update()
        return self.db.scalar(statement)

    def create(self, table: Table) -> Table:
        self.db.add(table)
        self.db.flush()
        return table
    
    def count(
            self,
            search: str | None = None,
            status: str | None = None,
            active: bool | None = None,
        ) -> int:
            statement = select(func.count(Table.id))
            if active is not None:
                statement = statement.where(Table.active == active)
            if status is not None:
                statement = statement.where(Table.status == status)
            if search is not None:
                term = f"%{search.strip()}%"
                statement = statement.where(
                    or_(Table.name.ilike(term))
                )
    
            return int(self.db.scalar(statement) or 0)


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
