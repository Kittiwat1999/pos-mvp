from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.services.storage_service import StorageService


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_storage_service() -> StorageService:
    return StorageService()
