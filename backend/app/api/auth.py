from fastapi import APIRouter, HTTPException, Depends, Response, Request, status
from backend.app.schemas.user import LoginRequest, TokenResponse, UserResponse
from backend.app.db.user_repository import get_user_by_username_or_email
from backend.app.core.security import verify_password, create_access_token
from backend.app.core.dependencies import get_current_user
from backend.app.core.rate_limit import login_rate_limiter
from backend.app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and issue access token",
    responses={
        200: {"description": "Authentication successful"},
        401: {"description": "Invalid credentials"},
        403: {"description": "Account deactivated"},
        429: {"description": "Too many failed attempts"},
    }
)
async def login(
    login_data: LoginRequest,
    request: Request,
    response: Response
) -> TokenResponse:
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}:{login_data.identifier.strip().lower()}"

    # 1. Rate limiting check
    if login_rate_limiter.is_rate_limited(rate_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please wait a few minutes before trying again."
        )

    # 2. Lookup user by username or email
    user = get_user_by_username_or_email(login_data.identifier)
    if not user:
        login_rate_limiter.record_failure(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Constant-time password verification with Argon2id
    if not verify_password(user["password_hash"], login_data.password):
        login_rate_limiter.record_failure(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Check active status
    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact an administrator."
        )

    # 5. Success: clear failed rate limiting counter
    login_rate_limiter.record_success(rate_key)

    # 6. Generate JWT access token
    token, expires_in = create_access_token(
        user_id=user["id"],
        username=user["username"],
        role=user["role"]
    )

    # 7. Set secure HttpOnly cookie for session resilience across browser refreshes
    is_prod = (settings.ENVIRONMENT == "production")
    response.set_cookie(
        key="access_token",
        value=token,
        max_age=expires_in,
        httponly=True,
        samesite="lax",
        secure=is_prod,
        path="/"
    )

    safe_user = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        employee_name=user.get("employee_name"),
        is_active=bool(user.get("is_active")),
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        user=safe_user
    )

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile"
)
async def get_me(
    current_user: dict = Depends(get_current_user)
) -> UserResponse:
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        role=current_user["role"],
        employee_name=current_user.get("employee_name"),
        is_active=bool(current_user.get("is_active")),
        created_at=current_user["created_at"],
        updated_at=current_user["updated_at"]
    )

@router.post(
    "/logout",
    summary="Logout user and clear session cookies"
)
async def logout(response: Response):
    is_prod = (settings.ENVIRONMENT == "production")
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="lax",
        secure=is_prod
    )
    return {"detail": "Logged out successfully"}

@router.post(
    "/register",
    summary="Registration endpoint (disabled for security)"
)
async def register():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public self-registration is disabled. Accounts must be provisioned by an administrator."
    )

