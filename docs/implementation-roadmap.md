# Implementation Roadmap: Steps 2 Through 10

**Project**: Employee Task Dashboard  
**Status**: Step 1 - Approved Technical Blueprint  

---

## Roadmap Summary

```
[Step 1] Planning & Technical Blueprint (COMPLETE)
   │
   ├──> [Step 2] Project Initialization & Dependency Baseline
   │       │
   │       ├──> [Step 3] Mock CRM & Helpdesk REST API Services
   │       │       │
   │       │       └──> [Step 4] Unified Backend Aggregator & Normalization Pipeline
   │       │               │
   │       │               └──> [Step 5] Deterministic Prioritization Engine
   │       │                       │
   │       │                       └──> [Step 6] React Dashboard Layout & Core UI
   │       │                               │
   │       │                               └──> [Step 7] Filtering, Search & Deep Link Interactions
   │       │                                       │
   │       │                                       └──> [Step 8] Fault Tolerance & Error Boundary Handling
   │       │                                               │
   │       │                                               └──> [Step 9] Automated Testing & QA Verification
   │       │                                                       │
   │       │                                                       └──> [Step 10] Deployment, README & Submission
```

---

## Detailed Step-by-Step Plans

### Step 2: Project Initialization & Dependency Baseline
- **Objective**: Establish the development foundation, configure dev server proxy, verify Tailwind CSS v4, Lucide icons, and server runtime.
- **Files Created/Modified**:
  - `package.json`
  - `vite.config.ts`
  - `.env.example`
  - `server.ts` (or backend `requirements.txt` / `main.py`)
- **Dependencies**: Step 1.
- **Completion Criteria**: Dev server boots cleanly on port 3000; TypeScript compiles without diagnostics; Tailwind CSS classes compile.
- **Verification Command**: `npm run build` or `compile_applet`.
- **Expected Output**: Successful build bundle without errors.

---

### Step 3: Mock CRM & Helpdesk REST API Implementation
- **Objective**: Implement independent mock CRM and Helpdesk endpoints exposing realistic enterprise data, simulated latency, error triggers, and deep link viewer pages.
- **Files Created/Modified**:
  - `src/mock/crmData.ts` (or `backend/app/mock_data/crm.py`)
  - `src/mock/helpdeskData.ts` (or `backend/app/mock_data/helpdesk.py`)
  - `src/api/mockRoutes.ts` (or `backend/app/api/mock.py`)
- **Dependencies**: Step 2.
- **Completion Criteria**:
  - `GET /api/crm/tasks` responds with structured CRM records.
  - `GET /api/helpdesk/tasks` responds with structured Helpdesk tickets.
  - Interactive mock viewers respond with formatted record HTML.
- **Verification Command**: `curl -s http://localhost:3000/api/crm/tasks` and `curl -s http://localhost:3000/api/helpdesk/tasks`.
- **Expected Output**: Valid JSON arrays containing CRM and Helpdesk records.

---

### Step 4: Unified Backend Integration & Normalization Pipeline
- **Objective**: Build the aggregator service that concurrently fetches from CRM and Helpdesk, maps dissimilar field names into the canonical schema, and handles ID deduplication.
- **Files Created/Modified**:
  - `src/services/normalizer.ts` (or `backend/app/services/normalizer.py`)
  - `src/services/aggregator.ts` (or `backend/app/services/aggregator.py`)
  - `src/types/task.ts` (or `backend/app/schemas/task.py`)
- **Dependencies**: Step 3.
- **Completion Criteria**: `GET /api/tasks` returns normalized task collection combining records from both CRM and Helpdesk.
- **Verification Command**: `curl -s http://localhost:3000/api/tasks`.
- **Expected Output**: Canonical JSON with `data`, `meta.total_count`, and `meta.sources_succeeded`.

---

### Step 5: Task Prioritization Engine
- **Objective**: Implement the 5-tier deadline and urgency ranking algorithm with sub-sorting, tie-breaking, and injectable evaluation clock.
- **Files Created/Modified**:
  - `src/services/prioritizer.ts` (or `backend/app/services/prioritizer.py`)
  - Unit tests for prioritization tiers.
- **Dependencies**: Step 4.
- **Completion Criteria**: Overdue tasks appear first; today's tasks appear second; urgent items precede medium items; completed items sink to bottom.
- **Verification Command**: Automated unit test execution.
- **Expected Output**: 100% pass rate across sorting edge cases.

---

### Step 6: React Dashboard Layout & Core UI
- **Objective**: Implement the enterprise UI containing the branded sidebar, header, summary KPI metric cards, and responsive task data table with badges.
- **Files Created/Modified**:
  - `src/components/Sidebar.tsx`
  - `src/components/Header.tsx`
  - `src/components/SummaryCards.tsx`
  - `src/components/TaskTable.tsx`
  - `src/components/TaskBadge.tsx`
  - `src/App.tsx`
- **Dependencies**: Step 5.
- **Completion Criteria**: Responsive dashboard renders tasks in prioritized order with source badges (CRM purple, Helpdesk blue) and urgency pills.
- **Verification Command**: `compile_applet`.
- **Expected Output**: Clean, zero-flicker UI render.

---

### Step 7: Filters, Search & Deep Link Interactions
- **Objective**: Implement employee dropdown filtering, status filtering (Pending, In Progress, Completed), keyword search, and accessible external deep links.
- **Files Created/Modified**:
  - `src/components/FilterToolbar.tsx`
  - `src/hooks/useTasks.ts`
  - `src/components/TaskRow.tsx`
- **Dependencies**: Step 6.
- **Completion Criteria**: Selecting an employee filters the list instantly; status filters isolate stages; search queries filter titles/descriptions; clicking task title opens source viewer in new tab.
- **Verification Command**: Interactive UI interaction & filter assertion.
- **Expected Output**: Table reflects filtered state with matching KPI metric counts.

---

### Step 8: Error Handling & Reliability
- **Objective**: Add resilient handling for partial source degradation, upstream timeouts, empty results, and total service outages.
- **Files Created/Modified**:
  - `src/components/AlertBanner.tsx`
  - `src/components/EmptyState.tsx`
  - `src/components/ErrorCard.tsx`
  - `src/components/SkeletonLoader.tsx`
- **Dependencies**: Step 7.
- **Completion Criteria**: Simulating a CRM failure displays Helpdesk tasks with a non-blocking warning banner and a "Retry CRM" button. Total failure shows retry screen.
- **Verification Command**: Simulate upstream error query flag `?simulate_crm_error=true`.
- **Expected Output**: Amber alert banner appears; Helpdesk tasks remain fully functional.

---

### Step 9: Automated Testing & Quality Assurance
- **Objective**: Execute backend and frontend test suites covering schemas, sorting, filters, edge cases, and accessibility.
- **Files Created/Modified**:
  - `src/test/prioritization.test.ts`
  - `src/test/normalizer.test.ts`
  - `src/test/Dashboard.test.tsx`
- **Dependencies**: Step 8.
- **Completion Criteria**: All unit, integration, and UI test suites pass with >85% code coverage.
- **Verification Command**: `npm test` or `pytest`.
- **Expected Output**: Zero test failures, zero lint warnings.

---

### Step 10: Deployment, README, GitHub & Final Submission
- **Objective**: Prepare production build, author professional documentation, configure deployment scripts, and verify all submission criteria.
- **Files Created/Modified**:
  - `README.md` (Architecture, quickstart, API documentation, screenshots, design decisions)
  - Production build scripts
- **Dependencies**: Step 9.
- **Completion Criteria**: Clean build passing `npm run build`; README contains complete setup steps, environment instructions, and architecture diagrams.
- **Verification Command**: `npm run build && npm run preview` (or production verification).
- **Expected Output**: Production distribution ready for deployment.
