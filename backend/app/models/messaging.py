"""Messaging & notifications models (docs §2.4).

Tables: conversations, conversation_participants, messages, notifications,
search_history. `messages` is the durable log; live delivery goes over Redis
pub/sub (docs §4) — both, not either.
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import NotificationKind
from app.models.pg_types import notification_kind_enum


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(ForeignKey("properties.id"), index=True)
    last_message: Mapped[str | None] = mapped_column(default=None)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    conversation_id: Mapped[UUID] = mapped_column(ForeignKey("conversations.id"), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    unread_count: Mapped[int] = mapped_column(default=0)


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    conversation_id: Mapped[UUID] = mapped_column(ForeignKey("conversations.id"), index=True)
    sender_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    content: Mapped[str]
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    read: Mapped[bool] = mapped_column(default=False)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[NotificationKind] = mapped_column(notification_kind_enum)
    title: Mapped[str]
    body: Mapped[str]
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    read: Mapped[bool] = mapped_column(default=False)
    href: Mapped[str | None] = mapped_column(default=None)


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    query: Mapped[str]
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    result_count: Mapped[int] = mapped_column(default=0)
    alert_enabled: Mapped[bool] = mapped_column(default=False)
