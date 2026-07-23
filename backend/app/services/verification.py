from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.seller.ai_detection import detect_ai_generated
from app.agents.seller.quality import analyze_raw_quality
from app.agents.seller.verification import VerificationAgent
from app.schemas.verification import AIGeneratedFlag, VerificationIssue, VerificationResult

_agent = VerificationAgent()


async def verify_property(
    db: AsyncSession, property_id: int, description: str, image_bytes: bytes
) -> VerificationResult:
    ai_result = await _agent.run(
        {"description": description, "image_bytes": image_bytes}
    )
    raw_issues = analyze_raw_quality(image_bytes)
    ai_flag_raw = await detect_ai_generated(image_bytes)

    issues = [
        VerificationIssue(type="quality", detail=i, severity="medium")
        for i in ai_result.get("quality_issues", [])
    ] + [VerificationIssue(**issue) for issue in raw_issues]

    base_score = ai_result.get("confidence", 0.0) if ai_result.get("matches_description") else 0.0
    penalty = 0.1 * len(raw_issues)
    quality_score = max(base_score - penalty, 0.0)

    return VerificationResult(
        property_id=property_id,
        quality_score=quality_score,
        issues=issues,
        ai_generated_flag=AIGeneratedFlag(**ai_flag_raw),
    )