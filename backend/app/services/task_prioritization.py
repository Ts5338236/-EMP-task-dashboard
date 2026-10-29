from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple
import zoneinfo

from backend.app.schemas.task import (
    TaskSchema, 
    TaskStatus, 
    TaskUrgency, 
    PriorityCategory
)

# Urgency sorting rank mapping: Urgent (0) > High (1) > Medium (2) > Low (3)
URGENCY_RANK = {
    TaskUrgency.URGENT: 0,
    TaskUrgency.HIGH: 1,
    TaskUrgency.MEDIUM: 2,
    TaskUrgency.LOW: 3,
}

def parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """
    Parses an ISO 8601 string into a timezone-aware UTC datetime.
    Handles 'Z' suffixes and offset strings. Returns None for empty/null input.
    """
    if not dt_str:
        return None
    try:
        clean = dt_str.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None

def classify_and_enrich_task(
    task: TaskSchema,
    now: datetime,
    business_tz: zoneinfo.ZoneInfo
) -> Tuple[TaskSchema, int, int, int, float, str, str]:
    """
    Classifies a task into a priority tier and returns an enriched copy along with
    a 6-element deterministic sort key:
    (category_rank, urgency_rank, deadline_present_rank, deadline_timestamp, source, id)
    """
    deadline_dt = parse_iso_datetime(task.deadline)
    now_in_tz = now.astimezone(business_tz)
    in_48h = now + timedelta(hours=48)

    hours_remaining: Optional[float] = None
    if deadline_dt:
        diff_seconds = (deadline_dt - now).total_seconds()
        hours_remaining = round(diff_seconds / 3600.0, 1)

    is_completed = (task.status == TaskStatus.COMPLETED)

    # 1. Determine Category & Rank
    if is_completed:
        category = PriorityCategory.COMPLETED
        category_rank = 4
        is_overdue = False
    elif deadline_dt and deadline_dt < now:
        category = PriorityCategory.OVERDUE
        category_rank = 0
        is_overdue = True
    elif deadline_dt and deadline_dt >= now and deadline_dt.astimezone(business_tz).date() == now_in_tz.date():
        category = PriorityCategory.DUE_TODAY
        category_rank = 1
        is_overdue = False
    elif deadline_dt and now < deadline_dt <= in_48h:
        category = PriorityCategory.DUE_SOON
        category_rank = 2
        is_overdue = False
    else:
        category = PriorityCategory.UPCOMING
        category_rank = 3
        is_overdue = False

    # 2. Urgency Rank
    urgency_rank = URGENCY_RANK.get(task.urgency, 2)

    # 3. Deadline sort handling:
    # Tasks with concrete deadlines (0) rank before tasks without deadlines (1) within the category
    deadline_present_rank = 0 if deadline_dt is not None else 1
    deadline_ts = deadline_dt.timestamp() if deadline_dt is not None else float("inf")

    # Create enriched task copy
    enriched = task.model_copy(
        update={
            "priority_category": category,
            "priority_rank": category_rank,
            "is_overdue": is_overdue,
            "hours_until_deadline": hours_remaining
        }
    )

    sort_key = (
        category_rank,
        urgency_rank,
        deadline_present_rank,
        deadline_ts,
        enriched.source.value,
        enriched.id
    )

    return enriched, sort_key

def prioritize_tasks(
    tasks: List[TaskSchema],
    evaluation_time: Optional[datetime] = None,
    business_timezone_str: str = "UTC"
) -> List[TaskSchema]:
    """
    Ranks tasks using a deterministic 5-tier classification engine:
      Tier 0: Overdue (incomplete & deadline < now)
      Tier 1: Due Today (incomplete & deadline on current business calendar day)
      Tier 2: Due Soon (incomplete & deadline within next 48 hours)
      Tier 3: Upcoming (incomplete & deadline > 48h, or missing deadline)
      Tier 4: Completed (all completed tasks, never overdue)
    
    Sub-sorting:
      1. Urgency: Urgent (0) > High (1) > Medium (2) > Low (3)
      2. Earliest deadline timestamp first (null deadlines sort to end)
      3. Tie-breaker: (source, id) for 100% determinism.
    """
    now = evaluation_time
    if now is None:
        now = datetime.now(timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    else:
        now = now.astimezone(timezone.utc)

    try:
        b_tz = zoneinfo.ZoneInfo(business_timezone_str)
    except Exception:
        b_tz = zoneinfo.ZoneInfo("UTC")

    classified_items = [
        classify_and_enrich_task(task, now, b_tz)
        for task in tasks
    ]

    # Sort using Timsort (stable O(n log n))
    classified_items.sort(key=lambda item: item[1])

    return [item[0] for item in classified_items]
