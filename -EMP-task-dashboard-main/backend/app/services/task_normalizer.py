from typing import List, Dict, Any, Set, Tuple
from backend.app.schemas.task import TaskSchema, TaskSource, TaskStatus, TaskUrgency

def normalize_task_dict(raw: Dict[str, Any], default_source: TaskSource) -> TaskSchema:
    """
    Normalizes a dictionary from an external or mock API into a validated TaskSchema.
    Handles field name variations (e.g. 'assigned_to' -> 'employee', 'ticket_id' -> 'id').
    """
    # ID resolution
    task_id = str(raw.get("id") or raw.get("crm_id") or raw.get("ticket_key") or raw.get("ticket_id") or "").strip()
    if not task_id:
        raise ValueError("Missing task identifier in record")

    # Title resolution
    title = str(raw.get("title") or raw.get("action_item") or raw.get("subject") or "").strip()
    account = raw.get("account_name")
    if account and account not in title:
        title = f"{title} ({account})"
    if not title:
        title = f"Untitled Task {task_id}"

    # Description
    description = str(raw.get("description") or raw.get("notes") or "").strip()

    # Employee
    employee = str(raw.get("employee") or raw.get("assigned_rep") or raw.get("assigned_to") or raw.get("owner") or "Unassigned").strip()

    # Status normalization
    raw_status = str(raw.get("status") or raw.get("state") or raw.get("ticket_status") or "Pending").strip()
    status_lower = raw_status.lower().replace("_", " ")
    if status_lower in ["pending", "open", "new", "created", "escalated"]:
        status = TaskStatus.PENDING
    elif status_lower in ["in progress", "active", "working", "investigating"]:
        status = TaskStatus.IN_PROGRESS
    elif status_lower in ["completed", "closed", "resolved", "won", "done"]:
        status = TaskStatus.COMPLETED
    else:
        # Check standard enum
        try:
            status = TaskStatus(raw_status)
        except ValueError:
            status = TaskStatus.PENDING

    # Urgency normalization
    raw_urgency = str(raw.get("urgency") or raw.get("deal_priority") or raw.get("severity") or "Medium").strip()
    urgency_lower = raw_urgency.lower()
    if urgency_lower in ["urgent", "p1", "critical", "blocker"]:
        urgency = TaskUrgency.URGENT
    elif urgency_lower in ["high", "p2", "major"]:
        urgency = TaskUrgency.HIGH
    elif urgency_lower in ["medium", "p3", "minor"]:
        urgency = TaskUrgency.MEDIUM
    elif urgency_lower in ["low", "p4", "trivial"]:
        urgency = TaskUrgency.LOW
    else:
        try:
            urgency = TaskUrgency(raw_urgency)
        except ValueError:
            urgency = TaskUrgency.MEDIUM

    # Source
    raw_source = str(raw.get("source") or default_source.value).strip()
    if raw_source.upper() == "CRM":
        source = TaskSource.CRM
    elif raw_source.upper() in ["HELPDESK", "HELP_DESK", "HD"]:
        source = TaskSource.HELPDESK
    else:
        source = default_source

    # Deadline
    deadline = raw.get("deadline") or raw.get("due_date") or raw.get("sla_deadline")
    if deadline:
        deadline = str(deadline).strip()
        if not deadline:
            deadline = None

    # URL deep link
    url = str(raw.get("url") or raw.get("crm_deep_link") or raw.get("portal_url") or "").strip()
    if not url:
        if source == TaskSource.CRM:
            url = f"/mock/crm/{task_id}"
        else:
            url = f"/mock/helpdesk/{task_id}"

    return TaskSchema(
        id=task_id,
        title=title,
        description=description,
        employee=employee,
        status=status,
        deadline=deadline,
        urgency=urgency,
        source=source,
        url=url
    )

def merge_and_deduplicate_tasks(task_lists: List[List[TaskSchema]]) -> List[TaskSchema]:
    """
    Merges task collections while strictly deduplicating by source-qualified identity (source, id).
    Identical IDs from different sources (e.g. CRM 101 and Helpdesk 101) are preserved as distinct.
    """
    seen: Set[Tuple[TaskSource, str]] = set()
    merged: List[TaskSchema] = []

    for tasks in task_lists:
        for task in tasks:
            key = (task.source, task.id)
            if key not in seen:
                seen.add(key)
                merged.append(task)

    return merged
