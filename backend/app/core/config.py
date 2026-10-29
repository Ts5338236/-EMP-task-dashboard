import os
import sys
import secrets
from pathlib import Path
from typing import List, Optional

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

    # Authentication & Session Security
    # In production, JWT_SECRET_KEY must be provided via environment variable
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "workflow-dev-secret-key-at-least-32-bytes-long-for-hs256-security"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))

    # Database Persistence
    DATABASE_PATH: str = os.getenv(
        "DATABASE_PATH",
        str(_backend_dir / "data" / "users.db")
    )

    # Initial Admin Provisioning
    INITIAL_ADMIN_EMAIL: str = os.getenv("INITIAL_ADMIN_EMAIL", "admin@workflow.local")
    INITIAL_ADMIN_USERNAME: str = os.getenv("INITIAL_ADMIN_USERNAME", "admin")
    INITIAL_ADMIN_PASSWORD: Optional[str] = os.getenv("INITIAL_ADMIN_PASSWORD", None)

    # Rate Limiting for Login Attempts
    RATE_LIMIT_LOGIN_MAX: int = int(os.getenv("RATE_LIMIT_LOGIN_MAX", "5"))
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_LOGIN_WINDOW_SECONDS", "300"))

settings = Settings()
