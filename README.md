# Employee Task Dashboard (WorkFlow)

> Unified, secure, real-time employee task prioritization dashboard consolidating work items from CRM and Helpdesk REST APIs with intelligent deadline-based urgency ranking, high-availability fault tolerance, role-based access control (RBAC), and persistent user authentication.

---

## 1. Project Title and Overview

**WorkFlow: Employee Task Dashboard** is a full-stack enterprise web application that unifies disparate operational feeds into an actionable command center. Developed with a high-performance **FastAPI (Python 3.10+)** backend and a modern **React 19 / TypeScript / Vite** frontend, the system aggregates tasks from independent CRM and Helpdesk systems, deduplicates records, normalizes divergent data formats, applies a deterministic 5-tier deadline and urgency ranking algorithm, and enforces cryptographic authentication and role-based authorization.

---

## 2. Authentication & Authorization Architecture

The system implements industry-standard, defence-in-depth authentication and role-based access control (RBAC):

1. **Password Hashing (Argon2id)**:
   - Uses `argon2-cffi` configured with `time_cost=3`, `memory_cost=65536`, `parallelism=4`.
   - Constant-time verification prevents side-channel timing attacks.
   - Plaintext passwords are never logged or stored.
2. **Cryptographic Tokens (JWT & HMAC-SHA256)**:
   - Tokens signed with HS256 using an explicitly validated key (minimum 32 bytes).
   - Short-lived access tokens (15 minutes).
   - Tokens carry stable user subject (`sub`), `username`, `role`, and token ID (`jti`).
3. **Session & Token Storage Security**:
   - **Zero Persistent Client Storage**: Access tokens are kept strictly in-memory in React state (`AuthContext`). Tokens are never persisted to `localStorage`, `sessionStorage`, or URL query parameters.
   - **Secure HttpOnly Cookie**: Accompanied by a `SameSite=Lax` HttpOnly session cookie (`Secure` in production) enabling transparent session re-hydration across browser reloads without JavaScript exposure.
4. **Server-Side Identity Verification**:
   - Protected API requests perform real-time database lookups against the SQLite user table to ensure deactivations and role modifications apply immediately.
5. **Brute-Force Protection & Rate Limiting**:
   - Sliding-window login rate limiter blocks automated brute-force attacks by client IP and identifier after 5 consecutive failures within a 5-minute window (HTTP 429).
6. **Persistent Storage (SQLite with PostgreSQL upgrade path)**:
   - Thread-safe SQLite database (`backend/data/users.db`) with WAL mode enabled, unique indexes on username/email, and idempotent migrations.

---

## 3. Role-Based Access Control (RBAC) Matrix

WorkFlow defines three discrete roles:

| Capability / Endpoint | Unauthenticated | EMPLOYEE | MANAGER | ADMIN |
|---|:---:|:---:|:---:|:---:|
| `GET /health` | Allowed | Allowed | Allowed | Allowed |
| `POST /api/auth/login` | Allowed | Allowed | Allowed | Allowed |
| `GET /api/auth/me` | 401 | Allowed | Allowed | Allowed |
| `POST /api/auth/logout` | Allowed | Allowed | Allowed | Allowed |
| `GET /api/tasks` (Unified feed) | 401 | Scoped to assigned tasks | All tasks & filters | All tasks & filters |
| `GET /api/crm/tasks` (Upstream feed) | Internal/Service | Allowed | Allowed | Allowed |
| `GET /api/helpdesk/tasks` (Upstream feed) | Internal/Service | Allowed | Allowed | Allowed |
| `GET /mock/crm/:id` & `/mock/helpdesk/:id` | Allowed (Detail link) | Allowed | Allowed | Allowed |
| `GET /api/admin/users` (Directory) | 401 | 403 Forbidden | 403 Forbidden | Allowed |
| `POST /api/admin/users` (Provisioning) | 401 | 403 Forbidden | 403 Forbidden | Allowed |
| `PATCH /api/admin/users/:id` | 401 | 403 Forbidden | 403 Forbidden | Allowed |
| `POST /api/admin/users/:id/deactivate` | 401 | 403 Forbidden | 403 Forbidden | Allowed (Safeguarded) |

> **Safeguard**: The system strictly prevents demoting or deactivating the last active administrator.

---

## 4. Key Features

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
5. **High-Availability Fault Tolerance**:
   - Partial upstream failure returns available records accompanied by an informative degradation banner.
   - Total outage returns HTTP 502 with an interactive retry state.
   - Record-level recovery isolates and skips corrupted records.
   - Background refresh errors preserve previously loaded tasks without wiping the screen.
6. **Administrator Management Console**:
   - Real-time user directory, new account provisioning with role assignments, and safe user deactivation.

---

## 5. Technology Stack

### Backend
- **Language**: Python 3.10+ (Tested on Python 3.12.3)
- **Framework**: FastAPI 0.115+
- **Security**: Argon2id (`argon2-cffi`), PyJWT (`pyjwt`)
- **Database**: SQLite3 (Thread-safe, WAL mode)
- **Server**: Uvicorn (ASGI)
- **Data Validation & Schemas**: Pydantic v2
- **HTTP Client**: HTTPX (Asynchronous)
- **Testing**: Pytest, AnyIO (63 passing tests)

### Frontend
- **Framework**: React 19 SPA
- **Build Tool**: Vite 6
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library (26 passing tests)

---

## 6. Monorepo Directory Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin_users.py       # Protected /api/admin/users CRUD
│   │   │   ├── auth.py              # /api/auth (login, me, logout, register)
│   │   │   ├── crm.py               # CRM mock endpoints
│   │   │   ├── helpdesk.py          # Helpdesk mock endpoints
│   │   │   ├── mock_detail.py       # Simulated detail viewers
│   │   │   └── tasks.py             # Unified /api/tasks (Protected by RBAC)
│   │   ├── core/
│   │   │   ├── config.py            # Environment settings & JWT configuration
│   │   │   ├── dependencies.py      # get_current_user, require_roles, require_admin
│   │   │   ├── rate_limit.py        # Sliding-window failed login rate limiter
│   │   │   └── security.py          # Argon2id hashing & PyJWT token generator
│   │   ├── db/
│   │   │   ├── database.py          # SQLite connection manager & schema init
│   │   │   └── user_repository.py   # User persistence and CRUD queries
│   │   ├── mock_data/
│   │   │   ├── crm_data.py          # 12 deterministic CRM records
│   │   │   └── helpdesk_data.py     # 12 deterministic Helpdesk records
│   │   ├── schemas/
│   │   │   ├── task.py              # Pydantic task schemas & enums
│   │   │   └── user.py              # Pydantic auth & user models
│   │   ├── scripts/
│   │   │   └── bootstrap_admin.py   # Idempotent admin & demo user provisioning
│   │   ├── services/
│   │   │   ├── source_client.py     # Async HTTPX client & error handling
│   │   │   ├── task_filtering.py    # Employee, status, & search filters
│   │   │   ├── task_normalizer.py   # Schema normalization & deduplication
│   │   │   └── task_prioritization.py # 5-tier ranking algorithm
│   │   └── main.py                  # FastAPI app entry point & CORS configuration
│   ├── tests/
│   │   ├── test_auth.py             # Login, logout, tokens, rate limit tests
│   │   ├── test_crm.py              # CRM endpoint tests
│   │   ├── test_health.py           # Health check & CORS tests
│   │   ├── test_helpdesk.py         # Helpdesk endpoint tests
│   │   ├── test_rbac.py             # Role enforcement & scoping tests
│   │   ├── test_reliability.py      # Malformed JSON & recovery tests
│   │   ├── test_task_prioritization.py # Priority & tie-breaking tests
│   │   └── test_tasks_unified.py    # Authenticated task aggregator tests
│   ├── .env.example                 # Backend environment variable template
│   ├── pytest.ini                   # Pytest configuration
│   └── requirements.txt             # Authoritative backend Python dependencies
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminUserManagement.tsx  # Admin user & role management modal
│   │   │   ├── AlertBanner.tsx          # Warning & degradation banners
│   │   │   ├── Badges.tsx               # Status & priority badges
│   │   │   ├── DashboardHeader.tsx      # Header, user badge, refresh, logout
│   │   │   ├── EmptyState.tsx           # No tasks / filtered-out empty state
│   │   │   ├── ErrorState.tsx           # Full-page outage & retry state
│   │   │   ├── LoadingState.tsx         # Skeleton loader
│   │   │   ├── LoginPage.tsx            # Responsive login view with quick-fill
│   │   │   ├── Sidebar.tsx              # Workspace navigation drawer
│   │   │   ├── SummaryCards.tsx         # KPI cards with loading skeletons
│   │   │   ├── TaskRow.tsx              # Individual interactive task row
│   │   │   ├── TaskTable.tsx            # Prioritized responsive task table
│   │   │   └── TaskToolbar.tsx          # Filter dropdowns, search, chips
│   │   ├── context/
│   │   │   └── AuthContext.tsx          # In-memory JWT & HttpOnly session provider
│   │   ├── hooks/
│   │   │   └── useTasks.ts              # Authenticated task fetching hook
│   │   ├── services/
│   │   │   ├── authApi.ts               # Auth & admin API client
│   │   │   └── taskApi.ts               # Task aggregator client
│   │   ├── types/
│   │   │   ├── auth.ts                  # TypeScript types for authentication & users
│   │   │   └── task.ts                  # TypeScript types for task items
│   │   ├── utils/
│   │   │   └── taskDisplay.ts           # Formatters, date helpers, urgency icons
│   │   ├── App.test.tsx                 # Frontend dashboard specification tests
│   │   ├── auth.test.tsx                # Frontend auth, validation & role tests
│   │   ├── e2e.test.tsx                 # 12-step End-to-End user journey test
│   │   ├── App.tsx                      # Root application & session gate
│   │   ├── index.css                    # Tailwind CSS imports and utility styles
│   │   └── main.tsx                     # React DOM entry point
│   ├── .env.example                     # Frontend environment variable template
│   ├── index.html                       # HTML root template
│   ├── package.json                     # Authoritative frontend dependencies & scripts
│   ├── postcss.config.js                # PostCSS configuration
│   ├── tailwind.config.js               # Tailwind CSS theme configuration
│   ├── tsconfig.json                    # TypeScript compiler configuration
│   └── vite.config.ts                   # Vite proxy & test configuration
├── dev-all.js                           # Dual-server concurrent runner
├── package.json                         # Root monorepo orchestration scripts
├── render.yaml                          # Multi-service Render deployment blueprint
├── vercel.json                          # Vercel deployment manifest
├── Procfile                             # Process declaration for PaaS deployment
└── README.md                            # Comprehensive project documentation
```

---

## 7. Demo Accounts & Default Credentials

The system automatically bootstraps demo accounts on startup for immediate testing:

| Role | Username | Password | Notes |
|---|---|---|---|
| **ADMIN** | `admin` | `Admin@Workflow2026!` | Full dashboard access + Admin User Directory |
| **MANAGER** | `manager` | `Manager@Workflow2026!` | Views all 24 tasks across CRM & Helpdesk |
| **EMPLOYEE** | `sarah` | `Employee@Workflow2026!` | Mapped to representative *Sarah Jenkins* (scoped tasks) |

*(Quick-fill buttons on the login screen allow one-click credential population).*

---

## 8. Installation and Execution

### Option A: Monorepo Root Commands (Recommended)

Run both frontend and backend concurrently with one command from the project root:

```bash
# Launch both FastAPI backend and Vite frontend concurrently
npm start
# or: node dev-all.js
```

This starts:
- **FastAPI Backend**: `http://127.0.0.1:8001` (API, Auth & Health check)
- **React Vite Frontend**: `http://localhost:3000` (Dev server with API proxy)

Root convenience scripts:
```bash
# Start frontend dev server only
npm run dev:frontend

# Start backend server only
npm run dev:backend

# Build frontend production bundle
npm run build:frontend

# TypeScript typecheck
npm run lint:frontend
```

---

### Option B: Independent Service Commands

Both services can be developed, tested, and run completely independently:

#### 1. Backend Service
```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

#### 2. Frontend Service
```bash
cd frontend
npm install
npm run dev
```

---

## 9. Running Automated Tests

### Run All Tests (Root Monorepo)
```bash
# Runs both frontend vitest suite and backend pytest suite
npm test
```

### Run Backend Tests Only
From root:
```bash
npm run test:backend
# or: python -m pytest backend/tests
```
Or from inside `backend/`:
```bash
cd backend
python -m pytest tests
```
*Expected: 63 passed.*

### Run Frontend Tests Only
From root:
```bash
npm run test:frontend
```
Or from inside `frontend/`:
```bash
cd frontend
npm test
```
*Expected: 26 passed across 3 test suites.*

### Run Frontend TypeScript Check
From root:
```bash
npm run lint:frontend
```
Or from inside `frontend/`:
```bash
cd frontend
npm run lint
```
*Expected: 0 errors.*

### Build Production Bundle
```bash
npm run build
```

---

## 10. API Endpoints

### Authentication & Sessions
- `POST /api/auth/login`: Authenticate credentials, issue access token & set HttpOnly cookie.
- `GET /api/auth/me`: Safe user profile of authenticated requester.
- `POST /api/auth/logout`: Invalidate session and clear session cookies.
- `POST /api/auth/register`: Disabled (returns HTTP 403).

### Administrative User Management (Admin Only)
- `GET /api/admin/users`: List all registered accounts.
- `POST /api/admin/users`: Provision a new account with specified role.
- `PATCH /api/admin/users/{user_id}`: Update role, employee name, or reset password.
- `POST /api/admin/users/{user_id}/deactivate`: Deactivate account (protected against last admin).

### Tasks Aggregator (Protected)
- `GET /api/tasks`: Consolidated, prioritized task feed. Scoped to employee for EMPLOYEE role; global for MANAGER/ADMIN.

### Health Check (Public)
- `GET /health`: Liveness probe for monitoring.

---

## 11. Security Limitations & Production Considerations

- **Single Host / Multiple Worker In-Memory Limiter**: The login rate limiter currently uses an in-memory sliding window. In horizontally scaled multi-worker production deployments across multiple instances, swap the in-memory limiter with Redis or a distributed key-value store.
- **Asymmetric Tokens in Microservices**: For large-scale distributed microservices, RS256/EdDSA asymmetric keys are recommended over shared HMAC secrets to allow external verification without distributing signing keys.
