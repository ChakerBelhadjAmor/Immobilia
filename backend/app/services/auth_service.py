"""Auth business logic — registration, credential check, Redis-backed sessions.

Session scheme (docs §4): a JWT is issued *and* mirrored under `session:{token}`
in Redis with a 7d TTL, so a logout (`DEL`) revokes a token before it expires.
Services never import FastAPI; the router maps `EmailTakenError` to an HTTP 409.
"""

from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.redis import get_redis
from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.identity import User
from app.schemas.auth import UserRegister


class EmailTakenError(Exception):
    """Raised when registering an email that already exists."""


def _session_key(token: str) -> str:
    return f"session:{token}"


async def register_user(db: AsyncSession, payload: UserRegister) -> User:
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise EmailTakenError(payload.email)
    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


async def open_session(user: User) -> str:
    token = create_access_token(subject=str(user.id))
    ttl = get_settings().session_ttl_seconds
    await get_redis().set(_session_key(token), str(user.id), ex=ttl)
    return token


async def resolve_session(token: str) -> str | None:
    """Return the user id if the JWT is valid *and* the session is still live."""
    try:
        decode_token(token)
    except JWTError:
        return None
    user_id = await get_redis().get(_session_key(token))
    return user_id if isinstance(user_id, str) else None


async def close_session(token: str) -> None:
    await get_redis().delete(_session_key(token))
