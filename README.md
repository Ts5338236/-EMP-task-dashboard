# Employee Task Dashboard (WorkFlow)

> Unified, real-time employee task prioritization dashboard consolidating work items from CRM and Helpdesk REST APIs with intelligent deadline-based urgency ranking, high-availability fault tolerance, and responsive filtering.

---

## 1. Project Title and Overview

**WorkFlow: Employee Task Dashboard** is a full-stack web application that unifies disparate operational feeds into an actionable command center. Developed with a high-performance **FastAPI (Python 3.10+)** backend and a modern **React 19 / Tailwind CSS v4** frontend, the system aggregates tasks from independent CRM and Helpdesk systems, deduplicates records, normalizes divergent data formats, and applies a deterministic 5-tier deadline and urgency ranking algorithm.

---

## 2. Problem Statement

Modern enterprise workers frequently divide their attention between disconnected tools:
- **CRM Systems**: Tracking sales renewals, contract negotiations, customer onboarding, and executive reviews.
- **Helpdesk Platforms**: Managing IT incidents, bug reports, infrastructure alerts, and customer support tickets.

Operating across separate tools causes critical tasks to slip through the cracks, makes cross-system prioritization challenging, and obscures overdue deadlines. **WorkFlow** eliminates this fragmentation by aggregating, normalizing, and ranking all tasks in one responsive, real-time interface.

---

## 3. Key Features

1. **Dual Source Ingestion**: Concurrently queries independent CRM and Helpdesk REST endpoints via asynchronous HTTPX.
2. **Deterministic 5-Tier Prioritization**:
   - Classifies tasks into Overdue, Due Today, Due Soon, Upcoming, and Completed tiers.
   - Secondary sorting by urgency (`Urgent` > `High` > `Medium` > `Low`).
   - Tertiary sorting by earliest deadline.
   - Deterministic tie-breaking using composite `(source, id)`.
3. **Summary KPI Metrics**: Instant cards for *Total Tasks*, *Overdue Tasks*, *In Progress*, and *Completed* with loading skeleton states. Completed tasks are never counted as overdue.
4. **Interactive Multi-Dimension Filtering**:
   - Dynamically generated employee dropdown populated from live task data.
   - Canonical status filter (*Pending*, *In Progress*, *Completed*).
   - 300 ms debounced search matching title, ID, employee, description, and source.
   - Individual filter chip dismissal (`[Filter (x)]`) and one-click *Clear All Filters*.
5. **URL & Browser State Synchronization**: Two-way synchronization via `window.history.replaceState` preserves filter state across page reloads and bookmarks.
6. **High-Availability Fault Tolerance**:
   - Partial upstream failure returns available records accompanied by an informative degradation banner.
   - Total outage returns HTTP 502 with an interactive retry state.
   - Record-level recovery isolates and skips corrupted records.
   - Background refresh errors preserve previously loaded tasks without wiping the screen.
7. **Safe Deep Links**: Direct links to simulated detail views with `target="_blank"` and `rel="noopener noreferrer"`.
8. **Responsive Layout**: Tailored viewports for desktop (data table with badge columns), tablet, and mobile (collapsible drawer navigation and touch-friendly cards).

---

## 4. Technology Stack

### Backend
- **Language**: Python 3.10+
- **Framework**: FastAPI 0.115+
- **Server**: Uvicorn (ASGI)
- **Data Validation & Schemas**: Pydantic v2
- **HTTP Client**: HTTPX (Asynchronous)
- **Testing**: Pytest, AnyIO, Pytest-Cov

### Frontend
- **Framework**: React 19 SPA
- **Build Tool**: Vite 8
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library, v8 Coverage

---

## 5. Architecture Overview

```
 ┌──────────────────────┐         ┌─────────────────────────┐
 │   CRM REST API       │         │   Helpdesk REST API     │
 │   /api/crm/tasks     │         │   /api/helpdesk/tasks   │
 └──────────┬───────────┘         └────────────┬────────────┘
            │                                  │
            └───────────────┬──────────────────┘
                            │ Asynchronous HTTPX Concurrent Fetch
                            ▼
              ┌───────────────────────────┐
              │ Aggregator & Normalizer   │
              │  - Schema Mapping         │
              │  - Composite Key Dedup    │
              │  - Partial Failure Catch  │
              └─────────────┬─────────────┘
                            ▼
              ┌───────────────────────────┐
              │ Task Prioritization Engine│
              │  - 5-Tier Classification  │
              │  - Urgency & Deadline Sort│
              │  - Deterministic Tie-Break│
              └─────────────┬─────────────┘
                            ▼
              ┌───────────────────────────┐
              │ Unified /api/tasks JSON   │
              └─────────────┬─────────────┘
                            ▼
              ┌───────────────────────────┐
              │ React Enterprise Frontend │
              │  (Vite Reverse Proxy)     │
              └───────────────────────────┘
```

---

## 6. Project Directory Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── crm.py               # CRM mock endpoints
│   │   │   ├── helpdesk.py          # Helpdesk mock endpoints
│   │   │   ├── mock_detail.py       # Simulated detail viewers
│   │   │   └── tasks.py             # Unified /api/tasks endpoint
│   │   ├── core/
│   │   │   └── config.py            # Environment settings & CORS
│   │   ├── mock_data/
│   │   │   ├── crm_data.py          # 12 deterministic CRM records
│   │   │   └── helpdesk_data.py     # 12 deterministic Helpdesk records
│   │   ├── schemas/
│   │   │   └── task.py              # Pydantic schemas & enums
│   │   ├── services/
│   │   │   ├── source_client.py     # Async HTTPX client & error handling
│   │   │   ├── task_filtering.py    # Employee, status, & search filters
│   │   │   ├── task_normalizer.py   # Schema normalization & deduplication
│   │   │   └── task_prioritization.py # 5-tier ranking algorithm
│   │   └── main.py                  # FastAPI application entry point
│   ├── tests/
│   │   ├── test_crm.py              # CRM endpoint unit tests
│   │   ├── test_health.py           # Health check & CORS tests
│   │   ├── test_helpdesk.py         # Helpdesk endpoint unit tests
│   │   ├── test_reliability.py      # Malformed JSON & recovery tests
│   │   ├── test_task_prioritization.py # Priority & tie-breaking tests
│   │   └── test_tasks_unified.py    # Unified API integration tests
│   ├── requirements.txt             # Python dependencies
│   └── venv/                        # Python virtual environment
├── docs/
│   ├── api-contracts.md             # Canonical API schemas
│   ├── api-documentation.md         # Detailed endpoint reference
│   ├── architecture.md              # System architecture blueprint
│   ├── data-model.md                # Data normalization models
│   ├── deployment-guide.md          # Cloud deployment walkthrough
│   ├── final-project-report.md      # Comprehensive engineering report
│   ├── github-submission-checklist.md # Pre-submission checklist
│   ├── implementation-roadmap.md    # Multi-phase engineering roadmap
│   ├── prioritization.md            # Prioritization rules & examples
│   ├── qa-report.md                 # Full RTM & test verification report
│   ├── requirements.md              # Initial requirements specification
│   └── testing-strategy.md          # Testing methodologies
├── src/
│   ├── components/
│   │   ├── AlertBanner.tsx          # Partial failure warning banner
│   │   ├── Badges.tsx               # Status, Urgency, Priority, Source badges
│   │   ├── DashboardHeader.tsx      # Header, refresh action, timestamps
│   │   ├── EmptyState.tsx           # Zero-results state with reset action
│   │   ├── ErrorState.tsx           # Full error state with retry action
│   │   ├── LoadingState.tsx         # Skeleton loading view
│   │   ├── Sidebar.tsx              # Workspace navigation drawer
│   │   ├── SummaryCards.tsx         # KPI cards with loading skeletons
│   │   ├── TaskRow.tsx              # Desktop table row & mobile card
│   │   ├── TaskTable.tsx            # Prioritized responsive task table
│   │   └── TaskToolbar.tsx          # Filter dropdowns, search, chips
│   ├── hooks/
│   │   └── useTasks.ts              # Custom hook with abortable fetch & sync
│   ├── services/
│   │   └── taskApi.ts               # Client-side API fetch client
│   ├── types/
│   │   └── task.ts                  # TypeScript interfaces and types
│   ├── utils/
│   │   └── taskDisplay.ts           # Date formatting & badge color helpers
│   ├── App.test.tsx                 # 19 frontend specification tests
│   ├── App.tsx                      # Primary dashboard layout
│   ├── e2e.test.tsx                 # 12-step End-to-End user journey test
│   ├── index.css                    # Tailwind CSS v4 import
│   └── main.tsx                     # React application entry point
├── .env.example                     # Frontend environment template
├── backend/.env.example             # Backend environment template
├── package.json                     # Node.js project manifest & scripts
├── render.yaml                      # Render Blueprint deployment manifest
├── vercel.json                      # Vercel SPA routing configuration
├── vite.config.ts                   # Vite configuration & backend proxy
└── README.md                        # Primary project documentation
```

---

## 7. Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 20.x or higher
- **npm**: 10.x or higher

---

## 8. Local Installation Instructions

Clone the repository to your local workstation:

```bash
git clone https://github.com/your-username/employee-task-dashboard.git
cd employee-task-dashboard
```

---

## 9. Backend Setup and Startup Commands

```bash
# 1. Create a Python virtual environment
python3 -m venv backend/venv

# 2. Activate the virtual environment
source backend/venv/bin/activate
# On Windows: backend\venv\Scripts\activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Copy backend environment template
cp backend/.env.example backend/.env

# 5. Start the FastAPI backend server on port 8001
uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload
```

*Note: Port 8001 is configured to avoid conflicts with container control-plane services.*

Verify backend liveness:
```bash
curl http://localhost:8001/health
# Returns: {"status":"ok","app":"Employee Task Dashboard API","version":"1.0.0"}
```

---

## 10. Frontend Setup and Startup Commands

In a separate terminal window:

```bash
# 1. Install Node.js dependencies
npm install

# 2. Copy frontend environment template
cp .env.example .env

# 3. Start the Vite development server
npm run dev
```

The frontend dashboard will be available at `http://localhost:3000`.

---

## 11. Mock CRM and Helpdesk API Configuration

Both mock APIs are integrated into the FastAPI backend instance:
- **CRM Endpoint**: `http://localhost:8001/api/crm/tasks`
- **Helpdesk Endpoint**: `http://localhost:8001/api/helpdesk/tasks`

Their base URLs are configurable via environment variables in `backend/.env`:
```ini
CRM_API_BASE_URL=http://127.0.0.1:8001
HELPDESK_API_BASE_URL=http://127.0.0.1:8001
REQUEST_TIMEOUT_SECONDS=3.5
```

---

## 12. Environment Variable Reference

### Backend (`backend/.env`)
| Variable | Default | Purpose |
|---|---|---|
| `ENVIRONMENT` | `development` | Runtime mode (`development` or `production`) |
| `HOST` | `0.0.0.0` | Network interface binding |
| `PORT` | `8001` | Server port binding (respects cloud platform `$PORT`) |
| `FRONTEND_ORIGIN` | `http://localhost:3000,http://localhost:5173` | Permitted CORS origins (comma-separated) |
| `CRM_API_BASE_URL` | `http://127.0.0.1:8001` | Upstream CRM API base URL |
| `HELPDESK_API_BASE_URL` | `http://127.0.0.1:8001` | Upstream Helpdesk API base URL |
| `REQUEST_TIMEOUT_SECONDS` | `3.5` | Outbound request timeout in seconds |
| `BUSINESS_TIMEZONE` | `UTC` | Canonical timezone for deadline calculations |

### Frontend (`.env`)
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8001` | Target FastAPI backend URL |

---

## 13. API Endpoints Reference

### `GET /health`
Returns system liveness and version.

### `GET /api/tasks`
Returns unified, normalized, and prioritized tasks.

**Supported Query Parameters:**
- `employee`: Filter by assignee (e.g. `employee=Alex Rivera`).
- `status`: Filter by status (`Pending`, `In Progress`, `Completed`).
- `search`: Substring search across title, ID, employee, description, and source.
- `simulate_crm_error`: Simulates CRM upstream failure (`true`/`false`).
- `simulate_helpdesk_error`: Simulates Helpdesk upstream failure (`true`/`false`).

**Example Response (200 OK):**
```json
{
  "tasks": [
    {
      "id": "110",
      "title": "Resolve certificate expiry on api gateway",
      "description": "Production ingress SSL certificate renewal",
      "employee": "Alex Rivera",
      "status": "In Progress",
      "deadline": "2026-10-28T11:00:00Z",
      "urgency": "Urgent",
      "source": "Helpdesk",
      "url": "/mock/helpdesk/110",
      "priority_category": "Overdue",
      "priority_rank": 0,
      "is_overdue": true,
      "hours_until_deadline": -23.5
    }
  ],
  "sources": {
    "crm": { "status": "success", "task_count": 12 },
    "helpdesk": { "status": "success", "task_count": 12 }
  },
  "warnings": [],
  "total": 24
}
```

---

## 14. Task Normalization & Prioritization Logic

### Normalization Matrix
| Canonical Field | CRM Source Field | Helpdesk Source Field |
|---|---|---|
| `id` | `id` | `ticket_id` |
| `title` | `title` | `issue_summary` |
| `employee` | `assigned_to` | `owner` |
| `status` | Normalized from status string | Normalized from state string |
| `urgency` | Normalized from urgency string | Normalized from priority string |
| `deadline` | `due_date` (UTC ISO string) | `sla_deadline` (UTC ISO string) |
| `source` | `'CRM'` | `'Helpdesk'` |
| `url` | `/mock/crm/{id}` | `/mock/helpdesk/{id}` |

### 5-Tier Classification Hierarchy
1. **Tier 0: Overdue (`rank: 0`)**: `status != Completed` and `deadline < now`.
2. **Tier 1: Due Today (`rank: 1`)**: `status != Completed` and `deadline.date() == now.date()`.
3. **Tier 2: Due Soon (`rank: 2`)**: `status != Completed` and `now < deadline <= now + 48h`.
4. **Tier 3: Upcoming (`rank: 3`)**: `status != Completed` and deadline > 48h (or no deadline).
5. **Tier 4: Completed (`rank: 4`)**: `status == Completed` (never marked overdue).

**Tie-Breaking Rule**: Urgency (`Urgent` > `High` > `Medium` > `Low`) $\rightarrow$ Earliest Deadline $\rightarrow$ Composite `(source, id)`.

---

## 15. Employee, Status, and Search Filtering

- **Employee Filter**: Case-insensitive exact match. Populated dynamically with unique assignees.
- **Status Filter**: Validates against canonical statuses; returns HTTP 422 if invalid.
- **Debounced Search**: 300 ms debounce avoids spamming the backend while typing.
- **Single-Filter Dismissal**: Users can remove one active filter chip without clearing others.
- **Clear All Filters**: One-click reset returning all inputs to default.

---

## 16. Error Handling & Partial-Source Failure Behavior

- **CRM Offline**: Returns remaining Helpdesk tasks and displays an amber alert banner: *Partial Source System Degradation*.
- **Helpdesk Offline**: Returns remaining CRM tasks and displays an amber alert banner.
- **Both Sources Offline**: Returns HTTP 502 Bad Gateway and renders a clear error card with a *Retry Request* button.
- **Record Corruption**: Skips corrupted JSON records and recovers valid items.
- **Refresh Failure**: Preserves loaded tasks and displays a non-destructive *Refresh Notice* banner.

---

## 17. Testing Commands and Actual Results

### Automated Suite Summary: 64 Tests (100% Pass Rate)

#### Backend Pytest Suite (44 Tests Passed)
```bash
backend/venv/bin/pytest -v --cov=backend/app
```
- **Coverage**: **93.0% statement coverage** across `backend/app`.
- **Modules**: Prioritization (91%), Normalization (87%), Filtering (100%), Source Client (83%), APIs (100%).

#### Frontend Vitest Suite (20 Tests Passed)
```bash
npm test -- --run --coverage
```
- **Coverage**: **93.7% statement coverage** across all components, hooks, and services.
- **E2E User Journey**: 12-step complete workflow verified in `src/e2e.test.tsx`.

#### Static Analysis & Compilation
```bash
npm run lint  # tsc --noEmit -> 0 errors
npm run build # vite build -> 469ms clean build
```

---

## 18. Production Deployment Instructions

### Deploying on Render (Blueprint)
1. Fork or push repository to GitHub.
2. In Render, select **New +** > **Blueprint**.
3. Connect repository. Render reads `render.yaml` and provisions both services.
4. Click **Apply**.

### Deploying Frontend on Vercel
1. Import repository into Vercel.
2. Set Framework Preset to **Vite**.
3. Set environment variable `VITE_API_BASE_URL` to your production backend URL.
4. Deploy.

*Refer to [`docs/deployment-guide.md`](docs/deployment-guide.md) for full instructions.*

---

## 19. UI Layout & Viewports

- **Desktop (1440 × 900)**: Full sidebar navigation, 4-column KPI cards, multi-column task table with urgency badges, formatted deadlines, source badges, and verified deep links.
- **Tablet (768 × 1024)**: Responsive header with compact action buttons, 2x2 summary card grid, horizontally scrollable data table.
- **Mobile (390 × 844)**: Collapsible navigation drawer with hamburger button, stacked summary cards, responsive touch-friendly task cards.

---

## 20. Known Limitations

- **Mock Feeds**: Tasks are simulated from deterministic in-memory datasets rather than connecting to live external SaaS APIs with OAuth credentials.
- **Single Organization**: Designed for single-tenant enterprise dashboard environments.

---

## 21. Future Improvements

1. **OAuth 2.0 Integration**: Connect real Salesforce, Jira, and Zendesk instances.
2. **Task Mutation**: Enable direct inline status updates (`In Progress` $\rightarrow$ `Completed`) with optimistic UI updates.
3. **WebSockets / Server-Sent Events**: Push real-time upstream ticket assignment notifications.
4. **Custom Urgency Rules**: Allow managers to configure custom deadline SLA thresholds per client.
