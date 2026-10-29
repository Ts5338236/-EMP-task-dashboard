# Employee Task Dashboard (WorkFlow)

> Unified, real-time employee task prioritization dashboard consolidating work items from CRM and Helpdesk mock REST APIs with intelligent deadline-based urgency ranking, high-availability fault tolerance, and interactive filtering.

---

## Project Status: Step 8 Complete (Error Handling, Reliability & Edge Cases)

The full-stack application foundation, dual mock REST services, async backend aggregator, 5-tier prioritization engine, interactive React dashboard, and comprehensive error handling/reliability suite are verified and operational.

---

## Architecture & Reliability Highlights (Step 8)

1. **Record-Level Fault Tolerance**:
   - The backend aggregator (`source_client.py`) parses JSON feeds at the individual task record level. If an isolated task record has a schema failure or invalid datatypes, it is safely logged and skipped, while all valid task records in the upstream feed are successfully recovered.
2. **Robust HTTP & JSON Error Boundaries**:
   - Detects and handles `json.JSONDecodeError` and unexpected data types (e.g. JSON objects or non-arrays) returning structured status `"error"` with detailed error warnings without crashing.
   - Structured Python logging (`logging.getLogger("workflow.aggregator")`) tracks upstream latency, network timeouts, and data degradation.
3. **Non-Destructive Background Refresh**:
   - In `useTasks.ts`, when a user triggers manual or background refresh and the network fails, previously loaded task items and summary KPIs are **preserved intact**.
   - Displays a non-intrusive `Refresh Notice:` notification banner with error details, preventing user workflow disruptions or blank screens.
4. **Summary KPI Skeleton States**:
   - `SummaryCards.tsx` includes animated pulse skeleton placeholders during loading phases, preventing misleading initial "0" counter flashes.
5. **Interactive Filter & Search Suite**:
   - **Employee Filter**: Case-insensitive filtering dynamically populated from loaded task data (*All Employees* + unique assignees like Tushar Gupta, Sarah Jenkins, Alex Rivera, Michael Chen, Emily Watson).
   - **Status Filter**: Canonical status constraints (*Pending*, *In Progress*, *Completed*, and *All Statuses*).
   - **Comprehensive Search**: 300ms debounced search matching across **Task Title**, **Task ID** (e.g. `101`), **Employee Name**, **Description**, and **Source System** (`CRM` or `Helpdesk`).
   - **Individual Filter Dismissal**: Active filter chips display each active constraint with an individual `(x)` button allowing users to clear one filter (e.g., reset employee) while keeping other selections (status/search) active.
   - **Clear All Filters**: One-click action resetting employee, status, and search to baseline.
6. **URL & Browser State Synchronization**:
   - Filter and search parameters are automatically synchronized to browser URL search parameters (`?employee=...&status=...&search=...`) using `window.history.replaceState`.
   - Reloading or bookmarking a filtered dashboard URL restores the exact filter view.
7. **5-Tier Task Prioritization Engine**:
   - Automatically and deterministically ranks tasks:
     - **Tier 0 (Overdue)**: Incomplete tasks with past deadlines (`deadline < now`).
     - **Tier 1 (Due Today)**: Incomplete tasks due on the current business date.
     - **Tier 2 (Due Soon)**: Incomplete tasks due within the next 48 hours.
     - **Tier 3 (Upcoming)**: Incomplete tasks due beyond 48 hours, or without deadlines.
     - **Tier 4 (Completed)**: Completed tasks (always placed last; never classified as overdue).
   - Sub-sorts by **Urgency** (`Urgent` > `High` > `Medium` > `Low`), then **Earliest Deadline**, with a deterministic `(source, id)` tie-breaker.
8. **Summary KPI Cards**:
   - Dynamically calculated metric cards for *Total Tasks*, *Overdue Tasks*, *In Progress*, and *Completed*.
   - Completed tasks are strictly excluded from overdue counts even when deadlines are in the past.
9. **Safe Deep-Link Source Navigation**:
   - Task links point to valid simulated `/mock/{source}/{id}` routes.
   - Opens in a new browser tab with `target="_blank"` and `rel="noopener noreferrer"`.
10. **Upstream Fault Simulation**:
    - Simulated testing flags supported on `GET /api/tasks`:
      - `?simulate_crm_error=true`: Simulates CRM upstream timeout / failure.
      - `?simulate_helpdesk_error=true`: Simulates Helpdesk upstream failure.
      - Both flags set simultaneously triggers HTTP 502 Bad Gateway with standard JSON error payload.

---

## Local Setup & Quickstart

### 1. Backend Setup (FastAPI)

```bash
# 1. Activate virtual environment
source backend/venv/bin/activate
# or: backend/venv/bin/python

# 2. Start Uvicorn server on port 8001
uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend Setup (React + Vite)

```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server on port 3000
npm run dev
```

---

## API Endpoints Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check probe returning API liveness and version |
| `/api/crm/tasks` | `GET` | 12 mock CRM records (deals, renewals, customer follow-ups) |
| `/api/helpdesk/tasks` | `GET` | 12 mock Helpdesk tickets (outages, SLA tickets, bug reports) |
| `/api/tasks` | `GET` | Unified, filtered, and prioritized task feed (`?employee=`, `?status=`, `?search=`, `?simulate_crm_error=`, `?simulate_helpdesk_error=`) |
| `/mock/crm/{id}` | `GET` | Interactive mock CRM detail record viewer |
| `/mock/helpdesk/{id}` | `GET` | Interactive mock Helpdesk ticket detail viewer |

---

## Automated Test Suites (63 Tests Total — 100% Pass Rate)

### Backend Pytest Suite (44 Tests Passed)
```bash
backend/venv/bin/pytest -v
```
- Full 5-tier prioritization hierarchy & tie-breaking rules
- Timezone awareness, boundary edge cases, and 1,000 tasks performance benchmark
- CRM & Helpdesk schema validation and independent detail endpoints
- Unified endpoint filtering by employee, status, and comprehensive search
- Search by task ID, description, and source system
- Upstream fault simulation flags (`simulate_crm_error`, `simulate_helpdesk_error`) and 502 total outage handling
- **Step 8 Reliability Tests**:
  - Malformed/non-JSON upstream response handling without crashing
  - Non-array JSON payload validation returning error status
  - Record-level fault tolerance recovering valid items from partially corrupted streams
  - HTTP 500 upstream status code handling
  - Upstream request timeout resilience

### Frontend Vitest Suite (19 Tests Passed)
```bash
npm test
```
- WorkFlow branding and dashboard layout rendering
- Summary card metric calculation accuracy & skeleton state verification
- Prioritized task table rendering, badge validation, and deep-link attributes
- Missing deadline fallback ("No deadline")
- Interactive employee dropdown filtering
- Interactive status dropdown filtering
- Debounced search query execution
- Clearing individual filter chips (employee, status, search) without resetting unrelated filters
- One-click *Clear Filters* action
- Manual refresh action with duplicate-click protection
- URL query parameter synchronization (`window.location.search`)
- Partial source failure warning banner verification
- Error state and interactive *Retry Request* button
- Empty search state with reset action
- Responsive mobile sidebar drawer toggle and close actions
- **Step 8 Reliability Tests**:
  - Retention of existing tasks and display of non-destructive *Refresh Notice* banner upon background sync error
  - Partial failure alert banner rendering with upstream warning details

### Static Type-Checking & Production Build
```bash
# TypeScript compiler type check
npm run lint  # tsc --noEmit (0 errors)

# Production build bundle
npm run build # vite build (successful in ~450ms)
```
