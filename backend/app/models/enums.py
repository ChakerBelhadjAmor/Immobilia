"""PostgreSQL enum types, mirrored 1:1 from the frontend TS unions.

Member name == value everywhere, so SQLAlchemy's default (name-based) persistence
stores the exact French strings the frontend sends — no `values_callable` needed.
Values must stay in sync with `../immobilia_frontend/src/types/index.ts` (docs §2).
"""

from enum import StrEnum


class UserRole(StrEnum):
    vendeur = "vendeur"
    acheteur = "acheteur"
    investisseur = "investisseur"


class PropertyType(StrEnum):
    appartement = "appartement"
    maison = "maison"
    studio = "studio"
    loft = "loft"
    duplex = "duplex"
    immeuble = "immeuble"


class TransactionType(StrEnum):
    vente = "vente"
    location = "location"


class PropertyStatus(StrEnum):
    disponible = "disponible"
    sous_offre = "sous_offre"
    loue = "loue"
    vendu = "vendu"
    brouillon = "brouillon"
    en_verification = "en_verification"


class EnergyClass(StrEnum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


class PropertySource(StrEnum):
    plateforme = "plateforme"
    web = "web"


class MediaKind(StrEnum):
    photo = "photo"
    video = "video"
    virtual_tour = "virtual_tour"
    floor_plan = "floor_plan"


class PoiKind(StrEnum):
    ecole = "ecole"
    universite = "universite"
    transport = "transport"
    commerce = "commerce"
    parc = "parc"
    hopital = "hopital"
    bruit = "bruit"
    pollution = "pollution"
    embouteillage = "embouteillage"


class NeighborhoodTrend(StrEnum):
    hausse = "hausse"
    stable = "stable"
    baisse = "baisse"


class OfferStatus(StrEnum):
    en_attente = "en_attente"
    acceptee = "acceptee"
    refusee = "refusee"
    expiree = "expiree"


class AbuseKind(StrEnum):
    scam = "scam"
    comportement = "comportement"


class AbuseStatus(StrEnum):
    en_cours = "en_cours"
    traite = "traite"


class NotificationKind(StrEnum):
    offre_similaire = "offre_similaire"
    message = "message"
    prix = "prix"
    visite = "visite"
    systeme = "systeme"
    alerte = "alerte"


class RiskLevel(StrEnum):
    faible = "faible"
    modere = "modere"
    eleve = "eleve"


class IssueSeverity(StrEnum):
    info = "info"
    warning = "warning"
    error = "error"
