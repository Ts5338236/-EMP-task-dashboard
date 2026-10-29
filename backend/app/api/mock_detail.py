from typing import Optional
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import HTMLResponse, JSONResponse
from backend.app.schemas.task import TaskSchema
from backend.app.mock_data.crm_data import get_crm_task_by_id
from backend.app.mock_data.helpdesk_data import get_helpdesk_task_by_id

router = APIRouter(tags=["Mock Source Detail Pages"])

def render_html_viewer(task: TaskSchema, system_name: str, brand_color: str) -> str:
    urgency_colors = {
        "Urgent": "background:#fee2e2;color:#991b1b;border:1px solid #f87171;",
        "High": "background:#ffedd5;color:#9a3412;border:1px solid #fb923c;",
        "Medium": "background:#fef9c3;color:#854d0e;border:1px solid #facc15;",
        "Low": "background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;",
    }
    status_colors = {
        "Pending": "background:#fef3c7;color:#92400e;border:1px solid #fcd34d;",
        "In Progress": "background:#e0e7ff;color:#3730a3;border:1px solid #818cf8;",
        "Completed": "background:#dcfce7;color:#166534;border:1px solid #86efac;",
    }

    urgency_style = urgency_colors.get(task.urgency.value, "background:#f1f5f9;color:#334155;")
    status_style = status_colors.get(task.status.value, "background:#f1f5f9;color:#334155;")
    deadline_display = task.deadline if task.deadline else "No deadline specified"

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{system_name} - {task.title}</title>
  <style>
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      padding: 2rem 1rem;
    }}
    .container {{
      max-width: 720px;
      margin: 0 auto;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      padding: 1.5rem;
      background: #0f172a;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .badge {{
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .content {{
      padding: 2rem 1.5rem;
    }}
    h1 {{
      font-size: 1.5rem;
      margin-top: 0;
      margin-bottom: 1rem;
      line-height: 1.3;
    }}
    .desc {{
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
      border-top: 1px solid #334155;
      padding-top: 1.5rem;
    }}
    .field {{
      background: #0f172a;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #1e293b;
    }}
    .label {{
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
      font-weight: 600;
    }}
    .val {{
      font-size: 0.9rem;
      font-weight: 500;
      color: #f1f5f9;
      word-break: break-all;
    }}
    .footer {{
      padding: 1rem 1.5rem;
      background: #0f172a;
      border-top: 1px solid #334155;
      font-size: 0.8rem;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    a.back-btn {{
      color: #38bdf8;
      text-decoration: none;
      font-weight: 500;
    }}
    a.back-btn:hover {{
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <span class="badge" style="background:{brand_color}22;color:{brand_color};border:1px solid {brand_color}44;">
          {system_name} Service
        </span>
        <span style="font-size:0.85rem;color:#64748b;font-family:monospace;">ID: {task.id}</span>
      </div>
      <div>
        <span class="badge" style="{status_style}">{task.status.value}</span>
      </div>
    </div>
    <div class="content">
      <h1>{task.title}</h1>
      <p class="desc">{task.description}</p>
      
      <div class="grid">
        <div class="field">
          <div class="label">Assigned Representative</div>
          <div class="val">{task.employee}</div>
        </div>
        <div class="field">
          <div class="label">Urgency Priority</div>
          <div class="val"><span class="badge" style="{urgency_style}">{task.urgency.value}</span></div>
        </div>
        <div class="field">
          <div class="label">SLA Deadline (UTC)</div>
          <div class="val" style="font-family:monospace;">{deadline_display}</div>
        </div>
        <div class="field">
          <div class="label">Source System</div>
          <div class="val">{task.source.value} API</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <span>Simulated Source Application Detail View</span>
      <a href="javascript:window.close()" class="back-btn">&larr; Close Window</a>
    </div>
  </div>
</body>
</html>"""

@router.get("/mock/crm/{task_id}", summary="Mock CRM Task Detail Viewer")
@router.get("/api/mock/crm/{task_id}", include_in_schema=False)
async def mock_crm_detail(task_id: str, request: Request):
    """
    Simulated CRM task record viewer. Returns HTML for browser navigation,
    or JSON when requested via Accept header.
    """
    raw_task = get_crm_task_by_id(task_id)
    if not raw_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CRM task with ID '{task_id}' not found in mock database"
        )
    task = TaskSchema(**raw_task)
    
    # Return JSON if requested via header or query
    accept_header = request.headers.get("accept", "")
    if "application/json" in accept_header or request.query_params.get("format") == "json":
        return JSONResponse(content=task.model_dump())

    return HTMLResponse(content=render_html_viewer(task, "Enterprise CRM", "#a855f7"))

@router.get("/mock/helpdesk/{task_id}", summary="Mock Helpdesk Ticket Detail Viewer")
@router.get("/api/mock/helpdesk/{task_id}", include_in_schema=False)
async def mock_helpdesk_detail(task_id: str, request: Request):
    """
    Simulated Helpdesk ticket record viewer. Returns HTML for browser navigation,
    or JSON when requested via Accept header.
    """
    raw_task = get_helpdesk_task_by_id(task_id)
    if not raw_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Helpdesk task with ID '{task_id}' not found in mock database"
        )
    task = TaskSchema(**raw_task)

    accept_header = request.headers.get("accept", "")
    if "application/json" in accept_header or request.query_params.get("format") == "json":
        return JSONResponse(content=task.model_dump())

    return HTMLResponse(content=render_html_viewer(task, "IT Helpdesk", "#3b82f6"))
