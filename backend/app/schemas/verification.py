
from pydantic import BaseModel


class VerificationRequest(BaseModel):
    property_id: int


class VerificationIssue(BaseModel):
    type: str
    detail: str
    severity: str  # "low" | "medium" | "high"


class AIGeneratedFlag(BaseModel):
    ai_generated: bool
    confidence: float


class VerificationResult(BaseModel):
    property_id: int
    quality_score: float
    issues: list[VerificationIssue] = []
    ai_generated_flag: AIGeneratedFlag | None = None
