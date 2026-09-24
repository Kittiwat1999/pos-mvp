from pydantic import BaseModel, Field, ConfigDict

class RestaurantBase(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    phone_number: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=500)
    

class RestaurantUpdate(RestaurantBase):
    pass
    
class ServiceTypeBase(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=50)
    active: bool = True
    description: str | None = Field(default=None, max_length=100)
    
class ServiceTypeCreate(ServiceTypeBase):
    pass

class ServiceTypeUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    description: str | None = Field(
        default=None,
        max_length=100,
    )
    active: bool | None = None
    
class ServiceTypeOut(ServiceTypeBase):
    pass

class RestaurantUpdate(RestaurantBase):
    pass
    
class RestaurantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
            
    restaurant: RestaurantBase
    service_types: list[ServiceTypeOut]