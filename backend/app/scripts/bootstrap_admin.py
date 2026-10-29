import sys
from pathlib import Path

# Ensure backend and root paths are available
_current = Path(__file__).resolve().parent
_backend_dir = _current.parent.parent
_project_root = _backend_dir.parent
for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from backend.app.core.config import settings
from backend.app.core.security import hash_password
from backend.app.db.database import init_db
from backend.app.db.user_repository import (
    count_active_admins,
    get_user_by_username_or_email,
    create_user,
)

def bootstrap_initial_users(db_path: str = None) -> None:
    """
    Safely provisions initial users if not already present.
    Refuses to overwrite or modify existing accounts.
    """
    init_db(db_path=db_path)

    # 1. Admin provisioning
    admin_count = count_active_admins(db_path=db_path)
    if admin_count == 0:
        admin_username = settings.INITIAL_ADMIN_USERNAME or "admin"
        admin_email = settings.INITIAL_ADMIN_EMAIL or "admin@workflow.local"
        admin_password = settings.INITIAL_ADMIN_PASSWORD or "Admin@Workflow2026!"

        existing = get_user_by_username_or_email(admin_username, db_path=db_path)
        if not existing:
            hashed = hash_password(admin_password)
            create_user(
                username=admin_username,
                email=admin_email,
                password_hash=hashed,
                role="ADMIN",
                employee_name="System Administrator",
                is_active=True,
                db_path=db_path
            )
            print(f"[BOOTSTRAP] Initial administrator '{admin_username}' provisioned successfully.")

    # 2. Demo Manager provisioning (for immediate role testing)
    manager_user = get_user_by_username_or_email("manager", db_path=db_path)
    if not manager_user:
        hashed = hash_password("Manager@Workflow2026!")
        create_user(
            username="manager",
            email="manager@workflow.local",
            password_hash=hashed,
            role="MANAGER",
            employee_name="Team Manager",
            is_active=True,
            db_path=db_path
        )
        print("[BOOTSTRAP] Demo Manager account 'manager' provisioned successfully.")

    # 3. Demo Employee provisioning (mapped to Sarah Jenkins)
    sarah_user = get_user_by_username_or_email("sarah", db_path=db_path)
    if not sarah_user:
        hashed = hash_password("Employee@Workflow2026!")
        create_user(
            username="sarah",
            email="sarah@workflow.local",
            password_hash=hashed,
            role="EMPLOYEE",
            employee_name="Sarah Jenkins",
            is_active=True,
            db_path=db_path
        )
        print("[BOOTSTRAP] Demo Employee account 'sarah' (Sarah Jenkins) provisioned successfully.")

if __name__ == "__main__":
    bootstrap_initial_users()

