import os
import sys
from pathlib import Path
from typing import List

# Ensure project root is in sys.path
_current = Path(__file__).resolve().parent
_backend_dir = _current.parent.parent
_project_root = _backend_dir.parent
for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from dotenv import load_dotenv
    _env_paths = [
        _backend_dir / ".env",
        _project_root / "backend" / ".env",
        _project_root / ".env",
    ]
    for _ep in _env_paths:
        if _ep.exists():
            load_dotenv(_ep)
            break
    else:
        load_dotenv()
except ImportError:
    pass

class Settings:
    PROJECT_NAME: str = "Employee Task Dashboard API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    
    # Read comma-separated origins, with safe development defaults
    ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGIN",
            "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    # Source API base URLs for asynchronous HTTPX integration
    CRM_API_BASE_URL: str = os.getenv("CRM_API_BASE_URL", "http://127.0.0.1:8001")
    HELPDESK_API_BASE_URL: str = os.getenv("HELPDESK_API_BASE_URL", "http://127.0.0.1:8001")

    # Timeouts and business timezone
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "3.5"))
    BUSINESS_TIMEZONE: str = os.getenv("BUSINESS_TIMEZONE", "UTC")

settings = Settings()
