from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.task import TaskSchema
from backend.app.mock_data.crm_data import get_crm_tasks, get_crm_task_by_id

router = APIRouter(prefix="/api/crm", tags=["CRM Tasks"])

@router.get("/tasks", response_model=List[TaskSchema], summary="Fetch all CRM tasks")
async def list_crm_tasks() -> List[TaskSchema]:
    """
    Retrieve all operational tasks from the mock CRM system.
    Returns a deterministic list of validated CRM work items.
    """
    raw_tasks = get_crm_tasks()
    return [TaskSchema(**task) for task in raw_tasks]

@router.get("/tasks/{task_id}", response_model=TaskSchema, summary="Get single CRM task by ID")
async def get_crm_task(task_id: str) -> TaskSchema:
    """
    Retrieve a single task from the mock CRM system by its ID.
    Raises 404 if the task is not found.
    """
    task = get_crm_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CRM task with ID '{task_id}' not found"
        )
    return TaskSchema(**task)
