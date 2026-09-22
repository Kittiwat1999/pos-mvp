from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.deps import get_current_user
from app.schemas.restaurant import RestaurantOut, ServiceTypeUpdate, RestaurantUpdate
from app.services.restaurant_services import RestaurantService
from app.services.storage_service import StorageService

router = APIRouter(tags=["settings"])

@router.get("/restaurant", response_model = RestaurantOut)
def get(db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    restaurant = RestaurantService(db).restaurant.get()
    service_types = RestaurantService(db).service_type.get_list()
    return {"restaurant":restaurant, "service_types": service_types}

@router.patch('/restaurant', response_model = RestaurantOut)
def update_store(
    name: str | None = Form(default=None, min_length=1, max_length=150),
    phone_number: str | None = Form(default=None, max_length=50),
    address: str | None = Form(default=None, max_length=255),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    old_image_url = RestaurantService(db).restaurant.get().image_url
    new_image_url: str | None = None

    if image is not None and image.filename:
        new_image_url = StorageService().upload_image(image, settings.RESTAURANT_IMAGE_DIR).image_url
    
    payload_data = {
        key: value
        for key, value in {
            "name": name,
            "phone_number": phone_number,
            "address": address,
            "image_url": new_image_url,
        }.items()
        if value is not None
    }
    
    payload = RestaurantUpdate(**payload_data)
    updated_restaurant = RestaurantService(db).update_restaurant(payload)
    service_types = RestaurantService(db).service_type.get_list()
    
    if old_image_url and new_image_url and old_image_url != new_image_url:
        old_filename = old_image_url.rsplit(f"/{settings.MINIO_BUCKET}/", 1)[-1]
        StorageService().delete_file(old_filename)

    return {"restaurant": updated_restaurant, "service_types": service_types}
    
@router.patch("/serviec_type/{service_type_id}", response_model = ServiceTypeUpdate)
def update_service_type(service_type_id: int, payload: ServiceTypeUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    print(f"service type id: {service_type_id}")
    return RestaurantService(db).update_service_type(service_type_id, payload)
    