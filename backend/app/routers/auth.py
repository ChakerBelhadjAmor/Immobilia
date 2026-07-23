"""Auth endpoints — register, login, logout, me.

Layering rule (see the deleted `_example` trio): routers hold no business logic;
they call `auth_service` and depend on `get_current_user` for protected routes.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.identity import User
from app.schemas.auth import TokenResponse, UserLogin, UserRead, UserRegister
from app.services import auth_service
from app.services.auth_service import EmailTakenError

router = APIRouter(prefix="/auth", tags=["auth"])

_bearer = HTTPBearer(auto_error=True)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    try:
        return await auth_service.register_user(db, payload)
    except EmailTakenError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    user = await auth_service.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = await auth_service.open_session(user)
    return TokenResponse(access_token=token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> None:
    await auth_service.close_session(credentials.credentials)


@router.get("/me", response_model=UserRead)
async def me(user: Annotated[User, Depends(get_current_user)]) -> User:
    return user
