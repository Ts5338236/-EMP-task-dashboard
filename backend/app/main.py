import sys
from pathlib import Path

# Add project root and backend dir so imports work from any working directory
_app_dir = Path(__file__).resolve().parent
_backend_dir = _app_dir.parent
_project_root = _backend_dir.parent

for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Employee Task Dashboard aggregating CRM and Helpdesk mock feeds.",
)

# Configure CORS Middleware for safe local and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

from backend.app.api.crm import router as crm_router
from backend.app.api.helpdesk import router as helpdesk_router
from backend.app.api.mock_detail import router as mock_detail_router
from backend.app.api.tasks import router as tasks_router

# Mount REST API routers
app.include_router(tasks_router)
app.include_router(crm_router)
app.include_router(helpdesk_router)
app.include_router(mock_detail_router)

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check probe confirming API liveness and readiness.
    """
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development")
    )
