import itertools
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

PASS = "secret123"
_counter = itertools.count(1)


def _iso(dt: datetime) -> str:
    return dt.isoformat(timespec="microseconds") + "Z"


def _setup(client: TestClient):
    username = f"syncer{next(_counter)}"
    resp = client.post("/api/auth/register", json={"username": username, "password": PASS})
    return {"Authorization": f"Bearer {resp.json()['token']}"}


def test_sync_pushes_offline_created_task(client: TestClient):
    headers = _setup(client)
    now = datetime.utcnow()
    client_sync_at = _iso(now - timedelta(hours=1))

    resp = client.post(
        "/api/sync",
        json={
            "last_sync_at": client_sync_at,
            "upserts": [
                {
                    "id": "task-offline-1",
                    "name": "Offline task",
                    "tag": "mobile",
                    "completed": False,
                    "created_at": _iso(now - timedelta(minutes=30)),
                    "updated_at": _iso(now - timedelta(minutes=5)),
                    "deleted_at": None,
                }
            ],
            "deletes": [],
        },
        headers=headers,
    )
    assert resp.status_code == 200
    tasks = resp.json()["tasks"]
    assert any(t["id"] == "task-offline-1" for t in tasks)

    server_list = client.get("/api/tasks", headers=headers).json()
    assert any(t["id"] == "task-offline-1" for t in server_list)


def test_sync_server_version_wins_when_newer(client: TestClient):
    headers = _setup(client)
    created = client.post(
        "/api/tasks", json={"name": "Original", "tag": "work"}, headers=headers
    ).json()
    server_updated = datetime.utcnow()

    # Client has an OLDER update
    stale_updated = _iso(server_updated - timedelta(minutes=10))
    resp = client.post(
        "/api/sync",
        json={
            "last_sync_at": _iso(server_updated - timedelta(hours=1)),
            "upserts": [
                {
                    "id": created["id"],
                    "name": "Stale client name",
                    "tag": "wrong",
                    "completed": True,
                    "created_at": created["created_at"],
                    "updated_at": stale_updated,
                    "deleted_at": None,
                }
            ],
            "deletes": [],
        },
        headers=headers,
    ).json()
    task = next(t for t in resp["tasks"] if t["id"] == created["id"])
    assert task["name"] == "Original"


def test_sync_client_version_wins_when_newer(client: TestClient):
    headers = _setup(client)
    created = client.post(
        "/api/tasks", json={"name": "Old name", "tag": ""}, headers=headers
    ).json()
    server_updated = datetime.utcnow()
    client_updated = _iso(server_updated + timedelta(minutes=10))

    resp = client.post(
        "/api/sync",
        json={
            "last_sync_at": _iso(server_updated - timedelta(hours=1)),
            "upserts": [
                {
                    "id": created["id"],
                    "name": "New client name",
                    "tag": "fresh",
                    "completed": True,
                    "created_at": created["created_at"],
                    "updated_at": client_updated,
                    "deleted_at": None,
                }
            ],
            "deletes": [],
        },
        headers=headers,
    ).json()
    task = next(t for t in resp["tasks"] if t["id"] == created["id"])
    assert task["name"] == "New client name"
    assert task["tag"] == "fresh"
    assert task["completed"] is True


def test_sync_pushes_delete(client: TestClient):
    headers = _setup(client)
    created = client.post(
        "/api/tasks", json={"name": "To delete", "tag": ""}, headers=headers
    ).json()
    now = datetime.utcnow()

    resp = client.post(
        "/api/sync",
        json={
            "last_sync_at": _iso(now - timedelta(hours=1)),
            "upserts": [],
            "deletes": [{"id": created["id"], "updated_at": _iso(now)}],
        },
        headers=headers,
    ).json()
    assert any(t["id"] == created["id"] and t["deleted_at"] for t in resp["tasks"])
    assert client.get("/api/tasks", headers=headers).json() == []


def test_sync_returns_remote_changes(client: TestClient):
    headers = _setup(client)
    client_sync_at = _iso(datetime.utcnow() - timedelta(hours=1))

    # Another "device" adds a task directly via the API
    client.post(
        "/api/tasks", json={"name": "Remote task", "tag": "server"}, headers=headers
    )

    resp = client.post(
        "/api/sync", json={"last_sync_at": client_sync_at, "upserts": [], "deletes": []}, headers=headers
    ).json()
    assert any(t["name"] == "Remote task" for t in resp["tasks"])
