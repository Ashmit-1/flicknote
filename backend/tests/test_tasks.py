from fastapi.testclient import TestClient


def test_requires_auth(client: TestClient):
    assert client.get("/api/tasks").status_code == 401


def test_task_crud(client: TestClient, auth_headers):
    created = client.post(
        "/api/tasks", json={"name": "Buy milk", "tag": "home"}, headers=auth_headers
    )
    assert created.status_code == 201
    task = created.json()
    assert task["name"] == "Buy milk"
    assert task["tag"] == "home"
    assert task["completed"] is False
    assert task["deleted_at"] is None
    assert task["created_at"].endswith("Z")

    listed = client.get("/api/tasks", headers=auth_headers).json()
    assert len(listed) == 1

    patched = client.patch(
        f"/api/tasks/{task['id']}",
        json={"completed": True, "tag": "errands"},
        headers=auth_headers,
    ).json()
    assert patched["completed"] is True
    assert patched["tag"] == "errands"
    assert patched["updated_at"] >= task["updated_at"]
    assert patched["completed_at"] is not None

    reopened = client.patch(
        f"/api/tasks/{task['id']}",
        json={"completed": False},
        headers=auth_headers,
    ).json()
    assert reopened["completed"] is False
    assert reopened["completed_at"] is None

    deleted = client.delete(f"/api/tasks/{task['id']}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get("/api/tasks", headers=auth_headers).json() == []


def test_cannot_access_other_users_task(client: TestClient, auth_headers):
    created = client.post(
        "/api/tasks", json={"name": "Mine"}, headers=auth_headers
    ).json()
    other = client.post(
        "/api/auth/register", json={"username": "other", "password": "secret123"}
    ).json()
    other_headers = {"Authorization": f"Bearer {other['token']}"}
    resp = client.patch(f"/api/tasks/{created['id']}", json={"completed": True}, headers=other_headers)
    assert resp.status_code == 404
    assert client.delete(f"/api/tasks/{created['id']}", headers=other_headers).status_code == 404
