from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_table(
    client: TestClient,
    headers: dict[str, str],
    *,
    name: str | None = None,
    capacity: int = 4,
) -> dict:
    response = client.post(
        "/api/v1/tables",
        headers=headers,
        json={
            "name": name or f"Integration Table {uuid4().hex[:10]}",
            "capacity": capacity,
        },
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
        response = client.get(
            "/api/v1/tables",
            headers=headers,
            params={"search": table["name"]},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["total_count"] == 1
        assert [item["id"] for item in body["tables"]] == [table["id"]]
        print("test_list_tables_returns_tables: pass")


def test_list_tables_filters_and_paginates_query_params():
    with TestClient(app) as client:
        headers = auth_headers(client)
        prefix = f"Query Table {uuid4().hex[:10]}"
        created_tables = [
            create_table(client, headers, name=f"{prefix} {number}")
            for number in range(3)
        ]
        inactive_response = client.patch(
            f"/api/v1/tables/{created_tables[1]['id']}",
            headers=headers,
            json={"active": False},
        )
        assert inactive_response.status_code == 200

        response = client.get(
            "/api/v1/tables",
            headers=headers,
            params={"search": prefix, "active": "true", "page": 2, "limit": 1},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["total_count"] == 2
        assert [table["id"] for table in body["tables"]] == [created_tables[2]["id"]]

        inactive_response = client.get(
            "/api/v1/tables",
            headers=headers,
            params={"search": prefix, "active": "false"},
        )
        assert inactive_response.status_code == 200
        inactive_body = inactive_response.json()
        assert inactive_body["total_count"] == 1
        assert [table["id"] for table in inactive_body["tables"]] == [
            created_tables[1]["id"]
        ]


def test_list_tables_rejects_invalid_query_params():
    with TestClient(app) as client:
        headers = auth_headers(client)
        response = client.get(
            "/api/v1/tables",
            headers=headers,
            params={"page": "not-an-integer"},
        )

        assert response.status_code == 422


def test_create_table_returns_available_table():
    with TestClient(app) as client:
        headers = auth_headers(client)
        response = client.post(
            "/api/v1/tables",
            headers=headers,
            json={"name": f"Created Table {uuid4().hex[:10]}", "capacity": 6},
        )

        assert response.status_code == 201
        assert response.json()["status"] == "AVAILABLE"
        assert response.json()["active"] is True
        assert response.json()["capacity"] == 6
        print("test_create_table_returns_available_table: pass")


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "" , "capacity": 4},
        {"name": f"Invalid Table {uuid4().hex[:10]}", "capacity": 0},
        {"name": f"Invalid Table {uuid4().hex[:10]}"},
    ],
)
def test_create_table_rejects_invalid_payload(payload: dict):
    with TestClient(app) as client:
        headers = auth_headers(client)
        response = client.post("/api/v1/tables", headers=headers, json=payload)

        assert response.status_code == 422


def test_update_table_supports_partial_updates():
    with TestClient(app) as client:
        headers = auth_headers(client)
        table = create_table(client, headers)
        response = client.patch(
            f"/api/v1/tables/{table['id']}",
            headers=headers,
            json={"capacity": 8, "active": False},
        )

        assert response.status_code == 200
        updated = response.json()
        assert updated["name"] == table["name"]
        assert updated["capacity"] == 8
        assert updated["active"] is False


@pytest.mark.parametrize(
    "payload",
    [
        {"name": ""},
        {"capacity": "not-an-integer"},
    ],
)
def test_update_table_rejects_invalid_payload(payload: dict):
    with TestClient(app) as client:
        headers = auth_headers(client)
        table = create_table(client, headers)
        response = client.patch(
            f"/api/v1/tables/{table['id']}",
            headers=headers,
            json=payload,
        )

        assert response.status_code == 422


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
