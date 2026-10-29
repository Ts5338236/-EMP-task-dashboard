# API Documentation & Endpoint Reference

> Comprehensive API documentation for the **Employee Task Dashboard** FastAPI backend service.

---

## Base URLs
- **Local Development**: `http://localhost:8001` (Direct) or `http://localhost:3000/api` (Vite Proxy)
- **Production (Render / Cloud Run)**: `https://<YOUR_BACKEND_DOMAIN>`

---

## 1. Health Probe Endpoint

### `GET /health`
Returns API liveness, version, and runtime environment.

#### Request
```http
GET /health HTTP/1.1
Host: localhost:8001
Accept: application/json
```

#### Response (200 OK)
```json
{
  "status": "ok",
  "app": "Employee Task Dashboard API",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 2. Unified Tasks Endpoint

### `GET /api/tasks`
Fetches tasks concurrently from CRM and Helpdesk mock feeds, normalizes field names, deduplicates records, applies filters, and sorts them deterministically using the 5-tier prioritization engine.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `employee` | string | No | Case-insensitive filter matching assignee name | `employee=Alex Rivera` |
| `status` | string | No | Canonical task status (`Pending`, `In Progress`, `Completed`) | `status=In Progress` |
| `search` | string | No | Substring search across title, ID, employee, description, and source | `search=contract` |
| `simulate_crm_error` | boolean | No | Simulates CRM upstream network failure for testing | `simulate_crm_error=true` |
| `simulate_helpdesk_error` | boolean | No | Simulates Helpdesk upstream failure for testing | `simulate_helpdesk_error=true` |

#### Request
```http
GET /api/tasks?employee=Alex%20Rivera&status=In%20Progress HTTP/1.1
Host: localhost:8001
Accept: application/json
```

#### Response (200 OK)
```json
{
  "tasks": [
    {
      "id": "102",
      "title": "Investigate payment gateway webhook failures",
      "description": "Customer reported intermittent 502 errors on Stripe webhooks",
      "employee": "Alex Rivera",
      "status": "In Progress",
      "deadline": "2026-10-29T18:00:00Z",
      "urgency": "High",
      "source": "Helpdesk",
      "url": "/mock/helpdesk/102",
      "priority_category": "Due Today",
      "priority_rank": 1,
      "is_overdue": false,
      "hours_until_deadline": 4.5
    }
  ],
  "sources": {
    "crm": {
      "status": "success",
      "task_count": 12
    },
    "helpdesk": {
      "status": "success",
      "task_count": 12
    }
  },
  "warnings": [],
  "total": 1
}
```

#### Error Response: Invalid Status (422 Unprocessable Content)
```json
{
  "detail": "Invalid status 'Blocked'. Supported statuses are: 'Pending', 'In Progress', 'Completed'"
}
```

#### Error Response: Both Upstreams Unavailable (502 Bad Gateway)
```json
{
  "detail": "Both CRM and Helpdesk upstream source APIs failed to respond. Service temporarily unavailable."
}
```

---

## 3. CRM Mock Feed Endpoint

### `GET /api/crm/tasks`
Returns 12 deterministic mock CRM task records.

#### Response (200 OK)
```json
[
  {
    "id": "101",
    "title": "Follow up with customer on contract renewal",
    "assigned_to": "Tushar Gupta",
    "status": "Pending",
    "urgency": "Urgent",
    "due_date": "2026-10-28T14:00:00Z"
  }
]
```

### `GET /mock/crm/{id}`
Interactive HTML detail viewer and JSON data viewer for CRM records.

---

## 4. Helpdesk Mock Feed Endpoint

### `GET /api/helpdesk/tasks`
Returns 12 deterministic mock Helpdesk ticket records.

#### Response (200 OK)
```json
[
  {
    "ticket_id": "101",
    "issue_summary": "Password reset link failing for remote user",
    "owner": "Sarah Jenkins",
    "state": "Open",
    "priority_level": "Medium",
    "sla_deadline": "2026-10-30T16:00:00Z"
  }
]
```

### `GET /mock/helpdesk/{id}`
Interactive HTML detail viewer and JSON data viewer for Helpdesk tickets.
