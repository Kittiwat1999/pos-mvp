from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_order_setup(client: TestClient, headers: dict[str, str]) -> dict:
    category = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": f"Order Category {uuid4().hex[:10]}"},
    )
    assert category.status_code == 201
    category_id = category.json()["id"]

    product = client.post(
        "/api/v1/products",
        headers=headers,
        json={
            "category_id": category_id,
            "name": f"Order Product {uuid4().hex[:10]}",
            "price": "60.00",
            "active": True,
        },
    )
    assert product.status_code == 201

    table = client.post(
        "/api/v1/tables",
        headers=headers,
        json={"name": f"Order Table {uuid4().hex[:10]}"},
    )
    assert table.status_code == 201

    session = client.post(f"/api/v1/tables/{table.json()['id']}/open", headers=headers)
    assert session.status_code == 200

    return {
        "category_id": category_id,
        "product_id": product.json()["id"],
        "table_id": table.json()["id"],
        "session_id": session.json()["id"],
        "qr_token": session.json()["qr_token"],
    }


def test_post_session_order_creates_pending_order_with_price_snapshot():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_order_setup(client, headers)
        response = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/orders",
            json={"items": [{"product_id": setup["product_id"], "quantity": 2, "note": "Less spicy"}]},
        )

        assert response.status_code == 201
        order = response.json()
        assert order["table_session_id"] == setup["session_id"]
        assert order["status"] == "PENDING"
        assert order["subtotal"] == "120.00"
        assert order["total"] == "120.00"
        assert order["items"][0]["product_id"] == setup["product_id"]
        assert order["items"][0]["unit_price"] == "60.00"
        assert order["items"][0]["note"] == "Less spicy"
        print("test_post_session_order_creates_pending_order_with_price_snapshot: pass")


def test_post_qr_order_creates_order_for_open_session():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_order_setup(client, headers)
        response = client.post(
            f"/api/v1/qr/{setup['qr_token']}/orders",
            json={"items": [{"product_id": setup["product_id"], "quantity": 1}]},
        )

        assert response.status_code == 201
        assert response.json()["table_session_id"] == setup["session_id"]
        assert response.json()["status"] == "PENDING"
        print("test_post_qr_order_creates_order_for_open_session: pass")


def test_list_session_orders_returns_orders_for_session():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_order_setup(client, headers)
        created = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/orders",
            json={"items": [{"product_id": setup["product_id"], "quantity": 1}]},
        )
        response = client.get(f"/api/v1/table-sessions/{setup['session_id']}/orders")

        assert created.status_code == 201
        assert response.status_code == 200
        assert any(item["id"] == created.json()["id"] for item in response.json())
        print("test_list_session_orders_returns_orders_for_session: pass")


def test_list_qr_orders_returns_orders_for_open_qr_session():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_order_setup(client, headers)
        created = client.post(
            f"/api/v1/qr/{setup['qr_token']}/orders",
            json={"items": [{"product_id": setup["product_id"], "quantity": 1}]},
        )
        response = client.get(f"/api/v1/qr/{setup['qr_token']}/orders")

        assert created.status_code == 201
        assert response.status_code == 200
        assert any(item["id"] == created.json()["id"] for item in response.json())
        print("test_list_qr_orders_returns_orders_for_open_qr_session: pass")


def test_list_pending_orders_requires_authentication_and_returns_pending_orders():
    with TestClient(app) as client:
        unauthenticated = client.get("/api/v1/orders")
        assert unauthenticated.status_code == 401

        headers = auth_headers(client)
        setup = create_order_setup(client, headers)
        created = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/orders",
            json={"items": [{"product_id": setup["product_id"], "quantity": 1}]},
        )
        response = client.get("/api/v1/orders", headers=headers, params={"status": "pending"})

        assert created.status_code == 201
        assert response.status_code == 200
        assert any(item["id"] == created.json()["id"] for item in response.json())
        print("test_list_pending_orders_requires_authentication_and_returns_pending_orders: pass")


def test_update_order_status_allows_pending_to_confirmed():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_order_setup(client, headers)
        created = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/orders",
            json={"items": [{"product_id": setup["product_id"], "quantity": 1}]},
        )
        response = client.patch(
            f"/api/v1/orders/{created.json()['id']}/status",
            headers=headers,
            json={"status": "CONFIRMED"},
        )

        assert created.status_code == 201
        assert response.status_code == 200
        assert response.json()["status"] == "CONFIRMED"
        print("test_update_order_status_allows_pending_to_confirmed: pass")


def test_update_order_status_rejects_invalid_transition():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_order_setup(client, headers)
        created = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/orders",
            json={"items": [{"product_id": setup["product_id"], "quantity": 1}]},
        )
        response = client.patch(
            f"/api/v1/orders/{created.json()['id']}/status",
            headers=headers,
            json={"status": "COMPLETED"},
        )

        assert created.status_code == 201
        assert response.status_code == 409
        print("test_update_order_status_rejects_invalid_transition: pass")
