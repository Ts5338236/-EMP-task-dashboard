# Prioritization Algorithm Specification

**Project**: Employee Task Dashboard  
**Status**: Step 1 - Approved Technical Blueprint  

---

## 1. Objectives & Guiding Principles

The prioritization engine must be:
1. **Deterministic**: Given the same set of tasks and reference timestamp, the ordering is 100% reproducible.
2. **Explainable**: Any employee or manager can readily understand why Task A appears above Task B (e.g., *"Task A is overdue and urgent, whereas Task B is due tomorrow"*).
3. **Resilient to Missing Data**: Missing or unparseable deadlines never trigger crashes or arbitrary placement.
4. **Testable via Clock Injection**: The algorithm accepts an optional `now: datetime` parameter rather than relying directly on system wall clock time.

---

## 2. Five-Tier Priority Hierarchy

Every task is assigned to an integer **Priority Tier** ($1 \le \text{Tier} \le 5$), where Tier 1 has the highest urgency and Tier 5 has the lowest urgency.

| Tier | Classification | Definition Criteria | Rationale |
|---|---|---|---|
| **Tier 1** | **Overdue Incomplete** | `status != Completed` AND `deadline != null` AND `deadline < now` | Past SLA deadlines represent immediate business risk and contract breach. |
| **Tier 2** | **Due Today** | `status != Completed` AND `deadline != null` AND `deadline >= now` AND `date(deadline) == date(now)` | Work items required before end of current business day. |
| **Tier 3** | **Due Within 48 Hours** | `status != Completed` AND `deadline != null` AND `now < deadline <= (now + 48 hours)` AND `date(deadline) > date(now)` | Near-term operational priorities requiring active preparation. |
| **Tier 4** | **Upcoming or No Deadline** | `status != Completed` AND (`deadline > (now + 48 hours)` OR `deadline == null`) | Standard backlog and future roadmap tasks. |
| **Tier 5** | **Completed Tasks** | `status == Completed` (Regardless of whether deadline was in past or future) | Done items are retained for visibility and audit, but must never clutter active focus. |

---

## 3. Sub-Sorting & Tie-Breaking Rules

Within each Tier, tasks are ordered by:

### Step 3.1: Urgency Rank
Urgency values are mapped to numerical weights:
- `Urgent` $\rightarrow$ Weight: **4**
- `High` $\rightarrow$ Weight: **3**
- `Medium` $\rightarrow$ Weight: **2**
- `Low` $\rightarrow$ Weight: **1**

Higher weight sorts first.

### Step 3.2: Earliest Deadline Tie-Breaker
If two tasks share the same Tier and Urgency weight:
- Chronologically earlier deadlines sort first (ascending order: `deadline_A < deadline_B`).
- If one task has a deadline and the other has `deadline: null`, the task with a concrete deadline sorts first.
- If both have identical deadlines (or both are `null`), sort alphabetically by task `id` (`CRM-101` vs `HD-501`) to guarantee deterministic ordering.

---

## 4. Special Edge Cases

1. **Completed Tasks with Past Deadlines**:
   - A task marked `Completed` whose deadline was 5 days ago is classified as **Tier 5**, NOT Tier 1. Completed work is never considered "overdue".
2. **Tasks Due Exactly at Current Timestamp**:
   - If `deadline == now`, the task is classified as **Tier 2 (Due Today)**. It transitions to Tier 1 once `now` strictly exceeds `deadline`.
3. **Missing or Malformed Deadlines**:
   - Any missing, empty, or unparseable deadline defaults to `deadline: null`.
   - Incomplete tasks with `deadline: null` are placed in **Tier 4** with lowest sub-sort rank.
4. **Timezone Uniformity**:
   - All comparisons are evaluated in **UTC**. The calendar day boundary for "Due Today" is evaluated against UTC midnight (`00:00:00Z` to `23:59:59.999Z`).

---

## 5. Composite Score Formula

To allow efficient sorting in database queries, array sort methods, and caching layers, each task can be assigned a single integer `priority_score`:

$$\text{TierBase} = (6 - \text{Tier}) \times 1000$$
$$\text{UrgencyBase} = \text{UrgencyWeight} \times 100$$
$$\text{TimeBonus} = \text{max}(0, 99 - \text{floor}(\text{HoursRemaining} / 2))$$
$$\text{Score} = \text{TierBase} + \text{UrgencyBase} + \text{TimeBonus}$$

Sorting in descending order of `priority_score` matches the desired business priority.

---

## 6. Algorithm Pseudocode

```python
from datetime import datetime, timezone, timedelta
from typing import List, Optional

def prioritize_tasks(tasks: List[CanonicalTask], evaluation_time: Optional[datetime] = None) -> List[CanonicalTask]:
    """
    Sorts tasks deterministically based on tier, urgency, and deadline.
    Uses injectable evaluation_time (defaults to datetime.now(timezone.utc)).
    """
    now = evaluation_time or datetime.now(timezone.utc)
    today_date = now.date()
    in_48h = now + timedelta(hours=48)

    urgency_weights = {
        "Urgent": 4,
        "High": 3,
        "Medium": 2,
        "Low": 1
    }

    def compute_sort_tuple(task: CanonicalTask):
        # Determine Tier (1 to 5)
        is_completed = (task.status == "Completed")
        deadline_dt = parse_iso_utc(task.deadline) if task.deadline else None

        if is_completed:
            tier = 5
        elif deadline_dt and deadline_dt < now:
            tier = 1  # Overdue
        elif deadline_dt and deadline_dt.date() == today_date:
            tier = 2  # Due Today
        elif deadline_dt and now < deadline_dt <= in_48h:
            tier = 3  # Due Within 48 Hours
        else:
            tier = 4  # Upcoming or no deadline

        # Sub-sort: Urgency weight (descending -> negative for ascending sort)
        urgency_weight = urgency_weights.get(task.urgency, 2)
        urgency_sort = -urgency_weight

        # Tie-breaker: Earliest deadline first
        # Use timestamp if present; use float('inf') for null deadline
        deadline_timestamp = deadline_dt.timestamp() if deadline_dt else float('inf')

        # Final tie-breaker: task ID
        return (tier, urgency_sort, deadline_timestamp, task.id)

    # In-place or stable sort using Python's Timsort
    return sorted(tasks, key=compute_sort_tuple)
```
