import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import init_db
from backend.app.db.user_repository import (
    get_user_by_username_or_email,
    create_user,
    count_active_admins,
)
from backend.app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_rbac_state():
    init_db()

def _get_token_for(username: str) -> str:
    user = get_user_by_username_or_email(username)
    assert user is not None, f"User {username} must exist"
    token, _ = create_access_token(user_id=user["id"], username=user["username"], role=user["role"])
    return token

def test_admin_can_access_admin_user_management():
    admin_token = _get_token_for("admin")
    res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 3
    assert any(u["username"] == "admin" for u in users)

def test_manager_cannot_access_admin_user_management():
    manager_token = _get_token_for("manager")
    res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {manager_token}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_employee_cannot_access_admin_user_management():
    employee_token = _get_token_for("sarah")
    res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {employee_token}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_admin_can_create_provisioned_user():
    admin_token = _get_token_for("admin")
    payload = {
        "username": "new_engineer",
        "email": "engineer@workflow.local",
        "password": "SecurePassword123!",
        "role": "EMPLOYEE",
        "employee_name": "Alex Rivera"
    }
    res = client.post("/api/admin/users", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 201
    created = res.json()
    assert created["username"] == "new_engineer"
    assert created["role"] == "EMPLOYEE"
    assert "password_hash" not in created

def test_admin_cannot_deactivate_last_active_admin():
    admin_token = _get_token_for("admin")
    admin_user = get_user_by_username_or_email("admin")
    
    # Try to deactivate the solitary admin
    res = client.post(f"/api/admin/users/{admin_user['id']}/deactivate", headers={"Authorization": f"Bearer {admin_token}"})
    # Must be rejected because only 1 active admin remains
    assert res.status_code == 400
    assert "final active administrator" in res.json()["detail"].lower()

def test_employee_task_scoping():
    sarah_token = _get_token_for("sarah")
    res = client.get("/api/tasks", headers={"Authorization": f"Bearer {sarah_token}"})
    assert res.status_code == 200
    tasks = res.json()["tasks"]
    assert len(tasks) > 0
    # Every task returned must belong to Sarah Jenkins
    for t in tasks:
        assert t["employee"] == "Sarah Jenkins"

def test_manager_views_all_tasks():
    manager_token = _get_token_for("manager")
    res = client.get("/api/tasks", headers={"Authorization": f"Bearer {manager_token}"})
    assert res.status_code == 200
    tasks = res.json()["tasks"]
    assert len(tasks) == 24
    employees = {t["employee"] for t in tasks}
    assert len(employees) > 1
