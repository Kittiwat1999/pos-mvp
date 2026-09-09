import io
from uuid import uuid4

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


def _png_bytes(color: tuple[int, int, int] = (20, 120, 200), size: tuple[int, int] = (640, 480)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color=color).save(buffer, format="PNG")
    return buffer.getvalue()


def test_upload_image_returns_public_url_and_filename():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/files/upload",
            files={"file": ("sample.png", _png_bytes(), "image/png")},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["filename"].startswith("uploads/")
        assert data["filename"].endswith(".webp")
        assert data["image_url"].endswith(data["filename"])

        metadata = client.get(f"/api/v1/files/{data['filename']}")
        assert metadata.status_code == 200
        assert metadata.json()["filename"] == data["filename"]
        assert metadata.json()["image_url"] == data["image_url"]


def test_create_product_with_image_stores_image_url():
    with TestClient(app) as client:
        login = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        assert login.status_code == 200
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        category = client.post(
            "/api/v1/categories",
            headers=headers,
            json={"name": f"Image Category {uuid4().hex[:10]}"},
        )
        assert category.status_code == 201

        response = client.post(
            "/api/v1/products",
            headers=headers,
            data={
                "category_id": str(category.json()["id"]),
                "name": f"Image Product {uuid4().hex[:10]}",
                "price": "45.00",
                "description": "With thumbnail",
            },
            files={"image": ("product.png", _png_bytes(), "image/png")},
        )

        assert response.status_code == 201
        product = response.json()
        assert product["image_url"] is not None
        assert "/uploads/" in product["image_url"]
        assert product["image_url"].endswith(".webp")
