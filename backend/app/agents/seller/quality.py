
"""Raw image quality checks — blur and brightness (no LLM call)."""

import cv2
import numpy as np


def compute_blur_score(image_bytes: bytes) -> float:
    """Higher = sharper. Below ~100 usually means visibly blurry."""
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise ValueError("Impossible de décoder l'image")
    return float(cv2.Laplacian(image, cv2.CV_64F).var())


def compute_brightness_score(image_bytes: bytes) -> float:
    """0-255. Below ~50 = trop sombre, above ~200 = surexposée."""
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise ValueError("Impossible de décoder l'image")
    return float(np.mean(image))


def analyze_raw_quality(image_bytes: bytes) -> list[dict[str, str]]:
    """Returns quality issues in the same shape as VerificationIssue."""
    issues: list[dict[str, str]] = []

    blur = compute_blur_score(image_bytes)
    if blur < 100:
        issues.append(
            {
                "type": "blur",
                "detail": f"Image potentiellement floue (score de netteté : {blur:.0f}).",
                "severity": "medium" if blur > 50 else "high",
            }
        )

    brightness = compute_brightness_score(image_bytes)
    if brightness < 50:
        issues.append(
            {
                "type": "brightness",
                "detail": f"Image sous-exposée (luminosité moyenne : {brightness:.0f}/255).",
                "severity": "medium",
            }
        )
    elif brightness > 200:
        issues.append(
            {
                "type": "brightness",
                "detail": f"Image surexposée (luminosité moyenne : {brightness:.0f}/255).",
                "severity": "low",
            }
        )

    return issues