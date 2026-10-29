from typing import Optional, List, Dict, Any, Callable
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from backend.app.core.security import decode_access_token
from backend.app.db.user_repository import get_user_by_id

# Optional HTTPBearer to allow both header and cookie extraction
_bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme)
) -> Dict[str, Any]:
    """
    Extracts, validates JWT access token from Authorization header or HttpOnly cookie,
    and performs real-time server-side database lookup to guarantee active status and roles.
    """
    token: Optional[str] = None

    # 1. Prefer Authorization Bearer header
    if auth_credentials and auth_credentials.credentials:
        token = auth_credentials.credentials
    else:
        # 2. Fall back to secure HttpOnly cookie
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Clean bearer prefix if present
    if token.startswith("Bearer "):
        token = token[7:].strip()

    # Decode and validate signature, expiry, and claims
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Real-time server-side lookup (immediate role change & deactivation propagation)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact an administrator.",
        )

    return user

async def require_authenticated_user(
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    return user

def require_roles(*allowed_roles: str) -> Callable:
    """
    Dependency factory verifying that the authenticated user possesses one of the allowed roles.
    """
    async def _role_checker(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return _role_checker

require_admin = require_roles("ADMIN")
require_manager_or_admin = require_roles("ADMIN", "MANAGER")

