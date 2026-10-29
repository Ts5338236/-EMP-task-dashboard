import time
from typing import Dict, List
from collections import defaultdict
from backend.app.core.config import settings

class LoginRateLimiter:
    """
    In-memory sliding-window rate limiter for failed login attempts.
    Tracks failed attempts by client IP and identifier.
    """
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._failures: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        # Clean older entries
        self._failures[key] = [t for t in self._failures[key] if t > cutoff]
        return len(self._failures[key]) >= self.max_attempts

    def record_failure(self, key: str) -> None:
        self._failures[key].append(time.time())

    def record_success(self, key: str) -> None:
        if key in self._failures:
            del self._failures[key]

    def reset(self) -> None:
        self._failures.clear()

login_rate_limiter = LoginRateLimiter(
    max_attempts=settings.RATE_LIMIT_LOGIN_MAX,
    window_seconds=settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS
)
