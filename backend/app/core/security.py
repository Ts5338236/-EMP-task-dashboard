import uuid
import datetime
from typing import Optional, Dict, Any, Tuple
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHash
import jwt
from backend.app.core.config import settings

# Initialize Argon2id password hasher with secure modern parameters
_password_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    """
    Hashes a password using Argon2id.
    """
    return _password_hasher.hash(password)

def verify_password(hash_value: str, plain_password: str) -> bool:
    """
    Verifies a plaintext password against an Argon2id hash in constant time.
    """
    try:
        return _password_hasher.verify(hash_value, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHash):
        return False

def create_access_token(
    user_id: str,
    username: str,
    role: str,
    expires_delta: Optional[datetime.timedelta] = None
) -> Tuple[str, int]:
    """
    Generates a cryptographically signed JWT access token.
    Returns (token_string, expires_in_seconds).
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expires_in_seconds = int((expire - now).total_seconds())

    payload: Dict[str, Any] = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4())
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return token, expires_in_seconds

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token using the explicitly configured algorithm.
    Raises jwt.PyJWTError on invalid/expired tokens.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat"]}
    )
