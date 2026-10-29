import uuid
import datetime
from typing import Optional, List, Dict, Any, Tuple
from backend.app.db.database import get_db_connection

def _format_now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def get_user_by_id(user_id: str, db_path: str = None) -> Optional[Dict[str, Any]]:
    with get_db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_user_by_username_or_email(identifier: str, db_path: str = None) -> Optional[Dict[str, Any]]:
    clean_id = identifier.strip().lower()
    with get_db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
            (clean_id, clean_id)
        )
        row = cursor.fetchone()
        return dict(row) if row else None

def get_all_users(db_path: str = None) -> List[Dict[str, Any]]:
    with get_db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users ORDER BY created_at ASC")
        return [dict(row) for row in cursor.fetchall()]

def count_active_admins(db_path: str = None) -> int:
    with get_db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = 1")
        return cursor.fetchone()[0]

def create_user(
    username: str,
    email: str,
    password_hash: str,
    role: str,
    employee_name: Optional[str] = None,
    is_active: bool = True,
    user_id: Optional[str] = None,
    db_path: str = None
) -> Dict[str, Any]:
    uid = user_id or str(uuid.uuid4())
    now = _format_now()
    clean_username = username.strip()
    clean_email = email.strip().lower()
    active_int = 1 if is_active else 0

    with get_db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (id, username, email, password_hash, role, employee_name, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (uid, clean_username, clean_email, password_hash, role, employee_name, active_int, now, now)
        )
        conn.commit()
    return get_user_by_id(uid, db_path=db_path)

def update_user(
    user_id: str,
    role: Optional[str] = None,
    employee_name: Optional[str] = None,
    is_active: Optional[bool] = None,
    password_hash: Optional[str] = None,
    db_path: str = None
) -> Optional[Dict[str, Any]]:
    updates = []
    params = []

    if role is not None:
        updates.append("role = ?")
        params.append(role)
    if employee_name is not None:
        updates.append("employee_name = ?")
        params.append(employee_name)
    if is_active is not None:
        updates.append("is_active = ?")
        params.append(1 if is_active else 0)
    if password_hash is not None:
        updates.append("password_hash = ?")
        params.append(password_hash)

    if not updates:
        return get_user_by_id(user_id, db_path=db_path)

    updates.append("updated_at = ?")
    params.append(_format_now())
    params.append(user_id)

    with get_db_connection(db_path) as conn:
        cursor = conn.cursor()
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, tuple(params))
        conn.commit()

    return get_user_by_id(user_id, db_path=db_path)

def deactivate_user(user_id: str, db_path: str = None) -> Tuple[bool, str]:
    user = get_user_by_id(user_id, db_path=db_path)
    if not user:
        return False, "User not found"

    if user["role"] == "ADMIN" and user["is_active"] == 1:
        if count_active_admins(db_path=db_path) <= 1:
            return False, "Cannot deactivate the final active administrator"

    update_user(user_id, is_active=False, db_path=db_path)
    return True, "User deactivated successfully"

