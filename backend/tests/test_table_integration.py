from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_table(client: TestClient, headers: dict[str, str]) -> dict:
    response = client.post(
        "/api/v1/tables",
        headers=headers,
        json={"name": f"Integration Table {uuid4().hex[:10]}"},
    )
    assert response.status_code == 201
    return response.json()


def test_list_tables_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/v1/tables")

        assert response.status_code == 401
        print("test_list_tables_requires_authentication: pass")


def test_list_tables_returns_tables():
    with TestClient(app) as client:
        headers = auth_headers(client)
        table = create_table(client, headers)
        response = client.get("/api/v1/tables", headers=headers)

        assert response.status_code == 200
        assert any(item["id"] == table["id"] for item in response.json())
        print("test_list_tables_returns_tables: pass")


def test_create_table_returns_available_table():
    with TestClient(app) as client:
        headers = auth_headers(client)
        response = client.post(
            "/api/v1/tables",
            headers=headers,
            json={"name": f"Created Table {uuid4().hex[:10]}"},
        )

        assert response.status_code == 201
        assert response.json()["status"] == "AVAILABLE"
        print("test_create_table_returns_available_table: pass")


def test_open_table_returns_open_session():
    with TestClient(app) as client:
        headers = auth_headers(client)
        table = create_table(client, headers)
        response = client.post(f"/api/v1/tables/{table['id']}/open", headers=headers)

        assert response.status_code == 200
        assert response.json()["table_id"] == table["id"]
        assert response.json()["status"] == "OPEN"
        assert response.json()["qr_token"]
        print("test_open_table_returns_open_session: pass")

def test_close_table_session_returns_closed_session():
    with TestClient(app) as client:
        headers = auth_headers(client)
        table = create_table(client, headers)
        opened = client.post(f"/api/v1/tables/{table['id']}/open", headers=headers)
        response = client.post(
            f"/api/v1/table-sessions/{opened.json()['id']}/close",
            headers=headers,
        )

        assert response.status_code == 200
        assert response.json()["status"] == "CLOSED"
        assert response.json()["closed_at"] is not None
        print("test_close_table_session_returns_closed_session: pass")


def test_list_table_sessions_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/v1/table-sessions")

        assert response.status_code == 401
        print("test_list_table_sessions_requires_authentication: pass")
        
def test_list_table_sessions_returns_sessions():
    with TestClient(app) as client:
        headers = auth_headers(client)
        table = create_table(client, headers)
        opened = client.post(f"/api/v1/tables/{table['id']}/open", headers=headers)
        response = client.get("/api/v1/table-sessions", headers=headers)

        assert response.status_code == 200
        assert any(item["table_id"] == opened.json()["table_id"] for item in response.json())
        print("test_list_table_sessions_returns_sessions: pass")

def test_resolve_qr_returns_open_session():
    with TestClient(app) as client:
        headers = auth_headers(client)
        table = create_table(client, headers)
        opened = client.post(f"/api/v1/tables/{table['id']}/open", headers=headers)
        session = opened.json()
        response = client.get(f"/api/v1/qr/{session['qr_token']}")

        assert response.status_code == 200
        assert response.json()["session_id"] == session["id"]
        assert response.json()["table_id"] == table["id"]
        assert response.json()["status"] == "OPEN"
        print("test_resolve_qr_returns_open_session: pass")


def test_resolve_qr_rejects_unknown_token():
    with TestClient(app) as client:
        response = client.get(f"/api/v1/qr/unknown-{uuid4().hex}")

        assert response.status_code == 404
        print("test_resolve_qr_rejects_unknown_token: pass")


def test_clean_table_returns_available_table():
    with TestClient(app) as client:
        headers = auth_headers(client)
        table = create_table(client, headers)
        opened = client.post(f"/api/v1/tables/{table['id']}/open", headers=headers)
        client.post(f"/api/v1/table-sessions/{opened.json()['id']}/close", headers=headers)
        response = client.post(f"/api/v1/tables/{table['id']}/clean", headers=headers)

        assert response.status_code == 200
        assert response.json()["status"] == "AVAILABLE"
        print("test_clean_table_returns_available_table: pass")
