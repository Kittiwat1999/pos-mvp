from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_qr_setup(client: TestClient, headers: dict[str, str]) -> dict:
    category = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": f"QR Category {uuid4().hex[:10]}"},
    )
    assert category.status_code == 201

    product = client.post(
        "/api/v1/products",
        headers=headers,
        json={
            "category_id": category.json()["id"],
            "name": f"QR Product {uuid4().hex[:10]}",
            "price": "60.00",
            "active": True,
        },
    )
    assert product.status_code == 201

    table = client.post(
        "/api/v1/tables",
        headers=headers,
        json={"name": f"QR Table {uuid4().hex[:10]}"},
    )
    assert table.status_code == 201

    session = client.post(
        f"/api/v1/tables/{table.json()['id']}/open",
        headers=headers,
    )
    assert session.status_code == 200

    return {
        "product_id": product.json()["id"],
        "session_id": session.json()["id"],
        "qr_token": session.json()["qr_token"],
    }


def test_resolve_qr_token_returns_open_session():
    with TestClient(app) as client:
        setup = create_qr_setup(client, auth_headers(client))

        response = client.get(f"/api/v1/qr/{setup['qr_token']}")

        assert response.status_code == 200
        assert response.json()["session_id"] == setup["session_id"]
        assert response.json()["status"] == "OPEN"


def test_customer_can_submit_order_with_qr_token():
    with TestClient(app) as client:
        setup = create_qr_setup(client, auth_headers(client))

        response = client.post(
            f"/api/v1/qr/{setup['qr_token']}/orders",
            json={
                "items": [
                    {
                        "product_id": setup["product_id"],
                        "quantity": 2,
                        "note": "No onions",
                    }
                ]
            },
        )

        assert response.status_code == 201
        assert response.json()["table_session_id"] == setup["session_id"]
        assert response.json()["status"] == "PENDING"
        assert response.json()["items"][0]["note"] == "No onions"


def test_unknown_qr_token_is_rejected():
    with TestClient(app) as client:
        response = client.get("/api/v1/qr/unknown-token")

        assert response.status_code == 404
