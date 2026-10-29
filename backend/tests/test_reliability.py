import pytest
import httpx
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.schemas.task import TaskSource
from backend.app.services.source_client import fetch_source_tasks

client = TestClient(app)

@pytest.mark.anyio
async def test_fetch_source_tasks_handles_malformed_json():
    """Verify that malformed/non-JSON content returns 'error' status without crashing."""
    async def mock_handler(request: httpx.Request):
        return httpx.Response(200, text="<html5>Server Error: Invalid JSON</html5>", headers={"content-type": "text/html"})

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        tasks, status_str, warn = await fetch_source_tasks(
            mock_client, "http://crm.mock", "/tasks", TaskSource.CRM, timeout=2.0
        )
        assert tasks == []
        assert status_str == "error"
        assert "malformed or non-JSON" in warn

@pytest.mark.anyio
async def test_fetch_source_tasks_handles_non_list_json():
    """Verify that JSON dictionary instead of array returns 'error' status."""
    async def mock_handler(request: httpx.Request):
        return httpx.Response(200, json={"error": "Not a list"})

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        tasks, status_str, warn = await fetch_source_tasks(
            mock_client, "http://helpdesk.mock", "/tasks", TaskSource.HELPDESK, timeout=2.0
        )
        assert tasks == []
        assert status_str == "error"
        assert "expected JSON array" in warn

@pytest.mark.anyio
async def test_fetch_source_tasks_recovers_valid_records_from_partially_corrupted_feed():
    """Verify that corrupt records are skipped while valid records in the same feed are retained."""
    partially_corrupted_feed = [
        # Valid CRM task
        {
            "id": "CRM-VALID-1",
            "title": "Quarterly Business Review with Global Logistics",
            "assigned_to": "Sarah Jenkins",
            "status": "In Progress",
            "urgency": "High",
            "due_date": "2026-10-31T17:00:00Z"
        },
        # Corrupted item 1: Not a dictionary
        "INVALID STRING ENTRY",
        # Corrupted item 2: Missing title
        {
            "id": "CRM-INVALID-2",
            "due_date": "invalid-datetime-format"
        },
        # Valid CRM task 2
        {
            "id": "CRM-VALID-2",
            "title": "Send Enterprise License renewal contract",
            "assigned_to": "Michael Chen",
            "status": "Pending Customer Response",
            "urgency": "Medium",
            "due_date": "2026-11-05T12:00:00Z"
        }
    ]

    async def mock_handler(request: httpx.Request):
        return httpx.Response(200, json=partially_corrupted_feed)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        tasks, status_str, warn = await fetch_source_tasks(
            mock_client, "http://crm.mock", "/tasks", TaskSource.CRM, timeout=2.0
        )
        assert len(tasks) == 2
        assert status_str == "success"
        assert warn is None
        assert tasks[0].id == "CRM-VALID-1"
        assert tasks[1].id == "CRM-VALID-2"

@pytest.mark.anyio
async def test_fetch_source_tasks_handles_http_500_upstream():
    """Verify that HTTP 500 response from upstream marks service as unavailable."""
    async def mock_handler(request: httpx.Request):
        return httpx.Response(500, text="Internal Server Error")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        tasks, status_str, warn = await fetch_source_tasks(
            mock_client, "http://crm.mock", "/tasks", TaskSource.CRM, timeout=2.0
        )
        assert tasks == []
        assert status_str == "unavailable"
        assert "500" in warn

@pytest.mark.anyio
async def test_fetch_source_tasks_handles_timeout():
    """Verify that network timeout returns 'unavailable' with clear warning message."""
    async def mock_handler(request: httpx.Request):
        raise httpx.TimeoutException("Mock socket read timeout after 2.0s")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        tasks, status_str, warn = await fetch_source_tasks(
            mock_client, "http://helpdesk.mock", "/tasks", TaskSource.HELPDESK, timeout=2.0
        )
        assert tasks == []
        assert status_str == "unavailable"
        assert "timed out" in warn
