"""Seller Agent 1 unit test — deterministic and offline via `mock_mistral`."""

from typing import Any

from app.agents.seller.listing_assistant import ListingAssistantAgent


async def test_listing_agent_parses_extraction(mock_mistral: dict[str, Any]) -> None:
    agent = ListingAssistantAgent()

    result = await agent.run({"transcript": "Appartement T4 à Lyon, 300 000 euros"})

    assert agent.name == "seller.listing_assistant"
    assert result["extracted"]["city"] == "Lyon"
    assert result["extracted"]["bedrooms"] == 3
    assert result["missing_fields"] == ["description"]
    assert result["questions"]


async def test_listing_agent_merges_partial(mock_mistral: dict[str, Any]) -> None:
    agent = ListingAssistantAgent()

    result = await agent.run({"transcript": "…", "partial": {"description": "Rénové récemment"}})

    # Human-confirmed partial fields override / augment the extraction.
    assert result["extracted"]["description"] == "Rénové récemment"
