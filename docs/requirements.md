# Requirements Analysis Document: Employee Task Dashboard

**Project**: Employee Task Dashboard  
**Status**: Step 1 - Approved Technical Blueprint  
**Target Delivery**: Enterprise Web Application (React + FastAPI / Node.js Backend)  

---

## 1. Executive Summary & Problem Statement

Modern enterprise customer-facing and internal operations teams split their workload across disparate tools—principally Customer Relationship Management (CRM) platforms (e.g., Salesforce, HubSpot) and Helpdesk ticketing systems (e.g., Zendesk, Jira Service Desk). Consequently, employees suffer from context fragmentation, lack of global task prioritization, and delayed resolution times for critical items.

The **Employee Task Dashboard** consolidates work items from two independent mock REST services—**CRM** and **Helpdesk**—into a single, unified, real-time prioritization interface. It ranks tasks algorithmically by deadline and urgency, enables employee and status-based filtering, provides direct deep-links to source applications, and gracefully handles partial and total upstream API failures.

---

## 2. Scope Matrix

| Feature Domain | Mandatory Assignment Scope | Optional Enhancement Scope | Out of Scope (Step 1) |
|---|---|---|---|
| **Data Aggregation** | Ingest from Mock CRM & Helpdesk REST endpoints | Real-time polling / manual refresh action | Database persistence, OAuth authentication |
| **Data Normalization** | Map disparate CRM & Helpdesk schemas to canonical schema | Tag extraction / custom labels | Bi-directional synchronization |
| **Prioritization** | 5-tier deterministic deadline + urgency ranking | Dynamic custom sort order | ML-based sentiment prioritization |
| **Filtering & Search** | Filter by Employee, Filter by Status (Pending, In Progress, Completed) | Free-text keyword search (title, description) | Multi-criteria faceted tagging |
| **Interactivity** | Clickable links opening source apps | Dedicated mock detail inspection views | In-dashboard task editing / mutations |
| **Resilience** | Partial failure banner, total failure empty state, retry trigger | Client-side cached fallback | Offline service worker synchronization |
| **Design** | Clean, responsive UI (desktop, tablet, mobile) | Summary KPI metric cards | Complex chart visualizers, custom themes |

---

## 3. Detailed Functional Requirements

### FR-01: Unified Task Dashboard
- **Requirement ID**: `FR-01`
- **Description**: Consolidate tasks from two independent mock sources (CRM and Helpdesk) into a single unified view.
- **User Interaction**: Upon opening the application or switching to the Dashboard view, the user observes a unified list/table of tasks without needing to manually toggle between CRM or Helpdesk.
- **Expected Behavior**: The application displays tasks in canonical order, showing task source indicators (CRM vs. Helpdesk badge), title, assigned employee, deadline, urgency, and status.
- **Frontend Responsibility**: Request `/api/tasks`, render data in a responsive table/card layout, display visual badges for source and urgency.
- **Backend Responsibility**: Concurrently query CRM and Helpdesk mock endpoints, normalize payloads, deduplicate identities, sort, and return canonical response.
- **API Dependencies**: `GET /api/tasks`, `GET /api/crm/tasks`, `GET /api/helpdesk/tasks`.
- **Acceptance Criteria**: All valid records returned from both services are displayed with complete attributes and identifiable source tags.
- **Failure Cases**: Either or both upstream services return non-200 or timeout (see `FR-07`).

---

### FR-02: Task Prioritization Engine
- **Requirement ID**: `FR-02`
- **Description**: Automatically rank all retrieved tasks according to deadline urgency, overdue status, and completion state.
- **User Interaction**: Tasks are pre-sorted so the most time-critical tasks appear at the top. The user can see why a task is prioritized via visual badges (e.g., "Overdue", "Due Today", "Urgent").
- **Expected Behavior**:
  1. Priority 1: Overdue, incomplete tasks (`status != Completed` and `deadline < now`).
  2. Priority 2: Incomplete tasks due today (`deadline` within current calendar date UTC).
  3. Priority 3: Incomplete tasks due within 48 hours.
  4. Priority 4: Incomplete tasks due beyond 48 hours or with missing/null deadlines.
  5. Priority 5: Completed tasks (`status == Completed`), sorted by most recent deadline.
  - Sub-sorting within each tier: Urgency rank (`Urgent` > `High` > `Medium` > `Low`), followed by chronological deadline (`earliest first`).
- **Frontend Responsibility**: Present tasks in server-sorted sequence; display urgency and overdue pill styling.
- **Backend Responsibility**: Implement deterministic sorting algorithm with injectable clock for testability.
- **API Dependencies**: `/api/tasks` response pre-sorted or client-side verified.
- **Acceptance Criteria**: Overdue tasks always appear before today's tasks; urgent tasks appear before low priority within the same time window; completed tasks always sink to the bottom.
- **Failure Cases**: Missing deadline strings or malformed date formats fallback safely to lowest urgency within the uncompleted tier.

---

### FR-03: Employee Filtering
- **Requirement ID**: `FR-03`
- **Description**: Filter dashboard view by specific employee or display all employees.
- **User Interaction**: Dropdown selector in the filter toolbar populated with unique assigned employee names plus "All Employees".
- **Expected Behavior**: Selecting an employee filters the displayed tasks to only those assigned to that individual. Selecting "All Employees" resets the filter.
- **Frontend Responsibility**: Update URL query parameters or local filter state; trigger filtered query or immediate client filter; update KPI summary cards to reflect selection.
- **Backend Responsibility**: Accept `?employee={name}` query parameter on `GET /api/tasks` (case-insensitive substring or exact match).
- **API Dependencies**: `GET /api/tasks?employee=...`
- **Acceptance Criteria**: Selecting "Tushar" only displays tasks where `employee.toLowerCase() === 'tushar'`.
- **Failure Cases**: Selecting an employee with zero tasks renders a helpful "No tasks found for this employee" empty state.

---

### FR-04: Status Filtering
- **Requirement ID**: `FR-04`
- **Description**: Filter tasks by execution lifecycle status: `Pending`, `In Progress`, and `Completed`.
- **User Interaction**: Segmented control or dropdown menu offering "All Statuses", "Pending", "In Progress", and "Completed".
- **Expected Behavior**: Only tasks matching the selected status are shown. Can be combined with the employee filter.
- **Frontend Responsibility**: Manage status selection state and pass parameter to backend.
- **Backend Responsibility**: Accept `?status={status}` parameter and filter normalized task list.
- **API Dependencies**: `GET /api/tasks?status=...`
- **Acceptance Criteria**: When "In Progress" is selected, only tasks with `status === 'In Progress'` appear.
- **Failure Cases**: Invalid status query parameter returns HTTP 422 (or falls back to unfiltered list with validation message).

---

### FR-05: Clickable Task Deep Links
- **Requirement ID**: `FR-05`
- **Description**: Each task record must include a clickable link redirecting the user to the source application context.
- **User Interaction**: Clicking the task title or external link icon opens the source task in a new browser tab (`target="_blank" rel="noopener noreferrer"`).
- **Expected Behavior**:
  - CRM tasks navigate to `/api/mock/crm/tasks/{id}` or the simulated CRM portal.
  - Helpdesk tasks navigate to `/api/mock/helpdesk/tasks/{id}` or the simulated Helpdesk ticket viewer.
- **Frontend Responsibility**: Render accessible anchor tags with external link icons and security attributes.
- **Backend Responsibility**: Generate canonical `url` property for each normalized task pointing to mock detail route.
- **API Dependencies**: `GET /api/mock/crm/tasks/{id}`, `GET /api/mock/helpdesk/tasks/{id}`.
- **Acceptance Criteria**: Clicking CRM-101 opens the mock CRM detail viewer showing complete raw CRM metadata.
- **Failure Cases**: Malformed task ID results in friendly 404 page in the mock viewer.

---

### FR-06: Dual API Integration & Schema Normalization
- **Requirement ID**: `FR-06`
- **Description**: Asynchronously fetch tasks from CRM and Helpdesk REST endpoints, transform their divergent structures into a unified canonical schema.
- **User Interaction**: Transparent to user; happens during data loading.
- **Expected Behavior**: Backend requests both mock services concurrently using `asyncio` / `httpx` (or `Promise.all` in Node.js), normalizes distinct field names (e.g. CRM `due_date` vs. Helpdesk `sla_deadline`), and merges the collections.
- **Frontend Responsibility**: Consume normalized JSON contract.
- **Backend Responsibility**: Fault-tolerant client, schema adapters, error boundary per source.
- **API Dependencies**: Upstream `/api/crm/tasks` and `/api/helpdesk/tasks`.
- **Acceptance Criteria**: The combined list contains entries from both sources, each with the standardized attributes.
- **Failure Cases**: One source takes >3 seconds or returns 500 (handled via partial degradation).

---

### FR-07: Resilient Error & Partial Failure Handling
- **Requirement ID**: `FR-07`
- **Description**: Gracefully communicate network errors, server errors, empty states, and partial source failures.
- **User Interaction**:
  - If CRM fails but Helpdesk succeeds: The dashboard loads Helpdesk tasks and displays a non-blocking warning banner: *"CRM service is currently unavailable. Displaying Helpdesk tasks only."* with a "Retry CRM" button.
  - If both fail: A full-screen empty/error state is shown with diagnostic message and "Retry All" button.
  - Loading states are indicated with skeleton rows.
- **Expected Behavior**: Partial data is never discarded if at least one upstream source is healthy. HTTP status 200 is returned with a `meta.warnings` array documenting degraded sources.
- **Frontend Responsibility**: Display banner alerts, skeleton loaders, and interactive retry buttons.
- **Backend Responsibility**: Return structured response containing `data`, `meta.total`, and `meta.partial_failures`.
- **API Dependencies**: `/api/tasks`.
- **Acceptance Criteria**: Dashboard never crashes on malformed source JSON or HTTP 500 from upstream.

---

### FR-08: Responsive SaaS Interface
- **Requirement ID**: `FR-08`
- **Description**: Provide an accessible, modern, high-density dashboard suitable for desktop (1440px+), laptop (1024px), tablet (768px), and mobile (375px+).
- **User Interaction**: Users can browse tasks on any form factor. On mobile, table rows collapse into card-based layouts.
- **Expected Behavior**: Fluid typography, responsive grids, collapsible sidebar/navigation, and minimum 44px touch targets on mobile.
- **Frontend Responsibility**: Tailwind CSS utility classes, flexbox/grid layouts, responsive breakpoints (`md:`, `lg:`).
- **Acceptance Criteria**: No horizontal scroll on viewport widths between 360px and 2560px.

---

### FR-09: Summary KPI Metric Cards
- **Requirement ID**: `FR-09`
- **Description**: Compute and present real-time operational aggregates at the top of the dashboard.
- **User Interaction**: Glanced metric summary providing immediate situational awareness.
- **Expected Behavior**:
  - Total Tasks count.
  - Overdue Tasks count (highlighted in red/rose).
  - In-Progress Tasks count (highlighted in amber/orange).
  - Completed Tasks count (highlighted in emerald/green).
- **Frontend Responsibility**: Calculate from loaded dataset or read from `meta.statistics`.
- **Backend Responsibility**: Supply pre-calculated aggregates in response metadata.
- **Acceptance Criteria**: Sum of Pending + In Progress + Completed equals Total Tasks.

---

### FR-10: Search and Manual Refresh
- **Requirement ID**: `FR-10`
- **Description**: Allow keyword search across task title and description, and provide an explicit "Refresh" button.
- **User Interaction**: Input in search bar filters tasks dynamically. Clicking "Refresh" re-fetches latest tasks from both APIs without reloading the page.
- **Expected Behavior**: Search input filters with 250ms debounce or on-change; refresh displays a spinning indicator and updates timestamp.
- **Frontend Responsibility**: Debounced input handling, cache invalidation trigger.
- **Backend Responsibility**: Support optional `?search=` query parameter.
- **Acceptance Criteria**: Searching "contract" returns only tasks with "contract" in title or description.
