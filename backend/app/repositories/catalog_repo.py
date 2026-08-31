from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product


class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, active: bool | None = None) -> list[Category]:
        statement = select(Category).order_by(Category.name)
        if active is not None:
            statement = statement.where(Category.active == active)
        return list(self.db.scalars(statement).all())

    def get(self, category_id: int) -> Category | None:
        return self.db.get(Category, category_id)

    def create(self, category: Category) -> Category:
        self.db.add(category)
        self.db.flush()
        return category


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, active: bool | None = None, category_id: int | None = None, search: str | None = None) -> list[Product]:
        statement = select(Product).order_by(Product.name)
        if active is not None:
            statement = statement.where(Product.active == active)
        if category_id is not None:
            statement = statement.where(Product.category_id == category_id)
        if search:
            term = f"%{search.strip()}%"
            statement = statement.where(or_(Product.name.ilike(term), Product.description.ilike(term)))
        return list(self.db.scalars(statement).all())

    def get(self, product_id: int) -> Product | None:
        return self.db.get(Product, product_id)

    def create(self, product: Product) -> Product:
        self.db.add(product)
        self.db.flush()
        return product
