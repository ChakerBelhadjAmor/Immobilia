"""One-off script: download real DVF transaction data for chosen communes
and load it into the `dvf_properties` table. Run with: uv run python scripts/seed_dvf.py
"""
import asyncio
import csv
import io
from datetime import date

import httpx

from app.core.db import async_session
from app.models.dvf_property import DvfProperty

COMMUNES = {
    "33063": "Bordeaux",
    "44109": "Nantes",
    "31555": "Toulouse",
}

BASE_URL = "https://files.data.gouv.fr/geo-dvf/latest/csv/2025/communes"


def department_from_insee(insee_code: str) -> str:
    return insee_code[:2]


async def fetch_commune_csv(insee_code: str) -> list[dict[str, str]]:
    dept = department_from_insee(insee_code)
    url = f"{BASE_URL}/{dept}/{insee_code}.csv"
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    reader = csv.DictReader(io.StringIO(resp.text))
    rows: list[dict[str, str]] = []
    seen_ids: set[str] = set()
    for row in reader:
        if row.get("type_local") not in ("Appartement", "Maison"):
            continue
        if not row.get("valeur_fonciere") or not row.get("latitude") or not row.get("longitude"):
            continue
        if row["id_mutation"] in seen_ids:
            continue
        seen_ids.add(row["id_mutation"])
        rows.append(row)
    return rows


def build_address(row: dict[str, str]) -> str:
    parts = [row.get("adresse_numero", ""), row.get("adresse_nom_voie", "")]
    return " ".join(p for p in parts if p).strip() or "Adresse inconnue"


async def seed() -> None:
    async with async_session() as session:
        total = 0
        for insee_code, city_name in COMMUNES.items():
            print(f"Fetching {city_name} ({insee_code})...")
            rows = await fetch_commune_csv(insee_code)
            print(f"  {len(rows)} transactions found")

            for row in rows:
                prop = DvfProperty(
                    dvf_id=row["id_mutation"],
                    address=build_address(row),
                    lat=float(row["latitude"]),
                    lon=float(row["longitude"]),
                    postcode=row.get("code_postal"),
                    citycode=row.get("code_commune"),
                    city=city_name,
                    price=float(row["valeur_fonciere"]),
                    surface=(
                        float(row["surface_reelle_bati"])
                        if row.get("surface_reelle_bati")
                        else None
                    ),
                    property_type=row.get("type_local"),
                    sale_date=(
                        date.fromisoformat(row["date_mutation"])
                        if row.get("date_mutation")
                        else None
                    ),
                )
                session.add(prop)
            total += len(rows)

        await session.commit()
        print(f"Done. Inserted {total} properties.")


if __name__ == "__main__":
    asyncio.run(seed())
