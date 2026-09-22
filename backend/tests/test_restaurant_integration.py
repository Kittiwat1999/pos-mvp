import io
import pytest
from PIL import Image

from unittest.mock import patch
from app.core.config import settings

from fastapi.testclient import TestClient

from app.main import app


def png_bytes() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (64, 64), color=(20, 120, 200)).save(buffer, format="PNG")
    return buffer.getvalue()

def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_get_restaurant_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/v1/restaurant")

        assert response.status_code == 401


def test_get_restaurant_returns_settings_and_service_types():
    with TestClient(app) as client:
        headers = auth_headers(client)
        response = client.get("/api/v1/restaurant", headers=headers)

        assert response.status_code == 200
        body = response.json()
        assert body["restaurant"]["name"]
        assert isinstance(body["service_types"], list)


def test_update_restaurant_partial_form_preserves_existing_settings():
    with TestClient(app) as client:
        headers = auth_headers(client)
        before = client.get("/api/v1/restaurant", headers=headers)
        assert before.status_code == 200

        response = client.patch(
            "/api/v1/restaurant",
            headers=headers,
            data={"name": "Integration Test Restaurant"},
        )

        assert response.status_code == 200
        updated = response.json()["restaurant"]
        original = before.json()["restaurant"]
        assert updated["name"] == "Integration Test Restaurant"
        assert updated["phone_number"] == original["phone_number"]
        assert updated["address"] == original["address"]


def test_update_restaurant_with_logo_stores_logo_url():
    with TestClient(app) as client:
        headers = auth_headers(client)
        response = client.patch(
            "/api/v1/restaurant",
            headers=headers,
            data={"name": "Restaurant With Logo"},
            files={"image": ("restaurant-logo.png", png_bytes(), "image/png")},
        )

        assert response.status_code == 200
        image_url = response.json()["restaurant"]["image_url"]
        assert image_url is not None
        assert "/restaurants/" in image_url
        assert image_url.endswith(".webp")
        
def test_update_restaurant_with_new_logo_deletes_old_logo():
    with TestClient(app) as client:
        headers = auth_headers(client)

        first_response = client.patch(
            "/api/v1/restaurant",
            headers=headers,
            files={"image": ("old-logo.png", png_bytes(), "image/png")},
        )
        assert first_response.status_code == 200

        old_image_url = first_response.json()["restaurant"]["image_url"]
        old_filename = old_image_url.rsplit(
            f"/{settings.MINIO_BUCKET}/", 1
        )[-1]

        with patch(
            "app.api.v1.restaurant.StorageService.delete_file"
        ) as delete_file_mock:
            second_response = client.patch(
                "/api/v1/restaurant",
                headers=headers,
                files={"image": ("new-logo.png", png_bytes(), "image/png")},
            )

        assert second_response.status_code == 200
        new_image_url = second_response.json()["restaurant"]["image_url"]

        assert new_image_url != old_image_url
        delete_file_mock.assert_called_once_with(old_filename)


@pytest.mark.parametrize("active", [True, False])
def test_update_service_type_partial_active_value(active: bool):
    with TestClient(app) as client:
        headers = auth_headers(client)
        restaurant = client.get("/api/v1/restaurant", headers=headers)
        assert restaurant.status_code == 200
        service_type = restaurant.json()["service_types"][0]

        response = client.patch(
            f"/api/v1/serviec_type/{service_type['id']}",
            headers=headers,
            json={
                "name": service_type["name"],
                "description": service_type["description"],
                "active": active,
            },
        )

        assert response.status_code == 200
        assert response.json()["active"] is active

