import itertools
import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

import pytest
from fastapi.testclient import TestClient

from app.main import app

_test_counter = itertools.count(1)


@pytest.fixture(scope="session")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth_headers(client: TestClient):
    username = f"tester{next(_test_counter)}"
    resp = client.post("/api/auth/register", json={"username": username, "password": "secret123"})
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}
