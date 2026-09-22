from fastapi import APIRouter, File, UploadFile, status, Depends

from app.schemas.storage import UploadedImageOut
from app.services.storage_service import StorageService
from app.core.deps import get_current_user
from app.core.config import settings
router = APIRouter(prefix="/files", tags=["files"])


@router.post(
    "/upload", response_model=UploadedImageOut, status_code=status.HTTP_201_CREATED
)
def upload_file(
    file: UploadFile = File(...),
    _: dict = Depends(get_current_user),
) -> UploadedImageOut:
    uploaded = StorageService().upload_image(file, settings.PRODUCTS_IMAGE_DIR)
    return UploadedImageOut(filename=uploaded.filename, image_url=uploaded.image_url)


@router.get("/{filename:path}", response_model=UploadedImageOut)
def get_file(filename: str) -> UploadedImageOut:
    image_url = StorageService().get_public_url(filename)
    return UploadedImageOut(filename=filename, image_url=image_url)


@router.delete("/{filename:path}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    filename: str,
    _: dict = Depends(get_current_user),
) -> None:
    StorageService().delete_file(filename)
