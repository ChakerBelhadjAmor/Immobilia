"""Geo helper functions."""
import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return round(r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


def department_from_citycode(citycode: str | None, postcode: str | None) -> str | None:
    code = citycode or postcode
    if not code:
        return None
    code = str(code).strip()
    if len(code) < 2:
        return None
    if code[:2] in ("2A", "2B"):
        return code[:2]
    if code[:2] in ("97", "98"):
        return code[:3]
    return code[:2]