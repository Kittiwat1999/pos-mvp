from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_category(client: TestClient, headers: dict[str, str]) -> dict:
    response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"name": f"Integration Category {uuid4().hex[:10]}"},
    )
    assert response.status_code == 201
    return response.json()


def create_product(client: TestClient, headers: dict[str, str], category_id: int) -> dict:
    response = client.post(
        "/api/v1/products",
        headers=headers,
        data={
            "category_id": str(category_id),
            "name": f"Integration Product {uuid4().hex[:10]}",
            "description": "Catalog integration product",
            "price": "60.00",
            "stock_quantity": "10",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_list_categories_returns_categories():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        response = client.get("/api/v1/categories")

        assert response.status_code == 200
        assert any(item["id"] == category["id"] for item in response.json())
        print("test_list_categories_returns_categories: pass")


def test_create_category_requires_authentication():
    with TestClient(app) as client:
        response = client.post("/api/v1/categories", json={"name": "Unauthorized Category"})

        assert response.status_code == 401
        print("test_create_category_requires_authentication: pass")


def test_create_category_returns_created_category():
    with TestClient(app) as client:
        headers = auth_headers(client)
        response = client.post(
            "/api/v1/categories",
            headers=headers,
            json={"name": f"Created Category {uuid4().hex[:10]}", "description": "Integration test"},
        )

        assert response.status_code == 201
        assert response.json()["active"] is True
        print("test_create_category_returns_created_category: pass")


def test_update_category_returns_updated_category():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        response = client.patch(
            f"/api/v1/categories/{category['id']}",
            headers=headers,
            json={"name": f"Updated Category {uuid4().hex[:10]}", "active": False},
        )

        assert response.status_code == 200
        assert response.json()["name"].startswith("Updated Category")
        assert response.json()["active"] is False
        print("test_update_category_returns_updated_category: pass")


def test_delete_category_rejects_category_with_products():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        product = create_product(client, headers, category["id"])
        response = client.delete(f"/api/v1/categories/{category['id']}", headers=headers)

        assert response.status_code == 409
        client.delete(f"/api/v1/products/{product['id']}", headers=headers)
        client.delete(f"/api/v1/categories/{category['id']}", headers=headers)
        print("test_delete_category_rejects_category_with_products: pass")


def test_list_products_filters_by_category_search_and_active_state():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        product = create_product(client, headers, category["id"])
        response = client.get(
            "/api/v1/products",
            params={"active": "true", "category_id": category["id"], "search": "Integration"},
        )

        assert response.status_code == 200
        assert [item["id"] for item in response.json()] == [product["id"]]
        print("test_list_products_filters_by_category_search_and_active_state: pass")


def test_get_product_returns_product():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        product = create_product(client, headers, category["id"])
        response = client.get(f"/api/v1/products/{product['id']}")

        assert response.status_code == 200
        assert response.json()["id"] == product["id"]
        assert response.json()["price"] == 60
        print("test_get_product_returns_product: pass")


def test_create_product_requires_authentication():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        response = client.post(
            "/api/v1/products",
            data={"category_id": str(category["id"]), "name": "Unauthorized Product", "price": "10"},
        )

        assert response.status_code == 401
        print("test_create_product_requires_authentication: pass")


def test_create_product_returns_created_product():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        response = client.post(
            "/api/v1/products",
            headers=headers,
            data={"category_id": str(category["id"]), "name": "Created Product", "price": "25.5"},
        )

        assert response.status_code == 201
        assert response.json()["category_id"] == category["id"]
        assert response.json()["price"] == 25.5
        assert response.json()["image_url"] is None
        print("test_create_product_returns_created_product: pass")


def test_update_product_returns_updated_product():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        product = create_product(client, headers, category["id"])
        response = client.patch(
            f"/api/v1/products/{product['id']}",
            headers=headers,
            json={"price": "75.50", "active": False},
        )

        assert response.status_code == 200
        assert response.json()["price"] == 75.5
        assert response.json()["active"] is False
        print("test_update_product_returns_updated_product: pass")


def test_update_product_inventory_returns_updated_product():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        product = create_product(client, headers, category["id"])
        response = client.patch(
            f"/api/v1/products/{product['id']}/inventory",
            headers=headers,
            json={"stock_quantity": 4},
        )

        assert response.status_code == 200
        assert response.json()["stock_quantity"] == 4
        print("test_update_product_inventory_returns_updated_product: pass")


def test_delete_product_returns_no_content():
    with TestClient(app) as client:
        headers = auth_headers(client)
        category = create_category(client, headers)
        product = create_product(client, headers, category["id"])
        response = client.delete(f"/api/v1/products/{product['id']}", headers=headers)

        assert response.status_code == 204
        assert client.get(f"/api/v1/products/{product['id']}").status_code == 404
        print("test_delete_product_returns_no_content: pass")
