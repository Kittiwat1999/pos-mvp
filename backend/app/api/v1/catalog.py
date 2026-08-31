from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.deps import get_current_user
from app.schemas.catalog import CategoryCreate, CategoryOut, CategoryUpdate, InventoryUpdate, ProductCreate, ProductOut, ProductUpdate
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["catalog"])


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(active: bool | None = None, db: Session = Depends(get_db)):
    return CatalogService(db).categories.list(active)


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return CatalogService(db).create_category(payload)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return CatalogService(db).update_category(category_id, payload)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    CatalogService(db).delete_category(category_id)


@router.get("/products", response_model=list[ProductOut])
def list_products(active: bool | None = None, category_id: int | None = None, search: str | None = Query(default=None, max_length=100), db: Session = Depends(get_db)):
    return CatalogService(db).products.list(active, category_id, search)


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = CatalogService(db).products.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return CatalogService(db).create_product(payload)


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return CatalogService(db).update_product(product_id, payload)


@router.patch("/products/{product_id}/inventory", response_model=ProductOut)
def update_inventory(product_id: int, payload: InventoryUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    return CatalogService(db).update_inventory(product_id, payload)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    CatalogService(db).delete_product(product_id)
