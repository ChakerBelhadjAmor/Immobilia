"""Async SQLAlchemy engine, session factory, and declarative Base.

Every ORM model subclasses `Base`. Models are re-exported from
`app.models.__init__` so `Base.metadata` sees all tables for Alembic
autogenerate.
"""

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Declarative base shared by all ORM models."""


engine: AsyncEngine = create_async_engine(
    get_settings().database_url,
    pool_pre_ping=True,
)

async_session: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    expire_on_commit=False,
)
