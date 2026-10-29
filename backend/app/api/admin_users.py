from typing import List
from fastapi import APIRouter, HTTPException, Depends, status

from backend.app.schemas.user import UserCreate, UserUpdate, UserResponse
from backend.app.core.dependencies import require_admin
from backend.app.core.security import hash_password
from backend.app.db.user_repository import (
    get_all_users,
    get_user_by_id,
    get_user_by_username_or_email,
    create_user,
    update_user,
    deactivate_user,
    count_active_admins
)

router = APIRouter(
    prefix="/api/admin/users",
    tags=["Administrative User Management"],
    dependencies=[Depends(require_admin)]
)

@router.get("", response_model=List[UserResponse], summary="List all user accounts (Admin only)")
async def list_users() -> List[UserResponse]:
    users = get_all_users()
    return [
        UserResponse(
            id=u["id"],
            username=u["username"],
            email=u["email"],
            role=u["role"],
            employee_name=u.get("employee_name"),
            is_active=bool(u.get("is_active")),
            created_at=u["created_at"],
            updated_at=u["updated_at"]
        )
        for u in users
    ]

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create a new user (Admin only)")
async def create_new_user(user_in: UserCreate) -> UserResponse:
    # 1. Uniqueness check for username and email
    if get_user_by_username_or_email(user_in.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{user_in.username}' is already registered."
        )
    if get_user_by_username_or_email(user_in.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{user_in.email}' is already registered."
        )

    # 2. Hash password with Argon2id
    password_hash = hash_password(user_in.password)

    # 3. Create user
    created = create_user(
        username=user_in.username,
        email=user_in.email,
        password_hash=password_hash,
        role=user_in.role.value,
        employee_name=user_in.employee_name,
        is_active=True
    )

    return UserResponse(
        id=created["id"],
        username=created["username"],
        email=created["email"],
        role=created["role"],
        employee_name=created.get("employee_name"),
        is_active=bool(created.get("is_active")),
        created_at=created["created_at"],
        updated_at=created["updated_at"]
    )

@router.patch("/{user_id}", response_model=UserResponse, summary="Update user account (Admin only)")
async def update_existing_user(user_id: str, updates: UserUpdate) -> UserResponse:
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent demoting the last active administrator
    if user["role"] == "ADMIN" and updates.role and updates.role.value != "ADMIN":
        if count_active_admins() <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the final active administrator."
            )

    # Prevent deactivating the last active administrator
    if user["role"] == "ADMIN" and updates.is_active is False:
        if count_active_admins() <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the final active administrator."
            )

    pw_hash = hash_password(updates.password) if updates.password else None

    updated = update_user(
        user_id=user_id,
        role=updates.role.value if updates.role else None,
        employee_name=updates.employee_name,
        is_active=updates.is_active,
        password_hash=pw_hash
    )

    return UserResponse(
        id=updated["id"],
        username=updated["username"],
        email=updated["email"],
        role=updated["role"],
        employee_name=updated.get("employee_name"),
        is_active=bool(updated.get("is_active")),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.post("/{user_id}/deactivate", summary="Deactivate user account (Admin only)")
async def deactivate_existing_user(user_id: str):
    success, message = deactivate_user(user_id)
    if not success:
        if message == "User not found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return {"detail": message}
