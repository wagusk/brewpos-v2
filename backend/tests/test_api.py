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
    # / serves the SPA index when frontend/dist is built, or a JSON
    # descriptor when running backend-only. Both are valid responses.
    response = client.get("/")
    assert response.status_code == 200
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        assert "Brew-POS" in response.json()["app"]
    else:
        assert "text/html" in content_type
        assert "<html" in response.text.lower()

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


def test_order_has_discount_tax_columns():
    """Regression: Order model declares discount/discount_reason/tax columns.

    Fresh DBs created via Base.metadata.create_all lacked these NOT NULL
    columns on the legacy schema, causing INSERT to fail with
    'NOT NULL constraint failed: orders.discount'. The model now owns
    these columns so create_all produces a correct fresh schema.
    """
    from app.modules.orders.models import Order
    from sqlalchemy import inspect
    mapper = inspect(Order)
    column_names = {c.key for c in mapper.columns}
    assert "discount" in column_names
    assert "discount_reason" in column_names
    assert "tax" in column_names


def test_order_out_includes_discount_tax():
    """Regression: OrderOut schema exposes the new columns so the cashier
    UI can show discounts and tax in the bill view."""
    from app.schemas import OrderOut
    fields = set(OrderOut.model_fields.keys())
    assert "discount" in fields
    assert "discount_reason" in fields
    assert "tax" in fields
