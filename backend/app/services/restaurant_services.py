from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.repositories.restaurant_repo import (
    RestaurantRepository,
    ServicesTypeRepository,
)
from app.schemas.restaurant import RestaurantBase, RestaurantUpdate, ServiceTypeUpdate
from app.models.service_types import ServiceType

def _commit(db: Session, errmsg: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=errmsg,
        ) from exc


class RestaurantService:
    def __init__(self, db: Session):
        self.db = db
        self.restaurant = RestaurantRepository(db)
        self.service_type = ServicesTypeRepository(db)

    def update_restaurant(self, payload: RestaurantUpdate) -> RestaurantBase:
        updated_restaurant = self.restaurant.update(payload)
        _commit(self.db, "Restaurant settings could not be updated")
        return updated_restaurant

    def update_service_type(self, service_type_id: int, payload: ServiceTypeUpdate) -> ServiceType:
        service_type = self.service_type.get(service_type_id)
        if not service_type:
            raise HTTPException(status_code=404, detail="Category not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(service_type, key, value)

        _commit(self.db, "Service type could not be updated")
        self.db.refresh(service_type)
        return service_type
