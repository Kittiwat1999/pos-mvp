from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_checkout_setup(client: TestClient, headers: dict[str, str], with_order: bool = True) -> dict:
    category = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": f"Payment Category {uuid4().hex[:10]}"},
    )
    assert category.status_code == 201

    product = client.post(
        "/api/v1/products",
        headers=headers,
        data={
            "category_id": str(category.json()["id"]),
            "name": f"Payment Product {uuid4().hex[:10]}",
            "price": "60.00",
            "active": "true",
        },
    )
    assert product.status_code == 201

    table = client.post(
        "/api/v1/tables",
        headers=headers,
        json={"name": f"Payment Table {uuid4().hex[:10]}"},
    )
    assert table.status_code == 201
    session = client.post(f"/api/v1/tables/{table.json()['id']}/open", headers=headers)
    assert session.status_code == 200
    session_data = session.json()

    order_id = None
    if with_order:
        order = client.post(
            f"/api/v1/table-sessions/{session_data['id']}/orders",
            json={"items": [{"product_id": product.json()["id"], "quantity": 2}]},
        )
        assert order.status_code == 201
        order_id = order.json()["id"]

    return {
        "session_id": session_data["id"],
        "order_id": order_id,
        "qr_token": session_data["qr_token"],
    }


def test_checkout_requires_authentication():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/table-sessions/999999/checkout",
            json={"method": "CASH"},
        )

        assert response.status_code == 401
        print("test_checkout_requires_authentication: pass")


def test_checkout_rejects_session_without_billable_orders():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_checkout_setup(client, headers, with_order=False)
        response = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/checkout",
            headers=headers,
            json={"method": "CASH"},
        )

        assert response.status_code == 409
        print("test_checkout_rejects_session_without_billable_orders: pass")


def test_checkout_creates_cash_payment_and_closes_session():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_checkout_setup(client, headers)
        response = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/checkout",
            headers=headers,
            json={"method": "CASH", "reference": "cash-drawer-1"},
        )

        assert response.status_code == 200
        payment = response.json()
        assert payment["table_session_id"] == setup["session_id"]
        assert payment["method"] == "CASH"
        assert payment["amount"] == "120.00"
        assert payment["reference"] == "cash-drawer-1"
        assert payment["receipt_number"].startswith("RCPT-")

        second_checkout = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/checkout",
            headers=headers,
            json={"method": "CASH"},
        )
        assert second_checkout.status_code == 409
        print("test_checkout_creates_cash_payment_and_closes_session: pass")


def test_get_payment_returns_payment_for_authenticated_staff():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_checkout_setup(client, headers)
        checkout = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/checkout",
            headers=headers,
            json={"method": "QR_PAYMENT", "reference": "qr-reference-1"},
        )
        payment_id = checkout.json()["id"]
        response = client.get(f"/api/v1/payments/{payment_id}", headers=headers)

        assert response.status_code == 200
        assert response.json()["id"] == payment_id
        assert response.json()["method"] == "QR_PAYMENT"
        print("test_get_payment_returns_payment_for_authenticated_staff: pass")


def test_get_payment_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/v1/payments/999999")

        assert response.status_code == 401
        print("test_get_payment_requires_authentication: pass")


def test_get_receipt_returns_paid_order_items():
    with TestClient(app) as client:
        headers = auth_headers(client)
        setup = create_checkout_setup(client, headers)
        checkout = client.post(
            f"/api/v1/table-sessions/{setup['session_id']}/checkout",
            headers=headers,
            json={"method": "CASH"},
        )
        payment_id = checkout.json()["id"]
        response = client.get(f"/api/v1/payments/{payment_id}/receipt", headers=headers)

        assert response.status_code == 200
        receipt = response.json()
        assert receipt["receipt_number"] == checkout.json()["receipt_number"]
        assert receipt["table_session_id"] == setup["session_id"]
        assert receipt["subtotal"] == "120.00"
        assert receipt["amount_paid"] == "120.00"
        assert receipt["method"] == "CASH"
        assert receipt["items"][0]["quantity"] == 2
        assert receipt["items"][0]["unit_price"] == "60.00"
        print("test_get_receipt_returns_paid_order_items: pass")


def test_get_receipt_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/v1/payments/999999/receipt")

        assert response.status_code == 401
        print("test_get_receipt_requires_authentication: pass")
