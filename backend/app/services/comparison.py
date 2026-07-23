"""Comparison prompt building, ported from the n8n Mistral workflow."""
import json
from typing import Any

from app.models.dvf_property import DvfProperty

FIRST_QUESTION = (
    "Merci ! Pour mieux vous conseiller, parlez-moi un peu de votre situation : "
    "vivez-vous seul(e), en couple, avez-vous des enfants (et leur âge) ? "
    "Cela m'aide à cibler ce qui compte le plus pour vous dans ce choix."
)


def summarize_property(property_: DvfProperty, enrichment: dict[str, Any]) -> dict[str, Any]:
    schools = enrichment.get("schools") or []
    universities = enrichment.get("universities") or []
    hospitals = enrichment.get("hospitals") or []
    return {
        "id": str(property_.id),
        "adresse": property_.address,
        "ville": property_.city,
        "prix": property_.price,
        "surface": property_.surface,
        "type_bien": property_.property_type,
        "ecole_proche": schools[0] if schools else None,
        "universite_proche": universities[0] if universities else None,
        "hopital_proche": hospitals[0] if hospitals else None,
        "qualite_air": enrichment.get("air_quality"),
        "bruit": enrichment.get("noise"),
        "delinquance": enrichment.get("crime"),
    }


def build_comparison_prompt(
    properties_summaries: list[dict[str, Any]], household_context: str
) -> tuple[str, str]:
    system_prompt = (
        "Tu es un assistant immobilier neutre et factuel. Tu compares des offres "
        "immobilières uniquement à partir des données fournies, sans jamais inventer "
        "de chiffre ni de fait non présent dans les données. "
        "Avant de comparer, déduis implicitement les priorités probables de "
        "l'utilisateur à partir de sa situation personnelle décrite (ex: famille avec "
        "jeunes enfants -> écoles, sécurité, calme ; jeune actif seul -> transports, vie "
        "de quartier ; retraité -> calme, accès santé). Utilise cette déduction "
        "uniquement pour orienter l'emphase de ta comparaison, jamais pour inventer "
        "des données. Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, "
        "selon ce schéma exact : "
        '{ "comparaison": [ { "id": string, "avantages": string[], "inconvenients": string[] } ], '
        '"synthese_globale": string }'
    )
    user_prompt = (
        f"Situation de l'utilisateur : {household_context}\n\n"
        f"Voici {len(properties_summaries)} offres immobilières à comparer. Données (JSON) :\n"
        f"{json.dumps(properties_summaries, default=str, ensure_ascii=False)}"
    )
    return system_prompt, user_prompt