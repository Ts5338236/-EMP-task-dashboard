from typing import List, Optional
from fastapi import HTTPException, status
from backend.app.schemas.task import TaskSchema, TaskStatus

VALID_STATUSES = {s.value.lower(): s.value for s in TaskStatus}

def filter_tasks(
    tasks: List[TaskSchema],
    employee: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
) -> List[TaskSchema]:
    """
    Applies employee, status, and search filters to a task collection.
    Validates status parameter and raises HTTP 422 if unsupported.
    """
    result = list(tasks)

    # 1. Status Filter Validation & Application
    if status_filter:
        cleaned_status = status_filter.strip()
        if cleaned_status:
            status_key = cleaned_status.lower()
            if status_key not in VALID_STATUSES:
                allowed = ", ".join(f"'{s.value}'" for s in TaskStatus)
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid status '{cleaned_status}'. Supported statuses are: {allowed}"
                )
            target_status = VALID_STATUSES[status_key]
            result = [t for t in result if t.status.value == target_status]

    # 2. Employee Filter Application (case-insensitive, whitespace-trimmed)
    if employee:
        cleaned_employee = employee.strip().lower()
        if cleaned_employee:
            result = [t for t in result if cleaned_employee in t.employee.lower()]

    # 3. Search Filter Application (across title, id, description, employee, source, urgency, priority)
    if search:
        query = search.strip().lower()
        if query:
            result = [
                t for t in result
                if query in t.title.lower()
                or query in t.id.lower()
                or query in t.description.lower()
                or query in t.employee.lower()
                or query in t.source.value.lower()
                or query in t.urgency.value.lower()
                or (t.priority_category and query in t.priority_category.lower())
                or (query == "overdue" and getattr(t, "is_overdue", False))
            ]

    return result
