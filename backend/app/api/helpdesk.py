from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.task import TaskSchema
from backend.app.mock_data.helpdesk_data import get_helpdesk_tasks, get_helpdesk_task_by_id

router = APIRouter(prefix="/api/helpdesk", tags=["Helpdesk Tasks"])

@router.get("/tasks", response_model=List[TaskSchema], summary="Fetch all Helpdesk tickets")
async def list_helpdesk_tasks() -> List[TaskSchema]:
    """
    Retrieve all support and incident tickets from the mock Helpdesk system.
    Returns a deterministic list of validated Helpdesk work items.
    """
    raw_tasks = get_helpdesk_tasks()
    return [TaskSchema(**task) for task in raw_tasks]

@router.get("/tasks/{task_id}", response_model=TaskSchema, summary="Get single Helpdesk task by ID")
async def get_helpdesk_task(task_id: str) -> TaskSchema:
    """
    Retrieve a single ticket from the mock Helpdesk system by its ID.
    Raises 404 if the ticket is not found.
    """
    task = get_helpdesk_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Helpdesk task with ID '{task_id}' not found"
        )
    return TaskSchema(**task)
