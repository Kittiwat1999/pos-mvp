from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.deps import get_current_user
from app.schemas.table import QrSessionOut, TableCreate, TableUpdate, TableOut, TableSessionOut, TableList, TableStatus
from app.services.table_service import TableService

router = APIRouter(tags=["tables"])


@router.get("/tables", response_model=TableList)
def list_tables(
    search: str | None = Query(default=None, max_length=100),
    status: TableStatus | None = Query(default=None),
    active: bool | None = None,
    page: int | None = Query(default=1),
    limit: int | None = Query(default=10),

    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)):
    return {"tables": TableService(db).list_tables(search, status, active, page, limit), "total_count": TableService(db).table_count(search, status, active)}

@router.post("/tables", response_model=TableOut, status_code=status.HTTP_201_CREATED)
def create_table(payload: TableCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return TableService(db).create_table(payload)

@router.patch("/tables/{table_id}", response_model=TableOut)
def update_table(table_id:int, payload: TableUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return TableService(db).update_table(table_id, payload);

@router.get("/table-sessions", response_model=list[TableSessionOut])
def list_table_sessions(db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return TableService(db).list_table_sessions()

@router.post("/tables/{table_id}/open", response_model=TableSessionOut)
def open_table(table_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return TableService(db).open_table(table_id)

@router.post("/table-sessions/{session_id}/close", response_model=TableSessionOut)
def close_session(session_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return TableService(db).close_session(session_id)

@router.post("/tables/{table_id}/clean", response_model=TableOut)
def mark_cleaned(table_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return TableService(db).mark_cleaned(table_id)


@router.get("/qr/{token}", response_model=QrSessionOut)
def resolve_qr(token: str, db: Session = Depends(get_db)):
    return TableService(db).resolve_qr(token)
