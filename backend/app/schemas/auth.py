"""Auth request/response schemas.

`UserRead` never exposes `password_hash`. `email` is a plain `str` — no
`email-validator` dependency is declared, so validation stays lightweight.
"""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import UserRole


class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: UserRole


class UserLogin(BaseModel):
    email: str
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    email: str
    role: UserRole
    avatar_url: str | None
    member_since: date
    verified: bool
    rating: Decimal
    review_count: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
