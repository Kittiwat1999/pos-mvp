from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import engine
from app.models.category import Category
from app.models.product import Product
from app.models.table import Table
from app.models.user import User


def seed_data(db: Session) -> None:
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
    Base.metadata.create_all(bind=engine)

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