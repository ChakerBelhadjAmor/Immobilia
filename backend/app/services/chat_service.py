"""Chat session orchestration: start session, handle messages, run comparison."""
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatMessage, ChatSession
from app.services.comparison import FIRST_QUESTION, build_comparison_prompt, summarize_property
from app.services.enrichment import enrich_property
from app.services.mistral_client import call_mistral_json
from app.services.property_resolver import get_property_by_id, resolve_property_from_address


async def start_session(
    db: AsyncSession, property_ids: list[uuid.UUID], addresses: list[str]
) -> tuple[ChatSession, str]:
    resolved_ids = []

    for pid in property_ids:
        prop = await get_property_by_id(db, pid)
        if prop:
            resolved_ids.append(str(prop.id))

    for addr in addresses:
        prop = await resolve_property_from_address(db, addr)
        if prop:
            resolved_ids.append(str(prop.id))

    if len(resolved_ids) < 2:
        raise ValueError("Il faut au moins 2 biens valides à comparer")

    session = ChatSession(property_ids=resolved_ids)
    db.add(session)
    await db.flush()

    db.add(ChatMessage(session_id=session.id, role="assistant", content=FIRST_QUESTION))
    await db.commit()
    await db.refresh(session)
    return session, FIRST_QUESTION


async def handle_message(
    db: AsyncSession, session: ChatSession, message: str
) -> tuple[str, dict[str, Any]]:
    db.add(ChatMessage(session_id=session.id, role="user", content=message))
    await db.commit()

    # Cumulative context: every user message so far refines the comparison
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id, ChatMessage.role == "user")
        .order_by(ChatMessage.created_at)
    )
    household_context = " ".join(m.content for m in result.scalars().all())

    properties = []
    for pid in session.property_ids:
        prop = await get_property_by_id(db, uuid.UUID(pid))
        if prop:
            properties.append(prop)

    summaries = []
    for prop in properties:
        enrichment = await enrich_property(db, prop)
        summaries.append(summarize_property(prop, enrichment))

    system_prompt, user_prompt = build_comparison_prompt(summaries, household_context)
    comparison = await call_mistral_json(system_prompt, user_prompt)

    reply_text = comparison.get("synthese_globale", "Voici la comparaison des biens sélectionnés.")
    db.add(ChatMessage(session_id=session.id, role="assistant", content=reply_text))
    await db.commit()

    return reply_text, comparison