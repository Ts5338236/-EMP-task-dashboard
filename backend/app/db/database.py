import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from backend.app.core.config import settings

def init_db(db_path: str = None) -> None:
    """
    Initializes the SQLite database schema with users table and performance indexes.
    Safe to run repeatedly (idempotent).
    """
    path_str = db_path or settings.DATABASE_PATH
    is_uri = path_str.startswith("file:")
    if not is_uri:
        Path(path_str).parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(path_str, uri=is_uri) as conn:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL COLLATE NOCASE,
                email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('ADMIN', 'MANAGER', 'EMPLOYEE')),
                employee_name TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        """)
        conn.commit()

@contextmanager
def get_db_connection(db_path: str = None) -> Generator[sqlite3.Connection, None, None]:
    """
    Context manager providing a configured SQLite connection with row factories.
    """
    path_str = db_path or settings.DATABASE_PATH
    is_uri = path_str.startswith("file:")
    if not is_uri:
        Path(path_str).parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(path_str, timeout=10.0, uri=is_uri)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()
