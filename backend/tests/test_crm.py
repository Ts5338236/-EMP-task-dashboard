from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_crm_tasks_returns_200():
    response = client.get("/api/crm/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert isinstance(tasks, list)
    assert len(tasks) >= 10

def test_crm_tasks_schema_and_fields():
    response = client.get("/api/crm/tasks")
    assert response.status_code == 200
    tasks = response.json()
    
    seen_ids = set()
    employees = set()
    statuses = set()
    urgencies = set()

    for task in tasks:
        # Field presence
        assert "id" in task
        assert "title" in task
        assert "description" in task
        assert "employee" in task
        assert "status" in task
        assert "deadline" in task
        assert "urgency" in task
        assert "source" in task
        assert "url" in task

        # Source must be CRM
        assert task["source"] == "CRM"

        # Unique IDs within CRM
        assert task["id"] not in seen_ids
        seen_ids.add(task["id"])

        # Allowed values
        assert task["status"] in ["Pending", "In Progress", "Completed"]
        assert task["urgency"] in ["Urgent", "High", "Medium", "Low"]

        employees.add(task["employee"])
        statuses.add(task["status"])
        urgencies.add(task["urgency"])

    # Variety checks
    assert len(employees) >= 2
    assert "Pending" in statuses
    assert "In Progress" in statuses
    assert "Completed" in statuses
    assert "Urgent" in urgencies
    assert "High" in urgencies

def test_crm_task_detail_success():
    response = client.get("/api/crm/tasks/101")
    assert response.status_code == 200
    task = response.json()
    assert task["id"] == "101"
    assert task["source"] == "CRM"
    assert "Apex Global" in task["title"]

def test_crm_task_detail_not_found():
    response = client.get("/api/crm/tasks/nonexistent-999")
    assert response.status_code == 404
    error = response.json()
    assert "not found" in error["detail"].lower()

def test_crm_mock_viewer_html_and_json():
    # Test HTML view (browser default)
    html_res = client.get("/mock/crm/101")
    assert html_res.status_code == 200
    assert "text/html" in html_res.headers["content-type"]
    assert "Enterprise CRM" in html_res.text

    # Test JSON format
    json_res = client.get("/mock/crm/101?format=json")
    assert json_res.status_code == 200
    assert json_res.json()["id"] == "101"

def test_crm_mock_viewer_not_found():
    res = client.get("/mock/crm/unknown-id")
    assert res.status_code == 404
