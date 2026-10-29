# Testing Strategy & Quality Assurance Architecture

**Project**: Employee Task Dashboard  
**Status**: Step 1 - Approved Technical Blueprint  

---

## 1. Testing Philosophy & Test Pyramid

Quality assurance for the Employee Task Dashboard focuses on **deterministic business logic verification**, **resilience to network and upstream failures**, and **accessible, predictable UI states**.

```
           / \
          /   \     E2E / Integration Tests (Playwright / Pytest TestClient)
         /-----\    - End-to-end API pipeline with mock network injection
        /       \   - Partial and full upstream failure recovery
       /---------\  Component & Hook Unit Tests (Vitest + RTL)
      /           \ - Filter toolbar combinations, KPI cards, deep links
     /-------------\ Backend Unit & Algorithm Tests (Pytest)
    /               \ - Prioritization ordering with frozen clock
   /                 \ - Schema normalization & invalid payload handling
  ---------------------
```

---

## 2. Backend Test Suites (FastAPI / Pytest)

### Suite B1: Mock Endpoints & Health Check
- **TC-B01**: `GET /health` returns HTTP 200 with JSON payload containing status "healthy".
- **TC-B02**: `GET /api/crm/tasks` returns HTTP 200 with CRM task collection and valid schema.
- **TC-B03**: `GET /api/helpdesk/tasks` returns HTTP 200 with Helpdesk ticket collection and valid schema.

### Suite B2: Schema Normalization & Adapter Pipeline
- **TC-B04**: Raw CRM fields (`crm_id`, `assigned_rep`, `deal_priority`, `due_date`) correctly map to canonical fields (`id`, `employee`, `urgency`, `deadline`).
- **TC-B05**: Raw Helpdesk fields (`ticket_key`, `owner`, `severity`, `sla_deadline`) correctly map to canonical fields (`id`, `employee`, `urgency`, `deadline`).
- **TC-B06**: Non-prefixed IDs automatically receive system prefixes (`CRM-` and `HD-`), avoiding ID collisions.
- **TC-B07**: Malformed dates or null dates default cleanly to `deadline: null` without raising unhandled exceptions.

### Suite B3: Prioritization Engine (Clock-Injected)
- **TC-B08 (Tier 1 vs Tier 2)**: Overdue incomplete task (`2026-10-28`) is ranked before task due today (`2026-10-29 18:00`).
- **TC-B09 (Tier 2 vs Tier 3)**: Task due today is ranked before task due tomorrow (`2026-10-30 12:00`).
- **TC-B10 (Tier 3 vs Tier 4)**: Task due in 24 hours is ranked before task due in 5 days or with `deadline: null`.
- **TC-B11 (Completed Sinking)**: Completed task with past deadline (`2026-10-20`) is placed in Tier 5, never in Tier 1.
- **TC-B12 (Urgency Sub-sort)**: Within Tier 2, an `Urgent` task appears before a `High` task, which appears before a `Medium` task.
- **TC-B13 (Tie-breaker)**: When Tier and Urgency are identical, the task with the earlier deadline appears first.
- **TC-B14 (Exact Match Edge Case)**: Task due exactly at evaluation timestamp (`now`) is classified as Tier 2 (Due Today).

### Suite B4: Filtering & Search
- **TC-B15**: `GET /api/tasks?employee=Tushar` returns only tasks assigned to Tushar Gupta (case-insensitive).
- **TC-B16**: `GET /api/tasks?status=Pending` returns only tasks with `status == "Pending"`.
- **TC-B17**: Multi-filter `?employee=Tushar&status=Pending` returns intersection of both conditions.
- **TC-B18**: Keyword search `?search=security` matches tasks where title or description contains "security".
- **TC-B19**: Invalid status parameter (e.g., `?status=InvalidState`) returns HTTP 422 with informative validation error.

### Suite B5: Upstream Failure & Resilience
- **TC-B20 (Partial Failure - CRM Down)**: When CRM endpoint returns HTTP 500/timeout, `/api/tasks` returns HTTP 200 with Helpdesk records and `meta.warnings` populated.
- **TC-B21 (Partial Failure - Helpdesk Down)**: When Helpdesk endpoint returns HTTP 500/timeout, `/api/tasks` returns HTTP 200 with CRM records and `meta.warnings` populated.
- **TC-B22 (Total Failure)**: When both CRM and Helpdesk fail, `/api/tasks` returns HTTP 502 with structured error details.

---

## 3. Frontend Test Suites (Vitest + React Testing Library)

### Suite F1: Dashboard Rendering & Initial State
- **TC-F01**: Renders dashboard title, logo, summary KPI cards, filter toolbar, and table headers on mount.
- **TC-F02**: Skeleton loading rows display while `/api/tasks` request is pending.

### Suite F2: KPI Summary Cards
- **TC-F03**: Total, Overdue, In Progress, and Completed cards display exact numerical counts matching the loaded task payload.
- **TC-F04**: Clicking a KPI card optionally highlights or sets the status filter accordingly.

### Suite F3: Filter & Search Interactions
- **TC-F05**: Selecting "Tushar Gupta" in the employee dropdown filters visible rows immediately.
- **TC-F06**: Selecting "In Progress" in the status dropdown updates the displayed collection.
- **TC-F07**: Typing "renewal" into the search bar filters rows with debounced input.
- **TC-F08**: Clicking "Clear Filters" restores the view to all employees and all statuses.

### Suite F4: Interactive Task Links
- **TC-F09**: Each row renders an anchor link with `href` matching task `url` and attributes `target="_blank"` and `rel="noopener noreferrer"`.
- **TC-F10**: External link icon is accessible to screen readers with appropriate aria-label.

### Suite F5: Error & Recovery States
- **TC-F11 (Partial Degradation Banner)**: When response includes `meta.warnings`, an amber warning alert appears at the top: *"CRM service is currently unavailable. Displaying Helpdesk records only."*
- **TC-F12 (Total Failure State)**: When API returns 502/network error, an error card renders with "Retry" button.
- **TC-F13 (Empty Search State)**: When search query matches zero tasks, a "No tasks matching '{query}'" message displays with a clear-search button.

---

## 4. Test Execution & CI Automation Commands (For Future Phase)

```bash
# Backend unit & integration tests
pytest backend/tests -v --cov=app

# Frontend unit & component tests
npm run test:run

# Linting & Type Checks
npm run lint
tsc --noEmit
```
