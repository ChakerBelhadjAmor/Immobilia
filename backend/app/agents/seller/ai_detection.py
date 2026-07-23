"""Seller Agent V-2 — AI-generated image detection (via Hugging Face)."""

import httpx

from app.core.config import get_settings

HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/Organika/sdxl-detector"


async def detect_ai_generated(image_bytes: bytes) -> dict[str, float | bool]:
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {settings.hf_api_token}",
        "Content-Type": "image/jpeg",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(HF_MODEL_URL, headers=headers, content=image_bytes)
        response.raise_for_status()
        results = response.json()

    ai_result = next(
        (r for r in results if r["label"].lower() in ("artificial", "fake", "ai")), None
    )
    confidence = ai_result["score"] if ai_result else 0.0

    return {"ai_generated": confidence > 0.5, "confidence": round(confidence, 2)}