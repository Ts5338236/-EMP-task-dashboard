from enum import Enum
from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict

class TaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class TaskUrgency(str, Enum):
    URGENT = "Urgent"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class TaskSource(str, Enum):
    CRM = "CRM"
    HELPDESK = "Helpdesk"

class PriorityCategory(str, Enum):
    OVERDUE = "Overdue"
    DUE_TODAY = "Due Today"
    DUE_SOON = "Due Soon"
    UPCOMING = "Upcoming"
    COMPLETED = "Completed"

class TaskSchema(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "101",
                "title": "Follow up with customer on enterprise contract renewal (Apex Global)",
                "description": "Discuss seat expansion for 150 additional users and confirm annual terms.",
                "employee": "Tushar Gupta",
                "status": "Pending",
                "deadline": "2026-10-28T14:00:00Z",
                "urgency": "Urgent",
                "source": "CRM",
                "url": "/mock/crm/101",
                "priority_category": "Overdue",
                "priority_rank": 0,
                "is_overdue": True,
                "hours_until_deadline": -22.5
            }
        }
    )

    id: str = Field(..., min_length=1, description="Source task identifier")
    title: str = Field(..., min_length=1, max_length=255, description="Descriptive task title")
    description: str = Field(default="", description="Detailed task context, notes, or customer message")
    employee: str = Field(..., min_length=1, description="Assigned employee name")
    status: TaskStatus = Field(..., description="Task lifecycle status (Pending, In Progress, Completed)")
    deadline: Optional[str] = Field(None, description="ISO 8601 UTC timestamp string or null")
    urgency: TaskUrgency = Field(..., description="Urgency priority (Urgent, High, Medium, Low)")
    source: TaskSource = Field(..., description="Originating system (CRM or Helpdesk)")
    url: str = Field(..., min_length=1, description="Deep link URL to the source task detail page")

    # Step 5 Derived Priority Metadata (optional for base source, enriched by prioritizer)
    priority_category: Optional[PriorityCategory] = Field(None, description="Computed 5-tier priority category")
    priority_rank: Optional[int] = Field(None, ge=0, le=4, description="Numeric rank: 0=Overdue, 1=Due Today, 2=Due Soon, 3=Upcoming, 4=Completed")
    is_overdue: Optional[bool] = Field(None, description="True if deadline has elapsed and status != Completed")
    hours_until_deadline: Optional[float] = Field(None, description="Signed floating-point hours remaining until deadline, or null")

    @field_validator("deadline")
    @classmethod
    def validate_deadline_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        try:
            clean_str = v.replace("Z", "+00:00")
            datetime.fromisoformat(clean_str)
            return v
        except ValueError:
            raise ValueError(f"Deadline '{v}' must be a valid ISO 8601 datetime string or null")

class SourceStatus(BaseModel):
    status: str = Field(..., description="'success' | 'unavailable' | 'error'")
    task_count: int = Field(default=0, ge=0)

class UnifiedTasksResponse(BaseModel):
    tasks: List[TaskSchema] = Field(default_factory=list, description="Consolidated list of prioritized tasks")
    sources: Dict[str, SourceStatus] = Field(default_factory=dict, description="Status breakdown of upstream systems")
    warnings: List[str] = Field(default_factory=list, description="Non-fatal warnings regarding source availability")
    total: int = Field(..., ge=0, description="Total number of tasks returned matching filter criteria")
