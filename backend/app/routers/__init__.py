"""API router aggregator.

`main.py` mounts `api_router` and nothing else. Include each domain sub-router
here as it lands.
"""

from fastapi import APIRouter

from app.routers import auth, health, investor, legal, seller, verification

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(seller.router)
api_router.include_router(investor.router)
api_router.include_router(verification.router)
api_router.include_router(legal.router)
