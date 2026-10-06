from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.deps import get_current_user
from app.schemas.table import TableCreate, TableUpdate, TableOut, TableList, TableStatus
from app.services.table_service import TableService

router = APIRouter(tags=["settings tables"])


@router.get("/settings/tables", response_model=TableList)
def list_tables(
    search: str | None = Query(default=None, max_length=100),
    status: TableStatus | None = Query(default=None),
    active: bool | None = None,
    page: int | None = Query(default=1),
    limit: int | None = Query(default=10),

    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)):
    return {"tables": TableService(db).list_tables(search, status, active, page, limit), "total_count": TableService(db).table_count(search, status, active)}

@router.post("/settings/tables", response_model=TableOut, status_code=status.HTTP_201_CREATED)
def create_table(payload: TableCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return TableService(db).create_table(payload)

@router.patch("/settings/tables/{table_id}", response_model=TableOut)
def update_table(table_id:int, payload: TableUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return TableService(db).update_table(table_id, payload);
