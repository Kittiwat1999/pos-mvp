from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.storage_service import StorageService

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    asset = StorageService(db).upload_file(file)
    return {
        **StorageService(db).serialize_asset(asset),
        "url": StorageService(db).get_signed_url(asset.id),
    }


@router.get("/{file_id}")
def get_file(file_id: int, db: Session = Depends(get_db)):
    asset = StorageService(db).get_file(file_id)
    return StorageService(db).serialize_asset(asset)


@router.get("/{file_id}/download-url")
def get_file_url(file_id: int, db: Session = Depends(get_db)):
    url = StorageService(db).get_signed_url(file_id)
    return {"url": url}
