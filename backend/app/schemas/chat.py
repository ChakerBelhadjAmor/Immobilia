import uuid

from pydantic import BaseModel


class StartChatRequest(BaseModel):
    property_ids: list[uuid.UUID] = []
    addresses: list[str] = []


class StartChatResponse(BaseModel):
    session_id: uuid.UUID
    reply: str


class ChatMessageRequest(BaseModel):
    message: str


class ComparisonItem(BaseModel):
    id: str
    avantages: list[str]
    inconvenients: list[str]


class ComparisonResult(BaseModel):
    comparaison: list[ComparisonItem]
    synthese_globale: str


class ChatMessageResponse(BaseModel):
    reply: str
    comparison: ComparisonResult