"""ORM model registry.

Import every model module here so `Base.metadata` is fully populated before
Alembic autogenerate runs. Add each domain module as it gains real tables.
"""

from app.core.db import Base
from app.models import (  # noqa: F401  (re-exported for metadata registration)
    coloc,
    identity,
    investor,
    legal,
    messaging,
    properties,
    transactions,
)

__all__ = ["Base"]
