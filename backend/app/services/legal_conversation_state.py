"""Redis-backed conversation state for the Legal Agent."""

import json
from datetime import UTC, datetime
from typing import Any

from redis.exceptions import RedisError

from app.core.config import get_settings
from app.core.redis import get_redis


class LegalConversationStateService:
    """Persist legal conversation turns by user and conversation id.

    Redis is the primary store because legal routing needs fast conversational
    context. The in-memory fallback keeps local development usable when Redis is
    not running.
    """

    def __init__(self) -> None:
        self._fallback: dict[str, list[dict[str, Any]]] = {}

    async def load_history(
        self,
        user_id: str,
        conversation_id: str | None,
        limit: int = 12,
    ) -> list[dict[str, Any]]:
        if not conversation_id:
            return []

        key = self._key(user_id, conversation_id)
        try:
            redis = get_redis()
            raw_items = await redis.lrange(key, max(0, -limit), -1)
            return [json.loads(item) for item in raw_items]
        except (RedisError, OSError, json.JSONDecodeError):
            return self._fallback.get(key, [])[-limit:]

    async def append_turn(
        self,
        user_id: str,
        conversation_id: str | None,
        role: str,
        payload: dict[str, Any],
    ) -> None:
        if not conversation_id:
            return

        key = self._key(user_id, conversation_id)
        item = {
            "role": role,
            "payload": payload,
            "created_at": datetime.now(UTC).isoformat(),
        }
        serialized = json.dumps(item, default=str, ensure_ascii=False)
        ttl = get_settings().session_ttl_seconds

        try:
            redis = get_redis()
            await redis.rpush(key, serialized)
            await redis.ltrim(key, -50, -1)
            await redis.expire(key, ttl)
        except (RedisError, OSError):
            self._fallback.setdefault(key, []).append(item)
            self._fallback[key] = self._fallback[key][-50:]

    def _key(self, user_id: str, conversation_id: str) -> str:
        return f"legal:conversation:{user_id}:{conversation_id}"


legal_conversation_state = LegalConversationStateService()

