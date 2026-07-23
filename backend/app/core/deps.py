"""FastAPI dependencies.

Thin wiring between the request layer and core resources. Endpoints depend on
these; services do not import FastAPI.
"""

from collections.abc import AsyncGenerator, Awaitable, Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import async_session
from app.core.security import decode_token
from app.models.enums import UserRole
from app.models.identity import User
from app.services import auth_service

_bearer = HTTPBearer(auto_error=True)
_bearer_optional = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session() as session:
        yield session


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_optional)],
) -> str:
    """Identify the caller from the bearer token's `sub` claim.

    Decodes with the `app.core.security` helpers only — the investor module only
    needs the subject id an ownership check can compare against, not the full
    user row or a session lookup. Seller/auth endpoints use `get_current_user`,
    which additionally validates the Redis session.
    """
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    try:
        payload = decode_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token is missing a subject")
    return subject


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Resolve the bearer token to a live user (valid JWT + non-revoked session)."""
    user_id = await auth_service.resolve_session(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await db.get(User, UUID(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(role: UserRole) -> Callable[[User], Awaitable[User]]:
    """Dependency factory: 403 unless the current user holds `role`."""

    async def _guard(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role '{role.value}'",
            )
        return user

    return _guard
