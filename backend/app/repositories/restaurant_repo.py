from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.setting import SettingStr
from app.models.service_types import ServiceType
from app.core.constants import RestaurantSettingKey
from app.schemas.restaurant import RestaurantBase

class RestaurantRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self) -> RestaurantBase:
        keys = (
            RestaurantSettingKey.NAME,
            RestaurantSettingKey.PHONE_NUMBER,
            RestaurantSettingKey.ADDRESS,
            RestaurantSettingKey.IMAGE_URL,
        )
        settings = self.db.scalars(
            select(SettingStr).where(SettingStr.key.in_(keys))
        ).all()
        values = {setting.key: setting.value for setting in settings}

        return RestaurantBase(
            name=values.get(RestaurantSettingKey.NAME),
            phone_number=values.get(RestaurantSettingKey.PHONE_NUMBER),
            address=values.get(RestaurantSettingKey.ADDRESS),
            image_url=values.get(RestaurantSettingKey.IMAGE_URL),
        )
        
    def update(self, payload: RestaurantBase) -> RestaurantBase:
        field_keys = {
            "name": RestaurantSettingKey.NAME,
            "phone_number": RestaurantSettingKey.PHONE_NUMBER,
            "address": RestaurantSettingKey.ADDRESS,
            "image_url": RestaurantSettingKey.IMAGE_URL,
        }
        updates = payload.model_dump(exclude_unset=True)
        keys = [field_keys[field] for field in updates]
        existing = {
            setting.key: setting
            for setting in self.db.scalars(
                select(SettingStr).where(SettingStr.key.in_(keys))
            ).all()
        }

        for field, value in updates.items():
            key = field_keys[field]
            setting = existing.get(key)
            if setting is None:
                self.db.add(SettingStr(key=key, value=value))
            else:
                setting.value = value

        self.db.flush()
        return self.get()
    
class ServicesTypeRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_list(self) -> list[ServiceType]:
        statement = select(ServiceType)
        return list(self.db.scalars(statement).all())

    def get(self, service_type_id: int) -> ServiceType:
        return self.db.get(ServiceType, service_type_id)
    