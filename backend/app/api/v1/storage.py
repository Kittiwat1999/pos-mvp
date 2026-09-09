from fastapi import APIRouter, File, UploadFile, status

from app.schemas.storage import UploadedImageOut
from app.services.storage_service import StorageService

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=UploadedImageOut, status_code=status.HTTP_201_CREATED)
def upload_file(file: UploadFile = File(...)) -> UploadedImageOut:
    uploaded = StorageService().upload_image(file)
    return UploadedImageOut(filename=uploaded.filename, image_url=uploaded.image_url)


@router.get("/{filename:path}", response_model=UploadedImageOut)
def get_file(filename: str) -> UploadedImageOut:
    image_url = StorageService().get_public_url(filename)
    return UploadedImageOut(filename=filename, image_url=image_url)
