from __future__ import annotations
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.seed import run as run_seed

@pytest.fixture(autouse=True)
def setup_db():
    run_seed()

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Brew-POS" in response.json()["app"]

def test_login_success():
    response = client.post("/api/auth/login", json={"pin": "9999"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Admin"

def test_login_failure():
    response = client.post("/api/auth/login", json={"pin": "0000"})
    assert response.status_code == 401

def test_get_menu():
    response = client.get("/api/menu")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert "products" in data
    assert len(data["categories"]) > 0

def test_get_tables():
    response = client.get("/api/tables")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_admin_users_unauthorized():
    response = client.get("/api/admin/users")
    assert response.status_code in (401, 403)

def test_admin_users_authorized():
    # Login as admin
    login_res = client.post("/api/auth/login", json={"pin": "9999"})
    token = login_res.json()["access_token"]

    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) > 0


def test_cashier_checkout_succeeds():
    """Regression: cashier's persisted permissions must include order.open.

    Previously, re-seed only refreshed superuser permissions, leaving every
    other user with an empty permissions array. The frontend Save button
    gates on can(user, 'order.open'), which returned false and disabled the
    button; meanwhile the API also returned 403 Missing permission.
    """
    login_res = client.post("/api/auth/login", json={"pin": "1111"})
    assert login_res.status_code == 200
    user = login_res.json()["user"]
    assert user["role"] == "cashier"
    # The core regression: persisted permissions must be populated so the
    # frontend can() check passes and the server-side permission check
    # accepts the checkout request.
    assert "order.open" in user["permissions"], user["permissions"]
    assert "order.close" in user["permissions"], user["permissions"]
