import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.chat import ChatSession
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ComparisonResult,
    StartChatRequest,
    StartChatResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=StartChatResponse)
async def start_chat(
    payload: StartChatRequest, db: AsyncSession = Depends(get_db)
) -> StartChatResponse:
    try:
        session, reply = await chat_service.start_session(
            db, payload.property_ids, payload.addresses
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return StartChatResponse(session_id=session.id, reply=reply)


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def post_message(
    session_id: uuid.UUID, payload: ChatMessageRequest, db: AsyncSession = Depends(get_db)
) -> ChatMessageResponse:
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    reply_text, comparison = await chat_service.handle_message(db, session, payload.message)
    return ChatMessageResponse(reply=reply_text, comparison=ComparisonResult(**comparison))