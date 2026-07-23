"""Identity models — `users` (docs §2.1).

`role` drives which dashboard the user sees. `password_hash` backs
`app.core.security`; social-proof fields (`rating`, `review_count`) are defaulted,
never set at register.
"""

from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Date, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import UserRole
from app.models.pg_types import user_role_enum


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    first_name: Mapped[str]
    last_name: Mapped[str]
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str]
    avatar_url: Mapped[str | None] = mapped_column(default=None)
    role: Mapped[UserRole] = mapped_column(user_role_enum)
    member_since: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    verified: Mapped[bool] = mapped_column(default=False)
    rating: Mapped[Decimal] = mapped_column(Numeric, default=Decimal(0))
    review_count: Mapped[int] = mapped_column(default=0)
