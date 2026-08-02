from fastapi.testclient import TestClient


def test_register_success(client: TestClient):
    resp = client.post("/api/auth/register", json={"username": "alice", "password": "secret123"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["username"] == "alice"
    assert len(body["token"]) > 20


def test_register_duplicate(client: TestClient):
    client.post("/api/auth/register", json={"username": "bob", "password": "secret123"})
    resp = client.post("/api/auth/register", json={"username": "bob", "password": "secret123"})
    assert resp.status_code == 409


def test_register_short_password(client: TestClient):
    resp = client.post("/api/auth/register", json={"username": "carol", "password": "123"})
    assert resp.status_code == 400


def test_login_success(client: TestClient):
    client.post("/api/auth/register", json={"username": "dave", "password": "secret123"})
    resp = client.post("/api/auth/login", json={"username": "dave", "password": "secret123"})
    assert resp.status_code == 200
    assert resp.json()["username"] == "dave"


def test_login_wrong_password(client: TestClient):
    client.post("/api/auth/register", json={"username": "erin", "password": "secret123"})
    resp = client.post("/api/auth/login", json={"username": "erin", "password": "wrongpass"})
    assert resp.status_code == 401


def test_health(client: TestClient):
    assert client.get("/api/health").json() == {"status": "ok"}
