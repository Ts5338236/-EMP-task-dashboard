import os
from typing import List

class Settings:
    PROJECT_NAME: str = "Employee Task Dashboard API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
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
