"""Auth flow — register → login → /me → logout → /me 401."""

from httpx import AsyncClient

_USER = {
    "first_name": "Chaker",
    "last_name": "Ben",
    "email": "chaker.seller@example.com",
    "password": "s3cret-pw",
    "role": "vendeur",
}


async def test_auth_full_flow(client: AsyncClient) -> None:
    reg = await client.post("/auth/register", json=_USER)
    assert reg.status_code == 201, reg.text
    assert reg.json()["email"] == _USER["email"]
    assert "password_hash" not in reg.json()

    login = await client.post(
        "/auth/login", json={"email": _USER["email"], "password": _USER["password"]}
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = await client.get("/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["role"] == "vendeur"

    logout = await client.post("/auth/logout", headers=headers)
    assert logout.status_code == 204

    after = await client.get("/auth/me", headers=headers)
    assert after.status_code == 401


async def test_register_duplicate_email(client: AsyncClient) -> None:
    payload = {**_USER, "email": "dup@example.com"}
    first = await client.post("/auth/register", json=payload)
    assert first.status_code == 201
    second = await client.post("/auth/register", json=payload)
    assert second.status_code == 409


async def test_login_wrong_password(client: AsyncClient) -> None:
    payload = {**_USER, "email": "wrongpw@example.com"}
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/login", json={"email": payload["email"], "password": "nope"})
    assert resp.status_code == 401
