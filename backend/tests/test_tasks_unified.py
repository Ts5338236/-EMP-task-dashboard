from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.schemas.task import TaskSchema, TaskSource, TaskStatus, TaskUrgency
from backend.app.core.security import create_access_token
from backend.app.db.database import init_db
from backend.app.db.user_repository import get_user_by_username_or_email
from backend.app.scripts.bootstrap_admin import bootstrap_initial_users

init_db()
bootstrap_initial_users()
admin_user = get_user_by_username_or_email("admin")
_token, _ = create_access_token(user_id=admin_user["id"], username=admin_user["username"], role=admin_user["role"])

client = TestClient(app)
client.headers["Authorization"] = f"Bearer {_token}"

def test_unified_endpoint_anonymous_access_rejected():
    """
    Verifies that unauthenticated requests to GET /api/tasks are rejected with HTTP 401.
    """
    anon_client = TestClient(app)
    response = anon_client.get("/api/tasks")
    assert response.status_code == 401
    assert "detail" in response.json()

def test_unified_endpoint_success_merged_data():
    """
    Verifies that GET /api/tasks returns merged tasks from both CRM and Helpdesk
    with priority metadata and source statuses.
    """
    response = client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()

    assert "tasks" in data
    assert "sources" in data
    assert "warnings" in data
    assert "total" in data

    tasks = data["tasks"]
    assert len(tasks) >= 20  # 12 CRM + 12 Helpdesk = 24 tasks
    assert data["total"] == len(tasks)

    # Check sources status
    assert data["sources"]["crm"]["status"] == "success"
    assert data["sources"]["helpdesk"]["status"] == "success"

    # Both sources are represented
    sources_in_data = {t["source"] for t in tasks}
    assert "CRM" in sources_in_data
    assert "Helpdesk" in sources_in_data

    # Priority metadata is enriched
    for task in tasks:
        assert "priority_category" in task
        assert "priority_rank" in task
        assert "is_overdue" in task
        assert task["priority_category"] in ["Overdue", "Due Today", "Due Soon", "Upcoming", "Completed"]

def test_unified_endpoint_employee_filtering():
    response = client.get("/api/tasks?employee=Tushar")
    assert response.status_code == 200
    data = response.json()
    tasks = data["tasks"]
    assert len(tasks) > 0
    for task in tasks:
        assert "tushar" in task["employee"].lower()

def test_unified_endpoint_status_filtering():
    response = client.get("/api/tasks?status=Pending")
    assert response.status_code == 200
    data = response.json()
    tasks = data["tasks"]
    assert len(tasks) > 0
    for task in tasks:
        assert task["status"] == "Pending"

def test_unified_endpoint_invalid_status_returns_422():
    response = client.get("/api/tasks?status=NonExistentStatus")
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data

def test_unified_endpoint_search_filtering():
    response = client.get("/api/tasks?search=payment")
    assert response.status_code == 200
    data = response.json()
    tasks = data["tasks"]
    assert len(tasks) > 0
    for task in tasks:
        matches = (
            "payment" in task["title"].lower()
            or "payment" in task["description"].lower()
            or "payment" in task["employee"].lower()
            or "payment" in task["id"].lower()
        )
        assert matches

def test_unified_endpoint_search_by_task_id():
    response = client.get("/api/tasks?search=101")
    assert response.status_code == 200
    data = response.json()
    tasks = data["tasks"]
    assert len(tasks) > 0
    # ID 101 exists in both CRM and Helpdesk
    sources = {t["source"] for t in tasks if t["id"] == "101"}
    assert len(sources) >= 1

def test_unified_endpoint_search_by_source():
    response = client.get("/api/tasks?search=Helpdesk")
    assert response.status_code == 200
    data = response.json()
    tasks = data["tasks"]
    assert len(tasks) > 0
    for task in tasks:
        assert "helpdesk" in task["source"].lower()

def test_unified_endpoint_search_by_description():
    response = client.get("/api/tasks?search=DocuSign")
    assert response.status_code == 200
    data = response.json()
    tasks = data["tasks"]
    assert len(tasks) > 0
    for task in tasks:
        assert "docusign" in task["description"].lower()

def test_unified_endpoint_search_no_matches_returns_empty():
    response = client.get("/api/tasks?search=nonexistentkeywordxyz123")
    assert response.status_code == 200
    data = response.json()
    assert data["tasks"] == []
    assert data["total"] == 0

def test_unified_endpoint_combined_filters():
    response = client.get("/api/tasks?employee=Sarah&status=Completed")
    assert response.status_code == 200
    data = response.json()
    for task in data["tasks"]:
        assert "sarah" in task["employee"].lower()
        assert task["status"] == "Completed"

def test_unified_endpoint_partial_failure_crm_down():
    """
    Scenario B: CRM fails, Helpdesk succeeds.
    Must return 200 with Helpdesk tasks and warning.
    """
    with patch("backend.app.services.source_client.fetch_source_tasks") as mock_fetch:
        async def side_effect(client, base_url, path, source, timeout):
            if source == TaskSource.CRM:
                return ([], "unavailable", "CRM API timed out after 3.5 seconds.")
            # Let Helpdesk succeed with 1 mock task
            mock_hd = TaskSchema(
                id="HD-1",
                title="Helpdesk ticket",
                description="desc",
                employee="Alex",
                status=TaskStatus.PENDING,
                urgency=TaskUrgency.HIGH,
                source=TaskSource.HELPDESK,
                url="/mock/helpdesk/1"
            )
            return ([mock_hd], "success", None)

        mock_fetch.side_effect = side_effect

        response = client.get("/api/tasks")
        assert response.status_code == 200
        data = response.json()

        assert data["sources"]["crm"]["status"] == "unavailable"
        assert data["sources"]["helpdesk"]["status"] == "success"
        assert len(data["warnings"]) > 0
        assert any("CRM" in w for w in data["warnings"])
        assert len(data["tasks"]) == 1
        assert data["tasks"][0]["id"] == "HD-1"

def test_unified_endpoint_total_failure_both_down():
    """
    Scenario D: Both CRM and Helpdesk fail.
    Must return HTTP 502 Bad Gateway.
    """
    with patch("backend.app.services.source_client.fetch_source_tasks") as mock_fetch:
        async def side_effect(client, base_url, path, source, timeout):
            return ([], "unavailable", f"{source.value} connection refused")

        mock_fetch.side_effect = side_effect

        response = client.get("/api/tasks")
        assert response.status_code == 502
        assert "Both CRM and Helpdesk upstream source APIs failed to respond" in response.json()["detail"]

def test_simulation_crm_failure_flag():
    response = client.get("/api/tasks?simulate_crm_error=true")
    assert response.status_code == 200
    data = response.json()
    assert data["sources"]["crm"]["status"] in ["unavailable", "simulated_error"]
    assert data["sources"]["helpdesk"]["status"] == "success"
    assert len(data["warnings"]) > 0

def test_simulation_helpdesk_failure_flag():
    response = client.get("/api/tasks?simulate_helpdesk_error=true")
    assert response.status_code == 200
    data = response.json()
    assert data["sources"]["crm"]["status"] == "success"
    assert data["sources"]["helpdesk"]["status"] in ["unavailable", "simulated_error"]
    assert len(data["warnings"]) > 0

def test_simulation_both_failure_flags_returns_502():
    response = client.get("/api/tasks?simulate_crm_error=true&simulate_helpdesk_error=true")
    assert response.status_code == 502
    assert "Both CRM and Helpdesk upstream source APIs failed to respond" in response.json()["detail"]
