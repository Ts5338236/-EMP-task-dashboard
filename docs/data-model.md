# Data Model & Schema Normalization Specification

**Project**: Employee Task Dashboard  
**Status**: Step 1 - Approved Technical Blueprint  

---

## 1. Canonical Task Schema

The Canonical Task Model serves as the single source of truth across the frontend and backend. It eliminates system-specific idioms (such as CRM "reps" and "deal stages" vs. Helpdesk "tickets", "owners", and "severities").

### 1.1 Field Definitions & Constraints

| Field | Type | Required | Allowed Values / Format | Description |
|---|---|---|---|---|
| `id` | `string` | **Yes** | `^[A-Z]{2,8}-[0-9a-zA-Z_-]+$` | Globally unique synthetic identifier prefixed with source (e.g., `CRM-101`, `HD-502`). |
| `title` | `string` | **Yes** | 1 to 255 chars | Clear summary of the work item. |
| `description` | `string` | **Yes** (defaults to `""`) | Arbitrary text | Contextual details, notes, or customer comments. |
| `employee` | `string` | **Yes** | Non-empty string | Normalized assignee full name (e.g. `Tushar Gupta`). |
| `status` | `enum` | **Yes** | `Pending`, `In Progress`, `Completed` | Standard 3-state workflow lifecycle. |
| `deadline` | `string \| null` | Optional | ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`) or `null` | Exact SLA or completion target. |
| `urgency` | `enum` | **Yes** | `Urgent`, `High`, `Medium`, `Low` | Standardized urgency classification. |
| `source` | `enum` | **Yes** | `CRM`, `Helpdesk` | Originating enterprise system. |
| `url` | `string` | **Yes** | Absolute or relative URL | Direct navigational deep-link to source view. |
| `priority_tier` | `integer` | Computed | `1` to `5` | Sorting tier assigned by prioritization engine. |
| `is_overdue` | `boolean` | Computed | `true` \| `false` | Evaluated against evaluation time (`deadline < now && status != Completed`). |

---

## 2. Source-to-Canonical Mapping Rules

### 2.1 CRM Mapping Rules

CRM records represent deals, contracts, account reviews, and client onboarding tasks.

| Canonical Field | Raw CRM Field | Transformation / Fallback Logic |
|---|---|---|
| `id` | `record.crm_id` | Ensure prefix: `record.crm_id.startsWith("CRM-") ? record.crm_id : "CRM-" + record.crm_id` |
| `title` | `record.action_item`, `record.account_name` | Formatted as: `"{action_item} ({account_name})"`. If `account_name` absent, fallback to `action_item`. |
| `description` | `record.notes` | If null or empty string, fallback to `"No notes provided."`. |
| `employee` | `record.assigned_rep` | Trim whitespace. If missing, fallback to `"Unassigned"`. |
| `status` | `record.state` | Map `"pending"` / `"open"` / `"created"` -> `Pending`<br>Map `"in_progress"` / `"active"` / `"working"` -> `In Progress`<br>Map `"completed"` / `"closed"` / `"won"` / `"lost"` -> `Completed`<br>Fallback -> `Pending` |
| `deadline` | `record.due_date` | Parse as ISO 8601; normalize to UTC `Z` format. If unparseable or absent, set to `null`. |
| `urgency` | `record.deal_priority` | Map `"urgent"` / `"critical"` -> `Urgent`<br>Map `"high"` -> `High`<br>Map `"medium"` -> `Medium`<br>Map `"low"` -> `Low`<br>Fallback -> `Medium` |
| `source` | Static | Always `"CRM"`. |
| `url` | `record.crm_deep_link` | If present, use value; else generate `/api/mock/crm/tasks/{id}`. |

---

### 2.2 Helpdesk Mapping Rules

Helpdesk records represent incident tickets, customer bugs, and IT support service requests.

| Canonical Field | Raw Helpdesk Field | Transformation / Fallback Logic |
|---|---|---|
| `id` | `ticket.ticket_key` | Ensure prefix: `ticket.ticket_key.startsWith("HD-") ? ticket.ticket_key : "HD-" + ticket.ticket_key` |
| `title` | `ticket.subject` | Directly mapped. Trim whitespace. |
| `description` | `ticket.description` | Directly mapped. |
| `employee` | `ticket.owner` | Trim whitespace. If missing, fallback to `"Unassigned"`. |
| `status` | `ticket.ticket_status` | Map `"open"` / `"new"` / `"escalated"` -> `Pending`<br>Map `"in_progress"` / `"investigating"` -> `In Progress`<br>Map `"resolved"` / `"closed"` -> `Completed`<br>Fallback -> `Pending` |
| `deadline` | `ticket.sla_deadline` | Parse as ISO 8601 UTC. If unparseable or absent, set to `null`. |
| `urgency` | `ticket.severity` | Map `"P1"` / `"blocker"` / `"critical"` -> `Urgent`<br>Map `"P2"` / `"major"` -> `High`<br>Map `"P3"` / `"minor"` -> `Medium`<br>Map `"P4"` / `"trivial"` -> `Low`<br>Fallback -> `Medium` |
| `source` | Static | Always `"Helpdesk"`. |
| `url` | `ticket.portal_url` | If present, use value; else generate `/api/mock/helpdesk/tasks/{id}`. |

---

## 3. ID Collision Avoidance

Because CRM and Helpdesk are separate, non-coordinated upstream databases, it is common for both systems to assign integer IDs (e.g. CRM item `#101` and Helpdesk ticket `#101`).
- The canonical model strictly enforces a **composite unique key** composed of the system prefix + original identifier:
  - CRM: `CRM-101`
  - Helpdesk: `HD-101`
- This ensures React rendering keys (`key={task.id}`) are guaranteed to remain unique in the virtual DOM, preventing state corruption.

---

## 4. Date & Timezone Strategy

1. **Storage and Serialization**:
   - All deadlines are stored, transmitted, and evaluated as **UTC ISO 8601 strings** (`YYYY-MM-DDTHH:MM:SSZ`).
2. **Missing & Invalid Deadlines**:
   - If an upstream record omits a deadline or provides an invalid string (e.g. `"N/A"`, `"TBD"`), the normalizer assigns `deadline: null`.
   - Records with `deadline: null` are never classified as "Overdue". They are routed to **Tier 4 (Upcoming / No Deadline)**.
3. **Display Formatting**:
   - The React frontend formats UTC ISO timestamps using `Intl.DateTimeFormat` or concise relative indicators (e.g. *"Yesterday, 2:00 PM"*, *"Today at 6:00 PM"*, *"Tomorrow at 11:30 AM"*).
   - If `deadline === null`, the UI displays a subtle badge: *"No deadline"*.

---

## 5. TypeScript Interfaces

```typescript
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskUrgency = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskSource = 'CRM' | 'Helpdesk';

export interface Task {
  id: string;
  title: string;
  description: string;
  employee: string;
  status: TaskStatus;
  deadline: string | null;
  urgency: TaskUrgency;
  source: TaskSource;
  url: string;
  priority_tier: 1 | 2 | 3 | 4 | 5;
  priority_score: number;
  is_overdue: boolean;
}

export interface KPIStats {
  total: number;
  overdue: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export interface SourceWarning {
  source: string;
  error_code: string;
  message: string;
}

export interface TasksResponse {
  data: Task[];
  meta: {
    total_count: number;
    statistics: KPIStats;
    warnings: SourceWarning[];
    sources_queried: string[];
    sources_succeeded: string[];
  };
}

export interface FilterState {
  employee: string;
  status: string;
  search: string;
}
```
