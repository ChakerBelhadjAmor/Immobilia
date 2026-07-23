"""Raw external API calls for property enrichment (ported from n8n workflow)."""
import csv
import io
from typing import Any

import httpx

from app.services.geo_utils import haversine_km

_CRIME_CSV_CACHE: dict[str, list[dict[str, str]]] = {}
CRIME_DATASET_URL = "https://www.data.gouv.fr/api/1/datasets/r/2b27a675-e3bf-41ef-a852-5fb9ab483967"
CRIME_TARGET_INDICATORS = [
    "Cambriolages de logement",
    "Vols avec armes",
    "Vols violents sans arme",
    "Violences physiques hors cadre familial",
    "Destructions et dégradations volontaires",
]


async def geocode_address(address: str) -> dict[str, Any] | None:
    """Geocode a free-text address via the official French BAN geocoding API."""
    url = "https://data.geopf.fr/geocodage/search"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params={"q": address, "limit": 1})
        resp.raise_for_status()
        data = resp.json()

    features = data.get("features", [])
    if not features:
        return None

    feature = features[0]
    props = feature.get("properties", {})
    coords = feature.get("geometry", {}).get("coordinates", [])
    if len(coords) < 2:
        return None

    return {
        "address": props.get("label", address),
        "lon": coords[0],
        "lat": coords[1],
        "postcode": props.get("postcode"),
        "citycode": props.get("citycode"),
        "city": props.get("city"),
    }


async def fetch_schools(lat: float, lon: float, postcode: str) -> list[dict[str, Any]]:
    url = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params={"where": f'code_postal="{postcode}"', "limit": 20})
        resp.raise_for_status()
        results = resp.json().get("results", [])

    scored = []
    for s in results:
        la, lo = s.get("latitude"), s.get("longitude")
        if la is None or lo is None:
            continue
        scored.append({
            "nom": s.get("nom_etablissement"),
            "type": s.get("type_etablissement"),
            "code_postal": s.get("code_postal"),
            "distance_km": haversine_km(lat, lon, float(la), float(lo)),
        })
    return sorted(scored, key=lambda x: x["distance_km"])[:3]


async def fetch_universities(lat: float, lon: float, postcode: str) -> list[dict[str, Any]]:
    url = (
        "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/"
        "datasets/fr-esr-principaux-etablissements-enseignement-superieur/records"
    )
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params={"where": f'code_postal_uai="{postcode}"', "limit": 20})
        resp.raise_for_status()
        results = resp.json().get("results", [])

    scored = []
    for u in results:
        la = u.get("latitude") or (u.get("geo_point_2d") or {}).get("lat")
        lo = u.get("longitude") or (u.get("geo_point_2d") or {}).get("lon")
        if la is None or lo is None:
            continue
        nom = (
            u.get("nom_etablissement")
            or u.get("uo_lib")
            or u.get("denomination_principale")
            or u.get("libelle")
        )
        scored.append({"nom": nom, "distance_km": haversine_km(lat, lon, float(la), float(lo))})
    return sorted(scored, key=lambda x: x["distance_km"])[:3]


async def fetch_air_quality(lat: float, lon: float) -> dict[str, Any]:
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params: dict[str, str | int | float] = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "pm10,pm2_5,european_aqi",
        "current": "european_aqi",
        "forecast_days": 1,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    current = data.get("current", {})
    hourly = data.get("hourly", {})
    pm10 = hourly.get("pm10", [])
    pm25 = hourly.get("pm2_5", [])
    return {
        "european_aqi": current.get("european_aqi"),
        "pm10": pm10[0] if pm10 else None,
        "pm2_5": pm25[0] if pm25 else None,
        "source": "Open-Meteo (CAMS Europe, résolution 11km)",
    }


async def fetch_hospitals(lat: float, lon: float) -> list[dict[str, Any]]:
    url = "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/osm-france-healthcare/records"
    where = f"type=\"hospital\" AND distance(meta_geo_point, geom'POINT({lon} {lat})', 5000m)"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params={"where": where, "limit": 10})
        resp.raise_for_status()
        results = resp.json().get("results", [])

    scored = []
    for h in results:
        la = h.get("lat") or h.get("latitude")
        lo = h.get("lon") or h.get("longitude")
        if la is None or lo is None:
            continue
        nom = h.get("name") or h.get("nom") or h.get("nom_etablissement") or "Nom non trouvé"
        scored.append({"nom": nom, "distance_km": haversine_km(lat, lon, float(la), float(lo))})
    return sorted(scored, key=lambda x: x["distance_km"])[:3]


async def fetch_noise(lat: float, lon: float) -> dict[str, Any]:
    url = "https://noise.discomap.eea.europa.eu/arcgis/rest/services/noiseStoryMap/Noise_exposure_2025/MapServer/identify"
    params: dict[str, str | int] = {
        "geometry": f'{{"x":{lon},"y":{lat}}}',
        "geometryType": "esriGeometryPoint",
        "sr": 4326,
        "tolerance": 5,
        "mapExtent": f"{lon-0.05},{lat-0.05},{lon+0.05},{lat+0.05}",
        "imageDisplay": "400,400,96",
        "layers": "visible:23,24,25,31,32,33",
        "returnGeometry": "false",
        "f": "json",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])
    filtered = [
        r for r in results if r.get("layerName") in ("Road Lden City Area", "Road Lnight City Area")
    ]
    if not filtered:
        return {"statut": "Hors zone couverte"}

    attrs = filtered[0].get("attributes", {})
    return {
        "agglomeration": attrs.get("AGGLOMERAT"),
        "pct_population_exposee_jour": attrs.get("per_city_day"),
        "pct_population_exposee_nuit": attrs.get("per_city_night"),
        "echelle": "Agglomération entière (pas l'adresse précise)",
        "source": "EEA - Noise Directive 2022",
    }


async def _get_crime_csv_rows() -> list[dict[str, str]]:
    if "rows" in _CRIME_CSV_CACHE:
        return _CRIME_CSV_CACHE["rows"]

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        resp = await client.get(CRIME_DATASET_URL)
        resp.raise_for_status()

    reader = csv.DictReader(io.StringIO(resp.text), delimiter=";")
    rows = list(reader)
    _CRIME_CSV_CACHE["rows"] = rows
    return rows


async def fetch_crime(department_code: str | None) -> dict[str, Any]:
    if department_code is None:
        return {"statut": "code_departement manquant"}

    rows = await _get_crime_csv_rows()
    dept_keys = ["Code_departement", "CODDEP", "code_departement", "dep", "departement"]

    matching = [
        r for r in rows if any(r.get(k, "").strip() == department_code for k in dept_keys)
    ]
    if not matching:
        return {"statut": "non trouvé", "code_departement": department_code}

    years = [int(r["annee"]) for r in matching if r.get("annee", "").strip().isdigit()]
    if not years:
        return {"statut": "non trouvé - année illisible", "code_departement": department_code}
    max_year = max(years)

    indicateurs = [
        {
            "indicateur": r["indicateur"],
            "taux_pour_mille": (
                float(r["taux_pour_mille"].replace(",", ".")) if r.get("taux_pour_mille") else None
            ),
            "annee": max_year,
        }
        for r in matching
        if r.get("annee", "").strip() == str(max_year)
        and r.get("indicateur", "").strip() in CRIME_TARGET_INDICATORS
    ][:5]

    return {
        "code_departement": department_code,
        "annee_reference": max_year,
        "indicateurs": indicateurs,
    }
