"""Seller Agent V-2 — listing quality & honesty verification."""

import base64
import json
from typing import Any

from app.agents.base.client import get_mistral
from app.agents.base.prompts import load_prompt


class VerificationAgent:
    name = "seller.verification"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        description: str = context["description"]
        image_bytes: bytes = context["image_bytes"]

        client = get_mistral()
        prompt_template = load_prompt("seller/verification.md")
        prompt = prompt_template.format(description=description)

        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        response = await client.chat.complete_async(
            model="pixtral-12b-2409",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": f"data:image/jpeg;base64,{image_b64}",
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        result: dict[str, Any] = json.loads(raw)
        return result