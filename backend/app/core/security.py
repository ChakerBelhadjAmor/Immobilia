"""Password hashing and JWT helpers.

Backs `users.password_hash` and the `session:{token}` scheme (docs §4).
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import jwt

from app.core.config import get_settings

# bcrypt only considers the first 72 bytes of the password (and 5.x raises past
# that), so we truncate deterministically before hashing and verifying.
_MAX_BCRYPT_BYTES = 72


def _to_secret(plain: str) -> bytes:
    return plain.encode("utf-8")[:_MAX_BCRYPT_BYTES]


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_to_secret(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(_to_secret(plain), hashed.encode("utf-8"))


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    ttl = expires_delta or timedelta(seconds=settings.session_ttl_seconds)
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": datetime.now(UTC) + ttl,
    }
    token: str = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    result: dict[str, Any] = jwt.decode(
        token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
    )
    return result
