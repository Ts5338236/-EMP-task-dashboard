from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from starlette import status as http_status

from backend.app.schemas.task import UnifiedTasksResponse
from backend.app.services.source_client import fetch_all_sources_concurrently
from backend.app.services.task_normalizer import merge_and_deduplicate_tasks
from backend.app.services.task_filtering import filter_tasks
from backend.app.services.task_prioritization import prioritize_tasks
from backend.app.core.config import settings

router = APIRouter(prefix="/api", tags=["Tasks Aggregator"])

@router.get(
    "/tasks",
    response_model=UnifiedTasksResponse,
    summary="Unified and prioritized task feed",
    response_description="Consolidated tasks from CRM and Helpdesk ranked by deadline and urgency."
)
async def get_unified_tasks(
    employee: Optional[str] = Query(None, description="Filter by employee name (case-insensitive substring)"),
    status: Optional[str] = Query(None, description="Filter by status: 'Pending', 'In Progress', or 'Completed'"),
    search: Optional[str] = Query(None, description="Search keyword across title, id, description, and employee"),
    simulate_crm_error: bool = Query(False, description="Simulate CRM upstream failure for fault-tolerance verification"),
    simulate_helpdesk_error: bool = Query(False, description="Simulate Helpdesk upstream failure for fault-tolerance verification")
) -> UnifiedTasksResponse:
    """
    Fetches tasks concurrently from both CRM and Helpdesk REST endpoints,
    normalizes their data schemas, merges unique identities, filters, and ranks them
    using the 5-tier deterministic prioritization engine.
    """
    # 1. Concurrently fetch both sources
    raw_merged, sources_status, warnings = await fetch_all_sources_concurrently(
        simulate_crm_error=simulate_crm_error,
        simulate_helpdesk_error=simulate_helpdesk_error
    )

    # 2. Total failure check: if both sources are unavailable/errored, raise 502
    crm_ok = sources_status.get("crm", {}).get("status") == "success"
    hd_ok = sources_status.get("helpdesk", {}).get("status") == "success"

    if not crm_ok and not hd_ok:
        raise HTTPException(
            status_code=http_status.HTTP_502_BAD_GATEWAY,
            detail="Both CRM and Helpdesk upstream source APIs failed to respond. Service temporarily unavailable."
        )

    # 3. Deduplicate by (source, id)
    deduped = merge_and_deduplicate_tasks([raw_merged])

    # 4. Apply Prioritization Engine to compute priority tiers, rank, and overdue flags
    prioritized = prioritize_tasks(
        tasks=deduped,
        evaluation_time=None,  # Evaluates against current UTC time
        business_timezone_str=settings.BUSINESS_TIMEZONE
    )

    # 5. Apply filtering (validates status and raises 422 if unsupported)
    filtered = filter_tasks(
        tasks=prioritized,
        employee=employee,
        status_filter=status,
        search=search
    )

    return UnifiedTasksResponse(
        tasks=filtered,
        sources=sources_status,
        warnings=warnings,
        total=len(filtered)
    )
