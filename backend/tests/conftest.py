"""Shared test fixtures.

The schema uses PG-native types (uuid, enum, jsonb, text[]), so tests run against
**real Postgres**, not SQLite. A session-scoped engine builds the schema once; each
test gets a connection wrapped in an outer transaction that is rolled back at the
end. `AsyncSession(join_transaction_mode="create_savepoint")` turns endpoint
`commit()`s into savepoints, so nothing leaks between tests. `get_db` is overridden
to hand the app that same session.
"""

import json
from collections.abc import AsyncGenerator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    create_async_engine,
)

from app.core.config import get_settings
from app.core.deps import get_db
from app.core.redis import close_redis
from app.main import app
from app.models import Base


@pytest.fixture(autouse=True)
async def _reset_redis() -> AsyncGenerator[None]:
    # The redis client is a lazy global; close it on the test's own event loop so
    # the next test (a fresh loop) recreates it instead of reusing a dead one.
    yield
    await close_redis()


@pytest.fixture
async def engine() -> AsyncGenerator[AsyncEngine]:
    # Function-scoped: keeps the asyncpg pool on the same event loop as the test,
    # avoiding cross-loop "operation in progress" errors. `create_all` is a
    # checkfirst no-op against the already-migrated dev DB.
    eng = create_async_engine(get_settings().database_url)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest.fixture
async def connection(engine: AsyncEngine) -> AsyncGenerator[AsyncConnection]:
    async with engine.connect() as conn:
        await conn.begin()
        yield conn
        await conn.rollback()


@pytest.fixture
async def db_session(connection: AsyncConnection) -> AsyncGenerator[AsyncSession]:
    async with AsyncSession(
        bind=connection,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    ) as session:
        yield session


CANNED_EXTRACTION: dict[str, Any] = {
    "extracted": {
        "title": "Bel appartement lumineux",
        "type": "appartement",
        "transaction": "vente",
        "price": 300000,
        "surface": 75,
        "rooms": 4,
        "bedrooms": 3,
        "bathrooms": 1,
        "address": "12 rue de la République",
        "city": "Lyon",
        "postal_code": "69002",
    },
    "missing_fields": ["description"],
    "questions": ["Pouvez-vous décrire le bien en quelques phrases ?"],
}


@pytest.fixture
def mock_mistral(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    """Patch the agent's Mistral client with a fake returning `CANNED_EXTRACTION`."""

    content = json.dumps(CANNED_EXTRACTION)

    class _Message:
        def __init__(self) -> None:
            self.content = content

    class _Choice:
        def __init__(self) -> None:
            self.message = _Message()

    class _Response:
        def __init__(self) -> None:
            self.choices = [_Choice()]

    class _Chat:
        async def complete_async(self, **_: Any) -> _Response:
            return _Response()

    class _FakeClient:
        def __init__(self) -> None:
            self.chat = _Chat()

    monkeypatch.setattr(
        "app.agents.seller.listing_assistant.get_mistral",
        lambda: _FakeClient(),
    )
    return CANNED_EXTRACTION


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    async def _override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
