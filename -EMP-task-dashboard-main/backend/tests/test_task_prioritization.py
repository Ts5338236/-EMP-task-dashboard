from datetime import datetime, timezone
import pytest
from backend.app.schemas.task import (
    TaskSchema, 
    TaskStatus, 
    TaskUrgency, 
    TaskSource, 
    PriorityCategory
)
from backend.app.services.task_prioritization import prioritize_tasks

# Fixed reference time matching Step 5 specification
FIXED_NOW = datetime(2026, 10, 29, 12, 0, 0, tzinfo=timezone.utc)

def make_task(
    id: str,
    title: str,
    status: TaskStatus,
    urgency: TaskUrgency,
    deadline: str | None,
    source: TaskSource = TaskSource.CRM,
    employee: str = "Test Employee"
) -> TaskSchema:
    return TaskSchema(
        id=id,
        title=title,
        description="Test task description",
        employee=employee,
        status=status,
        deadline=deadline,
        urgency=urgency,
        source=source,
        url=f"/mock/{source.value.lower()}/{id}"
    )

def test_five_priority_categories_scenario_a_to_e():
    """
    Verifies the canonical 5-task benchmark defined in Step 5 Prompt Section 11:
      Task A: Overdue (2026-10-28T10:00:00Z, Urgent, Pending)
      Task B: Due Today (2026-10-29T18:00:00Z, High, Pending)
      Task C: Due Soon (2026-10-30T15:00:00Z, Medium, In Progress)
      Task D: Upcoming (2026-11-05T12:00:00Z, Low, Pending)
      Task E: Completed (2026-10-25T12:00:00Z, Urgent, Completed)
    """
    task_a = make_task("A", "Resolve urgent login issue", TaskStatus.PENDING, TaskUrgency.URGENT, "2026-10-28T10:00:00Z")
    task_b = make_task("B", "Follow up with customer", TaskStatus.PENDING, TaskUrgency.HIGH, "2026-10-29T18:00:00Z")
    task_c = make_task("C", "Update sales records", TaskStatus.IN_PROGRESS, TaskUrgency.MEDIUM, "2026-10-30T15:00:00Z")
    task_d = make_task("D", "Prepare monthly report", TaskStatus.PENDING, TaskUrgency.LOW, "2026-11-05T12:00:00Z")
    task_e = make_task("E", "Resolve completed support ticket", TaskStatus.COMPLETED, TaskUrgency.URGENT, "2026-10-25T12:00:00Z")

    # Pass in shuffled order
    shuffled = [task_e, task_c, task_a, task_d, task_b]
    sorted_tasks = prioritize_tasks(shuffled, evaluation_time=FIXED_NOW)

    assert [t.id for t in sorted_tasks] == ["A", "B", "C", "D", "E"]
    assert sorted_tasks[0].priority_category == PriorityCategory.OVERDUE
    assert sorted_tasks[0].priority_rank == 0
    assert sorted_tasks[0].is_overdue is True

    assert sorted_tasks[1].priority_category == PriorityCategory.DUE_TODAY
    assert sorted_tasks[1].priority_rank == 1
    assert sorted_tasks[1].is_overdue is False

    assert sorted_tasks[2].priority_category == PriorityCategory.DUE_SOON
    assert sorted_tasks[2].priority_rank == 2

    assert sorted_tasks[3].priority_category == PriorityCategory.UPCOMING
    assert sorted_tasks[3].priority_rank == 3

    assert sorted_tasks[4].priority_category == PriorityCategory.COMPLETED
    assert sorted_tasks[4].priority_rank == 4
    assert sorted_tasks[4].is_overdue is False  # Never overdue when completed!

def test_urgency_ordering_within_same_category():
    t_low = make_task("L", "Low", TaskStatus.PENDING, TaskUrgency.LOW, "2026-10-29T18:00:00Z")
    t_med = make_task("M", "Med", TaskStatus.PENDING, TaskUrgency.MEDIUM, "2026-10-29T18:00:00Z")
    t_high = make_task("H", "High", TaskStatus.PENDING, TaskUrgency.HIGH, "2026-10-29T18:00:00Z")
    t_urg = make_task("U", "Urgent", TaskStatus.PENDING, TaskUrgency.URGENT, "2026-10-29T18:00:00Z")

    sorted_tasks = prioritize_tasks([t_low, t_med, t_high, t_urg], evaluation_time=FIXED_NOW)
    assert [t.id for t in sorted_tasks] == ["U", "H", "M", "L"]

def test_earliest_deadline_breaks_urgency_ties():
    t_early = make_task("1", "Early", TaskStatus.PENDING, TaskUrgency.HIGH, "2026-10-29T14:00:00Z")
    t_late = make_task("2", "Late", TaskStatus.PENDING, TaskUrgency.HIGH, "2026-10-29T20:00:00Z")

    sorted_tasks = prioritize_tasks([t_late, t_early], evaluation_time=FIXED_NOW)
    assert sorted_tasks[0].id == "1"
    assert sorted_tasks[1].id == "2"

def test_deterministic_tie_breaker_by_source_and_id():
    t_crm = make_task("100", "Same", TaskStatus.PENDING, TaskUrgency.HIGH, "2026-10-29T14:00:00Z", source=TaskSource.CRM)
    t_hd = make_task("100", "Same", TaskStatus.PENDING, TaskUrgency.HIGH, "2026-10-29T14:00:00Z", source=TaskSource.HELPDESK)

    # CRM comes alphabetically before Helpdesk
    res = prioritize_tasks([t_hd, t_crm], evaluation_time=FIXED_NOW)
    assert res[0].source == TaskSource.CRM
    assert res[1].source == TaskSource.HELPDESK

def test_completed_task_with_past_deadline_is_never_overdue():
    t_done = make_task("D", "Done Past", TaskStatus.COMPLETED, TaskUrgency.URGENT, "2026-10-20T10:00:00Z")
    res = prioritize_tasks([t_done], evaluation_time=FIXED_NOW)
    assert res[0].priority_category == PriorityCategory.COMPLETED
    assert res[0].is_overdue is False
    assert res[0].priority_rank == 4

def test_missing_deadlines_handled_safely():
    t_with_dl = make_task("1", "Has DL", TaskStatus.PENDING, TaskUrgency.LOW, "2026-11-10T12:00:00Z")
    t_no_dl = make_task("2", "No DL", TaskStatus.PENDING, TaskUrgency.LOW, None)

    res = prioritize_tasks([t_no_dl, t_with_dl], evaluation_time=FIXED_NOW)
    # Tasks with concrete deadlines rank before tasks without deadlines
    assert res[0].id == "1"
    assert res[1].id == "2"
    assert res[1].hours_until_deadline is None

def test_boundary_exact_now_is_due_today():
    # Exactly at now -> deadline == now -> Due Today
    t_now = make_task("NOW", "Due right now", TaskStatus.PENDING, TaskUrgency.MEDIUM, "2026-10-29T12:00:00Z")
    res = prioritize_tasks([t_now], evaluation_time=FIXED_NOW)
    assert res[0].priority_category == PriorityCategory.DUE_TODAY
    assert res[0].is_overdue is False

def test_boundary_exact_48h():
    # now is 2026-10-29T12:00:00Z -> 48h later is 2026-10-31T12:00:00Z
    t_48h = make_task("48H", "Exactly 48h", TaskStatus.PENDING, TaskUrgency.HIGH, "2026-10-31T12:00:00Z")
    res = prioritize_tasks([t_48h], evaluation_time=FIXED_NOW)
    assert res[0].priority_category == PriorityCategory.DUE_SOON

    # 48h + 1 second -> Upcoming
    t_49h = make_task("49H", "Beyond 48h", TaskStatus.PENDING, TaskUrgency.HIGH, "2026-10-31T12:00:01Z")
    res2 = prioritize_tasks([t_49h], evaluation_time=FIXED_NOW)
    assert res2[0].priority_category == PriorityCategory.UPCOMING

def test_input_immutability():
    original = [make_task("1", "T", TaskStatus.PENDING, TaskUrgency.LOW, None)]
    copy_orig = list(original)
    _ = prioritize_tasks(original, evaluation_time=FIXED_NOW)
    assert len(original) == len(copy_orig)
    assert original[0].priority_category is None  # Input was not modified in-place

def test_performance_1000_tasks():
    import time
    tasks = [
        make_task(str(i), f"Task {i}", TaskStatus.PENDING, TaskUrgency.MEDIUM, f"2026-10-{(25 + (i % 6)):02d}T12:00:00Z")
        for i in range(1000)
    ]
    t0 = time.perf_counter()
    res = prioritize_tasks(tasks, evaluation_time=FIXED_NOW)
    duration = time.perf_counter() - t0
    assert len(res) == 1000
    assert duration < 0.25  # Should process 1,000 tasks in well under 250ms
