import time
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import init_db
from backend.app.db.user_repository import create_user, update_user
from backend.app.core.security import hash_password, create_access_token
from backend.app.core.rate_limit import login_rate_limiter
import datetime

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_state():
    init_db()
    login_rate_limiter.reset()

def test_login_success():
    response = client.post("/api/auth/login", json={"identifier": "admin", "password": "Admin@Workflow2026!"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "ADMIN"
    # Verify HttpOnly cookie was set
    assert "access_token" in response.cookies

def test_login_invalid_password():
    response = client.post("/api/auth/login", json={"identifier": "admin", "password": "WrongPassword!"})
    assert response.status_code == 401
    assert "Invalid username/email or password" in response.json()["detail"]

def test_login_unknown_username():
    response = client.post("/api/auth/login", json={"identifier": "ghost_user", "password": "AnyPassword123!"})
    assert response.status_code == 401
    assert "Invalid username/email or password" in response.json()["detail"]

def test_login_missing_credentials():
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 422

def test_login_inactive_account():
    # Create deactivated user with unique identifier for test idempotency
    import uuid
    uid = uuid.uuid4().hex[:8]
    h = hash_password("InactivePass123!")
    user = create_user(f"inactive_{uid}", f"inactive_{uid}@workflow.local", h, "EMPLOYEE", is_active=False)

    response = client.post("/api/auth/login", json={"identifier": f"inactive_{uid}", "password": "InactivePass123!"})
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"].lower()

def test_auth_me_success():
    login_res = client.post("/api/auth/login", json={"identifier": "admin", "password": "Admin@Workflow2026!"})
    token = login_res.json()["access_token"]

    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["username"] == "admin"
    assert me_data["role"] == "ADMIN"
    assert "password_hash" not in me_data

def test_auth_me_invalid_token():
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"]

def test_auth_me_expired_token():
    token, _ = create_access_token(
        user_id="test-id",
        username="admin",
        role="ADMIN",
        expires_delta=datetime.timedelta(seconds=-10)
    )
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()

def test_logout():
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["detail"] == "Logged out successfully"

def test_public_registration_disabled():
    response = client.post("/api/auth/register", json={"username": "newguy", "password": "password123"})
    assert response.status_code == 403
    assert "disabled" in response.json()["detail"].lower()

def test_login_rate_limiting():
    # Attempt 5 consecutive failed logins to trigger rate limiter
    for _ in range(5):
        client.post("/api/auth/login", json={"identifier": "ratelimit_target", "password": "bad"})

    # 6th attempt should be blocked with 429
    res = client.post("/api/auth/login", json={"identifier": "ratelimit_target", "password": "bad"})
    assert res.status_code == 429
    assert "Too many failed login attempts" in res.json()["detail"]

