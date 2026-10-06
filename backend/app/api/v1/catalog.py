from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_storage_service
from app.core.config import settings
from app.core.deps import get_current_user
from app.schemas.catalog import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    InventoryUpdate,
    ProductCreate,
    ProductListResponse,
    ProductOut,
    ProductUpdate,
)
from app.services.catalog_service import CatalogService
from app.services.storage_service import StorageService

router = APIRouter(tags=["catalog"])


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(active: bool | None = None, db: Session = Depends(get_db)):
    return CatalogService(db).categories.list(active)


@router.post(
    "/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return CatalogService(db).create_category(payload)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return CatalogService(db).update_category(category_id, payload)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)
):
    CatalogService(db).delete_category(category_id)


@router.get("/products", response_model=ProductListResponse)
def list_products(
    active: bool | None = None,
    category_id: int | None = None,
    search: str | None = Query(default=None, max_length=100),
    page: int | None = Query(default=1),
    display: int | None = Query(default=10),
    db: Session = Depends(get_db),
    storage_service: StorageService = Depends(get_storage_service),
):
    catalog = CatalogService(db, storage_service)
    products = catalog.list_products(active, category_id, search, page, display)
    products_count = catalog.products.count(active, category_id, search)
    return {"items": products, "total_count": products_count}


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    storage_service: StorageService = Depends(get_storage_service),
):
    return CatalogService(db, storage_service).get_product(product_id)


@router.post(
    "/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED
)
def create_product(
    name: str = Form(..., min_length=1, max_length=150),
    price: Decimal = Form(..., ge=0),
    category_id: int = Form(...),
    description: str | None = Form(default=None, max_length=1000),
    active: bool = Form(default=True),
    stock_quantity: int = Form(default=0, ge=0),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    storage_service: StorageService = Depends(get_storage_service),
    _: dict = Depends(get_current_user),
):
    image_filename: str | None = None
    if image is not None and image.filename:
        image_filename = storage_service.upload_image(
            image, settings.PRODUCTS_IMAGE_DIR
        ).filename

    payload = ProductCreate(
        name=name,
        price=price,
        category_id=category_id,
        description=description,
        active=active,
        stock_quantity=stock_quantity,
        image_url=image_filename,
    )
    return CatalogService(db, storage_service).create_product(payload)


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    name: str | None = Form(default=None, min_length=1, max_length=150),
    price: Decimal | None = Form(default=None, ge=0),
    category_id: int | None = Form(default=None),
    description: str | None = Form(default=None, max_length=1000),
    active: bool | None = Form(default=None),
    stock_quantity: int | None = Form(default=None, ge=0),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    storage_service: StorageService = Depends(get_storage_service),
    _: dict = Depends(get_current_user),
):
    catalog = CatalogService(db, storage_service)
    existing_product = catalog.products.get(product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    old_image_reference = existing_product.image_url
    new_image_filename: str | None = None

    if image is not None and image.filename:
        new_image_filename = storage_service.upload_image(
            image, settings.PRODUCTS_IMAGE_DIR
        ).filename

    payload_data = {
        key: value
        for key, value in {
            "name": name,
            "price": price,
            "category_id": category_id,
            "description": description,
            "active": active,
            "stock_quantity": stock_quantity,
            "image_url": new_image_filename,
        }.items()
        if value is not None
    }

    payload = ProductUpdate(**payload_data)
    updated_product = catalog.update_product(product_id, payload)

    if old_image_reference and new_image_filename:
        old_filename = _stored_filename(old_image_reference)
        if old_filename != new_image_filename:
            storage_service.delete_file(old_filename)

    return updated_product

@router.patch("/products/{product_id}/inventory", response_model=ProductOut)
def update_inventory(
    product_id: int,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    storage_service: StorageService = Depends(get_storage_service),
    _: dict = Depends(get_current_user),
):
    return CatalogService(db, storage_service).update_inventory(product_id, payload)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    storage_service: StorageService = Depends(get_storage_service),
    _: dict = Depends(get_current_user),
):
    catalog = CatalogService(db, storage_service)
    product = catalog.products.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.image_url:
        storage_service.delete_file(_stored_filename(product.image_url))

    CatalogService(db).delete_product(product_id)


def _stored_filename(image_reference: str) -> str:
    if image_reference.startswith(("http://", "https://")):
        bucket_marker = f"/{settings.MINIO_BUCKET}/"
        if bucket_marker in image_reference:
            return image_reference.rsplit(bucket_marker, 1)[-1]
    return image_reference
