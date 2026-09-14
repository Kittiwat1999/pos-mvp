import io
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import settings
from app.main import app


def _png_bytes(
    color: tuple[int, int, int] = (20, 120, 200), size: tuple[int, int] = (640, 480)
) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color=color).save(buffer, format="PNG")
    return buffer.getvalue()

def _login(client):
    login = client.post(
                "/api/v1/auth/login", json={"username": "admin", "password": "admin123"}
            )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}

def _upload_image(client, headers):
    return client.post(
        "/api/v1/files/upload",
        headers=headers,
        files={"file": ("sample.png", _png_bytes(), "image/png")},
    )


def test_upload_image_returns_public_url_and_filename():
    with TestClient(app) as client:
        headers = _login(client)
        response = _upload_image(client, headers)
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
        headers = _login(client)

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


def test_delete_image_returns_204():
    with TestClient(app) as client:
        headers = _login(client)
        response = _upload_image(client, headers)
        assert response.status_code == 201
        data = response.json()
        assert data["filename"].startswith("uploads/")
        assert data["filename"].endswith(".webp")
        assert data["image_url"].endswith(data["filename"])

        response = client.delete(
            f"/api/v1/files/{data['filename']}", headers=headers
        )
        assert response.status_code == 204


def test_delete_product_with_image_cleans_up_storage_file():
    with TestClient(app) as client:
        headers = _login(client)
        category = client.post(
            "/api/v1/categories",
            headers=headers,
            json={"name": f"Delete Product Category {uuid4().hex[:10]}"},
        )
        assert category.status_code == 201

        response = client.post(
            "/api/v1/products",
            headers=headers,
            data={
                "category_id": str(category.json()["id"]),
                "name": f"Delete Product {uuid4().hex[:10]}",
                "price": "45.00",
                "description": "Remove me",
            },
            files={"image": ("product.png", _png_bytes(), "image/png")},
        )
        assert response.status_code == 201

        product = response.json()
        assert product["image_url"] is not None
        expected_filename = product["image_url"].rsplit(f"/{settings.MINIO_BUCKET}/", 1)[-1]

        with patch("app.api.v1.catalog.StorageService.delete_file") as delete_file_mock:
            delete_response = client.delete(
                f"/api/v1/products/{product['id']}", headers=headers
            )

        assert delete_response.status_code == 204
        delete_file_mock.assert_called_once_with(expected_filename)
        assert client.get(f"/api/v1/products/{product['id']}").status_code == 404


def test_update_product_with_image_stores_image_url():
    with TestClient(app) as client:
        headers = _login(client)

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
        
        old_image_url = product["image_url"]
        response = client.patch(
            f"/api/v1/products/{product['id']}",
            headers=headers,
            data={
                "category_id": str(category.json()["id"]),
                "name": product["name"],
                "price": str(product["price"]),
                "description": product["description"] or "",
                "active": str(product["active"]).lower(),
                "stock_quantity": str(product["stock_quantity"]),
            },
            files={"image": ("replacement.png", _png_bytes(color=(200, 80, 40)), "image/png")},
        )

        assert response.status_code == 200
        updated_product = response.json()
        assert updated_product["image_url"] is not None
        assert updated_product["image_url"] != old_image_url
        