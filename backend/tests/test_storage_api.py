from fastapi.testclient import TestClient

from app.main import app


def test_upload_file_is_saved_and_readable():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/files/upload",
            files={"file": ("sample.txt", b"hello pos mvp", "text/plain")},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["filename"] == "sample.txt"
        assert data["content_type"] == "text/plain"
        assert data["size_bytes"] == 13
        assert "url" in data

        file_id = data["id"]
        metadata = client.get(f"/api/v1/files/{file_id}")
        assert metadata.status_code == 200
        assert metadata.json()["filename"] == "sample.txt"

        signed_url = client.get(f"/api/v1/files/{file_id}/download-url")
        assert signed_url.status_code == 200
        assert "url" in signed_url.json()
