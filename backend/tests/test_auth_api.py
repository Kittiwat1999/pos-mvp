from fastapi.testclient import TestClient

from app.main import app


def test_login_returns_tokens_for_valid_credentials():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        print("test_login_returns_tokens_for_valid_credentials: pass")


def test_protected_route_requires_token():
    with TestClient(app) as client:
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
        print("test_protected_route_requires_token")


def test_login_rejects_invalid_credentials():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "wrongpassword"},
        )

        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "Incorrect username or password"
        print("test_login_rejects_invalid_credentials")


def test_login_with_missing_fields_returns_validation_error():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin"},
        )

        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "Validation error"
        assert "details" in data
        print("test_login_with_missing_fields_returns_validation_error")


def test_invalid_token_is_rejected():
    with TestClient(app) as client:
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )

        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"] == "Invalid authentication token"
        print("test_invalid_token_is_rejected")


def test_protected_route_accepts_valid_token():
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        token = login.json()["access_token"]

        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json()["username"] == "admin"
        print("test_protected_route_accepts_valid_token")
