# API Contracts Specification: Employee Task Dashboard

**Document Version**: 1.0.0  
**Base URL**: `http://localhost:3000` (or `http://localhost:8000`)  
**Content-Type**: `application/json` (UTF-8)  
**Status**: Step 1 - Approved Technical Blueprint  

---

## 1. Endpoints Overview

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/health` | System health and upstream dependency check | Public |
| `GET` | `/api/crm/tasks` | Mock CRM REST API returning raw sales & client tasks | Internal / Mock |
| `GET` | `/api/helpdesk/tasks` | Mock Helpdesk REST API returning raw ticket work items | Internal / Mock |
| `GET` | `/api/tasks` | Aggregated, normalized, prioritized task feed | Public Client |
| `GET` | `/api/mock/crm/tasks/{task_id}` | Interactive mock CRM detail record viewer | Web UI / Link |
| `GET` | `/api/mock/helpdesk/tasks/{task_id}` | Interactive mock Helpdesk ticket detail viewer | Web UI / Link |

---

## 2. Endpoint Specifications

### 2.1 GET `/health`
- **Purpose**: Liveness and readiness probe for container orchestrators and monitoring tools.
- **Query Parameters**: None.
- **Success Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-29T09:30:00Z",
  "version": "1.0.0",
  "services": {
    "crm_mock": "up",
    "helpdesk_mock": "up"
  }
}
```
- **Error Response (`503 Service Unavailable`)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2026-10-29T09:30:00Z",
  "error": "Critical internal services unreachable"
}
```

---

### 2.2 GET `/api/crm/tasks`
- **Purpose**: Simulates an enterprise CRM service (e.g., Salesforce/HubSpot) exposing account management, contract renewals, and lead followup activities.
- **Headers**:
  - `Accept: application/json`
  - `X-Simulate-Error: true` *(Optional: triggers simulated upstream failure for testing)*
- **Query Parameters**: None.
- **Success Response (`200 OK`)**:
```json
{
  "source": "CRM",
  "total_records": 3,
  "records": [
    {
      "crm_id": "CRM-101",
      "account_name": "Apex Global Solutions",
      "action_item": "Quarterly Enterprise Renewal Review",
      "notes": "Review enterprise license seats and present tier 2 pricing.",
      "assigned_rep": "Tushar Gupta",
      "state": "pending",
      "due_date": "2026-10-28T14:00:00Z",
      "deal_priority": "urgent",
      "crm_deep_link": "/api/mock/crm/tasks/CRM-101"
    },
    {
      "crm_id": "CRM-102",
      "account_name": "Initech Corp",
      "action_item": "Security Compliance Questionnaire Followup",
      "notes": "SOC2 Type II documentation request pending review.",
      "assigned_rep": "Sarah Jenkins",
      "state": "in_progress",
      "due_date": "2026-10-29T18:00:00Z",
      "deal_priority": "high",
      "crm_deep_link": "/api/mock/crm/tasks/CRM-102"
    },
    {
      "crm_id": "CRM-103",
      "account_name": "Cyberdyne Systems",
      "action_item": "Post-Sale Implementation Signoff",
      "notes": "Client acknowledged deployment completion.",
      "assigned_rep": "Tushar Gupta",
      "state": "completed",
      "due_date": "2026-10-25T11:00:00Z",
      "deal_priority": "medium",
      "crm_deep_link": "/api/mock/crm/tasks/CRM-103"
    }
  ]
}
```
- **Error Response (`500 Internal Server Error`)**:
```json
{
  "error": "CRM_SERVICE_UNAVAILABLE",
  "message": "CRM database connection pool exhausted"
}
```

---

### 2.3 GET `/api/helpdesk/tasks`
- **Purpose**: Simulates an IT/Support ticketing system (e.g., Zendesk/Jira Service Desk) exposing customer incidents, SLA tickets, and bugs.
- **Query Parameters**: None.
- **Success Response (`200 OK`)**:
```json
{
  "system": "Helpdesk",
  "ticket_count": 3,
  "tickets": [
    {
      "ticket_key": "HD-501",
      "subject": "Production Payment Gateway 502 Bad Gateway Spike",
      "description": "Checkout service experiencing 15% transaction drops on Stripe webhook.",
      "owner": "Alex Rivera",
      "ticket_status": "open",
      "sla_deadline": "2026-10-29T11:30:00Z",
      "severity": "P1",
      "portal_url": "/api/mock/helpdesk/tasks/HD-501"
    },
    {
      "ticket_key": "HD-502",
      "subject": "SSO Login Loop for European Azure AD Tenants",
      "description": "SAML token expiration offset causing loop for Frankfurt users.",
      "owner": "Tushar Gupta",
      "ticket_status": "in_progress",
      "sla_deadline": "2026-10-30T16:00:00Z",
      "severity": "P2",
      "portal_url": "/api/mock/helpdesk/tasks/HD-502"
    },
    {
      "ticket_key": "HD-503",
      "subject": "Update Internal VPN Certificates for Q4",
      "description": "Annual wildcard certificate renewal on Wireguard concentrators.",
      "owner": "Sarah Jenkins",
      "ticket_status": "resolved",
      "sla_deadline": "2026-10-27T08:00:00Z",
      "severity": "P3",
      "portal_url": "/api/mock/helpdesk/tasks/HD-503"
    }
  ]
}
```

---

### 2.4 GET `/api/tasks` (Unified Aggregator)
- **Purpose**: Fetches, normalizes, deduplicates, prioritizes, and filters tasks from both CRM and Helpdesk.
- **Query Parameters**:
  | Parameter | Type | Required | Default | Validation / Notes |
  |---|---|---|---|---|
  | `employee` | string | No | `""` | Case-insensitive substring match or exact match (e.g. `Tushar`) |
  | `status` | string | No | `""` | One of `Pending`, `In Progress`, `Completed`, or empty for all |
  | `search` | string | No | `""` | Case-insensitive search on title and description |

- **Success Response (`200 OK`) - Full Success**:
```json
{
  "data": [
    {
      "id": "CRM-101",
      "title": "Quarterly Enterprise Renewal Review (Apex Global Solutions)",
      "description": "Review enterprise license seats and present tier 2 pricing.",
      "employee": "Tushar Gupta",
      "status": "Pending",
      "deadline": "2026-10-28T14:00:00Z",
      "urgency": "Urgent",
      "source": "CRM",
      "url": "/api/mock/crm/tasks/CRM-101",
      "priority_tier": 1,
      "priority_score": 1004,
      "is_overdue": true
    },
    {
      "id": "HD-501",
      "title": "Production Payment Gateway 502 Bad Gateway Spike",
      "description": "Checkout service experiencing 15% transaction drops on Stripe webhook.",
      "employee": "Alex Rivera",
      "status": "Pending",
      "deadline": "2026-10-29T11:30:00Z",
      "urgency": "Urgent",
      "source": "Helpdesk",
      "url": "/api/mock/helpdesk/tasks/HD-501",
      "priority_tier": 2,
      "priority_score": 2004,
      "is_overdue": false
    },
    {
      "id": "CRM-102",
      "title": "Security Compliance Questionnaire Followup (Initech Corp)",
      "description": "SOC2 Type II documentation request pending review.",
      "employee": "Sarah Jenkins",
      "status": "In Progress",
      "deadline": "2026-10-29T18:00:00Z",
      "urgency": "High",
      "source": "CRM",
      "url": "/api/mock/crm/tasks/CRM-102",
      "priority_tier": 2,
      "priority_score": 2003,
      "is_overdue": false
    },
    {
      "id": "HD-502",
      "title": "SSO Login Loop for European Azure AD Tenants",
      "description": "SAML token expiration offset causing loop for Frankfurt users.",
      "employee": "Tushar Gupta",
      "status": "In Progress",
      "deadline": "2026-10-30T16:00:00Z",
      "urgency": "High",
      "source": "Helpdesk",
      "url": "/api/mock/helpdesk/tasks/HD-502",
      "priority_tier": 3,
      "priority_score": 3003,
      "is_overdue": false
    },
    {
      "id": "CRM-103",
      "title": "Post-Sale Implementation Signoff (Cyberdyne Systems)",
      "description": "Client acknowledged deployment completion.",
      "employee": "Tushar Gupta",
      "status": "Completed",
      "deadline": "2026-10-25T11:00:00Z",
      "urgency": "Medium",
      "source": "CRM",
      "url": "/api/mock/crm/tasks/CRM-103",
      "priority_tier": 5,
      "priority_score": 5002,
      "is_overdue": false
    }
  ],
  "meta": {
    "total_count": 5,
    "statistics": {
      "total": 5,
      "overdue": 1,
      "pending": 2,
      "in_progress": 2,
      "completed": 1
    },
    "warnings": [],
    "sources_queried": ["CRM", "Helpdesk"],
    "sources_succeeded": ["CRM", "Helpdesk"]
  }
}
```

- **Partial Success Response (`200 OK`) - CRM Down, Helpdesk Up**:
```json
{
  "data": [
    {
      "id": "HD-501",
      "title": "Production Payment Gateway 502 Bad Gateway Spike",
      "description": "Checkout service experiencing 15% transaction drops on Stripe webhook.",
      "employee": "Alex Rivera",
      "status": "Pending",
      "deadline": "2026-10-29T11:30:00Z",
      "urgency": "Urgent",
      "source": "Helpdesk",
      "url": "/api/mock/helpdesk/tasks/HD-501",
      "priority_tier": 2,
      "priority_score": 2004,
      "is_overdue": false
    }
  ],
  "meta": {
    "total_count": 1,
    "statistics": {
      "total": 1,
      "overdue": 0,
      "pending": 1,
      "in_progress": 0,
      "completed": 0
    },
    "warnings": [
      {
        "source": "CRM",
        "error_code": "UPSTREAM_TIMEOUT",
        "message": "CRM service timed out after 3500ms. Displaying Helpdesk records only."
      }
    ],
    "sources_queried": ["CRM", "Helpdesk"],
    "sources_succeeded": ["Helpdesk"]
  }
}
```

- **Total Failure Response (`502 Bad Gateway`) - Both CRM and Helpdesk Down**:
```json
{
  "status_code": 502,
  "error": "ALL_UPSTREAM_SOURCES_FAILED",
  "message": "Both CRM and Helpdesk mock services failed to respond.",
  "timestamp": "2026-10-29T09:30:00Z",
  "details": [
    {"source": "CRM", "reason": "Connection refused (503)"},
    {"source": "Helpdesk", "reason": "Request timed out after 3500ms"}
  ]
}
```

- **Validation Error Response (`422 Unprocessable Entity`)**:
```json
{
  "status_code": 422,
  "error": "INVALID_QUERY_PARAMETER",
  "message": "Invalid status parameter. Must be one of: 'Pending', 'In Progress', 'Completed'."
}
```

---

### 2.5 GET `/api/mock/crm/tasks/{task_id}` & `/api/mock/helpdesk/tasks/{task_id}`
- **Purpose**: Interactive HTML / JSON viewer allowing reviewers to inspect the simulated source application when clicking deep links.
- **Success (`200 OK`)**:
  - Content-Type: `text/html` (with structured clean interface showing source application headers, CRM metadata, raw JSON toggle, and breadcrumb back to the Dashboard).
- **Error (`404 Not Found`)**:
  - Friendly 404 page stating: *"CRM Record 'CRM-999' not found."*

---

## 3. Pydantic Models (Backend Validation)

```python
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field

class TaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class TaskUrgency(str, Enum):
    URGENT = "Urgent"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class TaskSource(str, Enum):
    CRM = "CRM"
    HELPDESK = "Helpdesk"

class CanonicalTask(BaseModel):
    id: str = Field(..., description="Unique composite task identifier (e.g., CRM-101)")
    title: str = Field(..., description="Normalized task title")
    description: str = Field(..., description="Task details or notes")
    employee: str = Field(..., description="Assigned employee name")
    status: TaskStatus = Field(..., description="Normalized status")
    deadline: Optional[str] = Field(None, description="ISO 8601 UTC timestamp or null")
    urgency: TaskUrgency = Field(..., description="Urgency level")
    source: TaskSource = Field(..., description="Source application")
    url: str = Field(..., description="Deep link URL to the source task")
    priority_tier: int = Field(..., ge=1, le=5, description="1: Overdue, 2: Due Today, 3: Due 48h, 4: Upcoming, 5: Completed")
    priority_score: int = Field(..., description="Sortable composite integer score")
    is_overdue: bool = Field(..., description="True if deadline has passed and task is incomplete")

class KPIStatistics(BaseModel):
    total: int
    overdue: int
    pending: int
    in_progress: int
    completed: int

class SourceWarning(BaseModel):
    source: str
    error_code: str
    message: str

class MetaResponse(BaseModel):
    total_count: int
    statistics: KPIStatistics
    warnings: List[SourceWarning] = []
    sources_queried: List[str]
    sources_succeeded: List[str]

class TaskCollectionResponse(BaseModel):
    data: List[CanonicalTask]
    meta: MetaResponse
```
