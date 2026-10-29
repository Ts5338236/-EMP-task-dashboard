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
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8001, reload=True)
