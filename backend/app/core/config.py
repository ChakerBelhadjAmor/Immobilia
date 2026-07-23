"""Application settings.

Single source of truth for configuration. Reads from the environment (and a
local `.env` in development). Field names map case-insensitively to the vars in
`.env.example`.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ---- App ----
    environment: str = "development"
    api_port: int = 8000

    # ---- PostgreSQL ----
    database_url: str = "postgresql+asyncpg://immobilia:immobilia@postgres:5432/immobilia"

    # ---- Qdrant ----
    qdrant_url: str = "http://qdrant:6333"

    # ---- Redis ----
    redis_url: str = "redis://redis:6379/0"

    # ---- MinIO ----
    minio_endpoint: str = "minio:9000"
    minio_root_user: str = "minioadmin"
    minio_root_password: str = "minioadmin"
    minio_secure: bool = False

    # ---- Auth ----
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    session_ttl_seconds: int = 604800

    # ---- Mistral ----
    mistral_api_key: str = ""
    mistral_model: str = "mistral-large-latest"

    # ---- Hugging Face ----
    hf_api_token: str = ""

@lru_cache
def get_settings() -> Settings:
    return Settings()
