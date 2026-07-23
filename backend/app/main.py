"""Application entrypoint — composition root only.

Creates the FastAPI app, mounts the API router, and manages the lifecycle of
shared clients. No endpoints live here; they belong to routers.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.db import engine
from app.core.minio import ensure_buckets
from app.core.qdrant import close_qdrant
from app.core.redis import close_redis
from app.routers import api_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
    # Startup: object storage buckets must exist before the first media upload.
    ensure_buckets()
    yield
    # Shutdown: lazily-opened clients get a clean close.
    await close_redis()
    await close_qdrant()
    await engine.dispose()


app = FastAPI(title="Immobil'IA API", version="0.1.0", lifespan=lifespan)
app.include_router(api_router)
