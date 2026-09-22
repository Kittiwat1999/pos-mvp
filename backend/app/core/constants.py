from enum import Enum

class RestaurantSettingKey(str, Enum):
    NAME = "RESTAURANT_NAME"
    PHONE_NUMBER = "RESTAURANT_PHONE_NUMBER"
    ADDRESS = "RESTAURANT_ADDRESS"
    IMAGE_URL = "RESTAURANT_IMAGE_URL"

Restaurant = RestaurantSettingKey