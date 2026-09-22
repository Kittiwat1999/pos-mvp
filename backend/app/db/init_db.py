from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import RestaurantSettingKey
from app.core.security import hash_password
from app.db.session import engine
from app.models.category import Category
from app.models.product import Product
from app.models.service_types import ServiceType
from app.models.setting import SettingStr
from app.models.table import Table
from app.models.user import User


def seed_data(db: Session) -> None:
    restaurant_settings = {
        RestaurantSettingKey.NAME: "Baan Coffee House",
        RestaurantSettingKey.PHONE_NUMBER: "02 123 4567",
        RestaurantSettingKey.ADDRESS: "18 Sukhumvit 24, Khlong Tan, Bangkok 10110",
        RestaurantSettingKey.IMAGE_URL: None,
    }

    for key, value in restaurant_settings.items():
        setting = db.scalar(select(SettingStr).where(SettingStr.key == key.value))

        if setting is None:
            db.add(SettingStr(key=key.value, value=value))
        else:
            setting.value = value

    service_types = [
        {
            "name": "dine-in",
            "description": "Guests order from their table.",
            "is_active": True,
        },
        {
            "name": "takeway",
            "description": "Guests order for collection.",
            "is_active": True,
        },
    ]

    for item in service_types:
        service_type = db.scalar(
            select(ServiceType).where(ServiceType.name == item["name"])
        )

        if service_type is None:
            db.add(
                ServiceType(
                    name=item["name"],
                    description=item["description"],
                    is_active=item["is_active"],
                )
            )

    categories = {
        "Coffee": "Hot and iced coffee",
        "Food": "Cafe food and snacks",
    }

    category_records = {}

    for name, description in categories.items():
        category = db.scalar(
            select(Category).where(Category.name == name)
        )

        if category is None:
            category = Category(
                name=name,
                description=description,
                active=True,
            )
            db.add(category)
            db.flush()

        category_records[name] = category

    products = [
        {
            "category": "Coffee",
            "name": "Americano",
            "description": "Espresso with hot water",
            "price": 60.00,
            "stock_quantity": 100,
            "add_ons": [{"name": "Extra shot", "price": 20}],
        },
        {
            "category": "Coffee",
            "name": "Cappuccino",
            "description": "Espresso with steamed milk",
            "price": 75.00,
            "stock_quantity": 100,
            "add_ons": [{"name": "Oat milk", "price": 15}],
        },
        {
            "category": "Food",
            "name": "Club Sandwich",
            "description": "Toasted sandwich with chicken and vegetables",
            "price": 140.00,
            "stock_quantity": 30,
            "add_ons": [],
        },
        {
            "category": "Food",
            "name": "French Fries",
            "description": "Crispy salted fries",
            "price": 90.00,
            "stock_quantity": 50,
            "add_ons": [],
        },
    ]

    for item in products:
        category = category_records[item["category"]]

        product = db.scalar(
            select(Product).where(
                Product.name == item["name"],
                Product.category_id == category.id,
            )
        )

        if product is None:
            db.add(
                Product(
                    category_id=category.id,
                    name=item["name"],
                    description=item["description"],
                    price=item["price"],
                    active=True,
                    stock_quantity=item["stock_quantity"],
                    add_ons=item["add_ons"],
                )
            )

    for table_name in ("Table 1", "Table 2", "Table 3"):
        table = db.scalar(
            select(Table).where(Table.name == table_name)
        )

        if table is None:
            db.add(Table(name=table_name, status="AVAILABLE"))


def init_db() -> None:

    with Session(engine) as db:
        with db.begin():
            admin = db.scalar(
                select(User).where(User.username == "admin")
            )

            if admin is None:
                db.add(
                    User(
                        username="admin",
                        password_hash=hash_password("admin123"),
                        role="admin",
                    )
                )

            seed_data(db)