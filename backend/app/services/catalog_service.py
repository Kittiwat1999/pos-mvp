from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.repositories.catalog_repo import CategoryRepository, ProductRepository
from app.schemas.catalog import CategoryCreate, CategoryUpdate, InventoryUpdate, ProductCreate, ProductUpdate


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Catalog record already exists or is in use") from exc


class CatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.categories = CategoryRepository(db)
        self.products = ProductRepository(db)

    def create_category(self, payload: CategoryCreate) -> Category:
        category = self.categories.create(Category(**payload.model_dump()))
        _commit(self.db)
        self.db.refresh(category)
        return category

    def update_category(self, category_id: int, payload: CategoryUpdate) -> Category:
        category = self.categories.get(category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(category, key, value)
        _commit(self.db)
        self.db.refresh(category)
        return category

    def delete_category(self, category_id: int) -> None:
        category = self.categories.get(category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        if category.products:
            raise HTTPException(status_code=409, detail="Category cannot be deleted while it has products")
        self.db.delete(category)
        _commit(self.db)

    def create_product(self, payload: ProductCreate) -> Product:
        if not self.categories.get(payload.category_id):
            raise HTTPException(status_code=400, detail="Category not found")
        product = self.products.create(Product(**payload.model_dump()))
        _commit(self.db)
        self.db.refresh(product)
        return product

    def update_product(self, product_id: int, payload: ProductUpdate) -> Product:
        product = self.products.get(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        updates = payload.model_dump(exclude_unset=True)
        if "category_id" in updates and not self.categories.get(updates["category_id"]):
            raise HTTPException(status_code=400, detail="Category not found")
        for key, value in updates.items():
            setattr(product, key, value)
        _commit(self.db)
        self.db.refresh(product)
        return product

    def update_inventory(self, product_id: int, payload: InventoryUpdate) -> Product:
        product = self.products.get(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product.stock_quantity = payload.stock_quantity
        _commit(self.db)
        self.db.refresh(product)
        return product

    def delete_product(self, product_id: int) -> None:
        product = self.products.get(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        self.db.delete(product)
        _commit(self.db)
