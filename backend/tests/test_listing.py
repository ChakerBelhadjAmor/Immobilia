"""Seller listing endpoints — intake (mocked agent) and confirmed create."""

from typing import Any

from httpx import AsyncClient


async def _seller_headers(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/auth/register",
        json={
            "first_name": "Chaker",
            "last_name": "Ben",
            "email": email,
            "password": "pw",
            "role": "vendeur",
        },
    )
    login = await client.post("/auth/login", json={"email": email, "password": "pw"})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


async def test_intake_returns_structured_fields(
    client: AsyncClient, mock_mistral: dict[str, Any]
) -> None:
    headers = await _seller_headers(client, "intake@example.com")
    resp = await client.post(
        "/seller/listings/intake",
        headers=headers,
        json={"transcript": "Appartement T4 à Lyon à vendre, 300 000 euros"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["extracted"]["city"] == "Lyon"
    assert body["missing_fields"] == ["description"]
    assert body["questions"]


async def test_intake_requires_seller_role(client: AsyncClient) -> None:
    await client.post(
        "/auth/register",
        json={
            "first_name": "A",
            "last_name": "B",
            "email": "buyer@example.com",
            "password": "pw",
            "role": "acheteur",
        },
    )
    login = await client.post("/auth/login", json={"email": "buyer@example.com", "password": "pw"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    resp = await client.post("/seller/listings/intake", headers=headers, json={"transcript": "x"})
    assert resp.status_code == 403


async def test_create_listing_persists_draft(client: AsyncClient) -> None:
    headers = await _seller_headers(client, "create@example.com")
    payload = {
        "title": "Bel appartement",
        "description": "Rénové, lumineux, proche métro.",
        "type": "appartement",
        "transaction": "vente",
        "price": 300000,
        "surface": 75,
        "rooms": 4,
        "bedrooms": 3,
        "bathrooms": 1,
        "address": "12 rue de la République",
        "city": "Lyon",
        "postal_code": "69002",
        "features": ["balcon", "ascenseur"],
    }
    resp = await client.post("/seller/listings", headers=headers, json=payload)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "brouillon"
    assert body["city"] == "Lyon"
    assert body["id"]
